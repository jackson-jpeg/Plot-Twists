/**
 * Room Service — write-through cache backed by Firestore
 *
 * The in-memory Map is the authoritative hot cache for all reads.
 * Every mutation writes to cache immediately, then asynchronously
 * persists to Firestore. Firestore write failures are logged but
 * do not block gameplay. On server restart, rooms are recovered
 * from Firestore.
 */

import type { Room, Player, CardSelection, GameState, RoomSettings } from '../../lib/types'
import { ROOM_CODE_LENGTH, ROOM_CODE_CHARS, ROOM_CLEANUP_INTERVAL, ROOM_INACTIVITY_TIMEOUT } from '../utils/constants'
import { roomToFirestore, firestoreToRoom, type FirestoreRoom } from '../utils/roomSerializer'
import { getDatabase, Collections } from '../db'
import { logger } from '../../lib/logger'
import { cleanupRoomTwists } from './audience.service'
import { reconnectTokenMatches } from '../utils/reconnectToken'
import { CONFIG } from '../utils/config'

// ── Hot cache ──────────────────────────────────────────────

const rooms = new Map<string, Room>()

// Track teleprompter timeouts per room (timers can't be persisted)
const roomTimeouts = new Map<string, NodeJS.Timeout>()
const plotTwistTimeouts = new Map<string, NodeJS.Timeout>()

// Grace period disconnect timers — keyed by `${roomCode}:${playerId}`
const disconnectTimers = new Map<string, NodeJS.Timeout>()

// Debounced writes for high-frequency fields
const debouncedWrites = new Map<string, NodeJS.Timeout>()
// Chunk 3 item 3 — read from CONFIG rather than a third hardcoded copy of the same number.
const DEBOUNCE_MS = CONFIG.persistence.debounceMs

// Simple retry queue for failed Firestore writes
const retryQueue: Array<{ code: string; data: FirestoreRoom; retries?: number }> = []
let retryInterval: NodeJS.Timeout | null = null

// ── Helpers ────────────────────────────────────────────────

function normalizeRecoveredRoom(room: Room, now: number): boolean {
  let changed = false

  for (const player of room.players.values()) {
    if (player.connected !== false) {
      player.connected = false
      changed = true
    }
    if (player.socketId) {
      player.socketId = ''
      changed = true
    }
  }

  if (room.host.connected !== false) {
    room.host.connected = false
    changed = true
  }
  if (room.host.socketId) {
    room.host.socketId = ''
    changed = true
  }

  // Recovering a live performance requires an explicit host resume because in-memory timers are gone.
  if (room.gameState === 'PERFORMING' && now - room.lastActivity <= 2 * 60 * 1000 && !room.isPaused) {
    room.isPaused = true
    changed = true
  }

  return changed
}

function startRetryQueue(): void {
  if (retryInterval) return
  retryInterval = setInterval(async () => {
    if (retryQueue.length === 0) return
    const batch = retryQueue.splice(0, retryQueue.length)
    for (const item of batch) {
      try {
        const db = getDatabase()
        if (db.isConnected()) {
          await db.set(Collections.ROOMS, item.code, item.data)
        }
      } catch (err) {
        logger.error(`[RoomService] Retry failed for room ${item.code} (attempt ${(item.retries ?? 0) + 1}):`, err)
        // Re-queue with retry count, drop after 3 attempts
        const retries = (item.retries ?? 0) + 1
        if (retries < 3) {
          if (retryQueue.length >= CONFIG.persistence.maxRetryQueueSize) retryQueue.shift()
          retryQueue.push({ ...item, retries })
        } else {
          logger.warn(`[RoomService] Dropping room ${item.code} after ${retries} failed retries`)
        }
      }
    }
  }, CONFIG.persistence.retryIntervalMs)
}

/** Persist room to Firestore (fire-and-forget with retry) */
async function persistToFirestore(room: Room): Promise<void> {
  try {
    const db = getDatabase()
    if (!db.isConnected()) return
    const data = roomToFirestore(room)
    await db.set(Collections.ROOMS, room.code, data)
  } catch (err) {
    logger.error(`[RoomService] Firestore write failed for room ${room.code}:`, err)
    if (retryQueue.length >= CONFIG.persistence.maxRetryQueueSize) retryQueue.shift()
    retryQueue.push({ code: room.code, data: roomToFirestore(room) })
  }
}

/** Debounced persist — for high-frequency updates like currentLineIndex */
function persistDebounced(room: Room): void {
  const existing = debouncedWrites.get(room.code)
  if (existing) clearTimeout(existing)
  debouncedWrites.set(room.code, setTimeout(() => {
    debouncedWrites.delete(room.code)
    persistToFirestore(room)
  }, DEBOUNCE_MS))
}

/** Delete room from Firestore */
async function deleteFromFirestore(code: string): Promise<void> {
  try {
    const db = getDatabase()
    if (!db.isConnected()) return
    await db.delete(Collections.ROOMS, code)
  } catch (err) {
    logger.error(`[RoomService] Firestore delete failed for room ${code}:`, err)
  }
}

// ── Public API ─────────────────────────────────────────────

/** Generate a unique room code */
export function generateRoomCode(): string {
  let code = ''
  let attempts = 0
  do {
    if (++attempts > 100) throw new Error('Failed to generate unique room code after 100 attempts')
    code = ''
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      code += ROOM_CODE_CHARS.charAt(Math.floor(Math.random() * ROOM_CODE_CHARS.length))
    }
  } while (rooms.has(code))
  return code
}

// ── Live rooms per creator (Chunk 3 item 2) ────────────────
//
// Rooms are Map entries evicted only after ROOM_INACTIVITY_TIMEOUT (one hour), so an attacker
// who can create rooms faster than they expire holds memory for an hour per room. That is why
// this is a memory-exhaustion vector and not merely a spend problem: the rate limiter caps the
// RATE of creation, this caps the STANDING total.
//
// Deliberately in memory and NOT on the Room: the key is derived from a client IP, and the Room
// is serialised to disk. Keeping it here means no IP is ever written to `data/rooms.json`. The
// cost is that the cap resets on restart, which is the right trade — the alternative is
// persisting PII to survive a restart that also drops every room being counted.
const roomsByCreator = new Map<string, Set<string>>()

export function countLiveRoomsForCreator(creatorKey: string): number {
  const codes = roomsByCreator.get(creatorKey)
  if (!codes) return 0
  // Lazily drop codes whose rooms have since been cleaned up, so a creator is not permanently
  // charged for rooms that no longer exist.
  for (const code of codes) {
    if (!rooms.has(code)) codes.delete(code)
  }
  if (codes.size === 0) {
    roomsByCreator.delete(creatorKey)
    return 0
  }
  return codes.size
}

/** HARNESS ONLY — see server/handlers/room.handler.ts __resetAbuseCountersForTests. */
export function __resetCreatorCountsForTests(): void {
  roomsByCreator.clear()
}

function forgetRoomCreator(code: string): void {
  for (const [key, codes] of roomsByCreator.entries()) {
    if (codes.delete(code) && codes.size === 0) roomsByCreator.delete(key)
  }
}

/** Create a new room and persist */
export function createRoom(room: Room, creatorKey?: string): Room {
  rooms.set(room.code, room)
  if (creatorKey) {
    const codes = roomsByCreator.get(creatorKey) ?? new Set<string>()
    codes.add(room.code)
    roomsByCreator.set(creatorKey, codes)
  }
  persistToFirestore(room)
  return room
}

/** Get room from hot cache only (sync, for hot-path reads) */
export function getRoomFromCache(code: string): Room | undefined {
  return rooms.get(code.toUpperCase())
}

/** Get room — cache first, Firestore fallback */
export async function getRoom(code: string): Promise<Room | null> {
  const upperCode = code.toUpperCase()
  const cached = rooms.get(upperCode)
  if (cached) return cached

  try {
    const db = getDatabase()
    if (!db.isConnected()) return null
    const doc = await db.get<FirestoreRoom>(Collections.ROOMS, upperCode)
    if (!doc) return null
    const room = firestoreToRoom(doc)
    rooms.set(upperCode, room)
    return room
  } catch (err) {
    logger.error(`[RoomService] Firestore read failed for room ${upperCode}:`, err)
    return null
  }
}

/** Update room in cache and persist (immediate or debounced) */
export function updateRoom(room: Room, debounce = false): void {
  rooms.set(room.code, room)
  if (debounce) {
    persistDebounced(room)
  } else {
    persistToFirestore(room)
  }
}

/** Full Firestore write for a room */
export async function persistRoom(room: Room): Promise<void> {
  rooms.set(room.code, room)
  await persistToFirestore(room)
}

/** Delete room from both stores */
export async function deleteRoom(code: string): Promise<void> {
  rooms.delete(code)
  forgetRoomCreator(code)
  // Clean up debounced writes
  const deb = debouncedWrites.get(code)
  if (deb) {
    clearTimeout(deb)
    debouncedWrites.delete(code)
  }
  // Clean up pre-generated twist cache for this room
  cleanupRoomTwists(code)
  await deleteFromFirestore(code)
}

/** Add a player to a room */
export function addPlayer(room: Room, player: Player): void {
  room.players.set(player.id, player)
  room.lastActivity = Date.now()
  rooms.set(room.code, room)
  persistToFirestore(room)
}

/** Remove a player from a room */
export function removePlayer(room: Room, playerId: string): void {
  room.players.delete(playerId)
  room.lastActivity = Date.now()
  rooms.set(room.code, room)
  persistToFirestore(room)
}

/** Set game state */
export function setGameState(room: Room, state: GameState): void {
  room.gameState = state
  room.lastActivity = Date.now()
  rooms.set(room.code, room)
  persistToFirestore(room)
}

/** Check if a room code exists in cache */
export function hasRoom(code: string): boolean {
  return rooms.has(code.toUpperCase())
}

/** Get all active rooms from cache */
export function getActiveRooms(): Room[] {
  return Array.from(rooms.values())
}

/** Get active room count */
export function getActiveRoomCount(): number {
  return rooms.size
}

/** Get all room entries (for iteration) */
export function getRoomEntries(): IterableIterator<[string, Room]> {
  return rooms.entries()
}

// ── Disconnect Grace Period ────────────────────────────────

/** Mark a player as disconnected — start grace timer */
export function markPlayerDisconnected(roomCode: string, socketId: string): { player: Player; room: Room } | null {
  const room = rooms.get(roomCode)
  if (!room) return null

  for (const [playerId, player] of room.players.entries()) {
    if (player.socketId === socketId) {
      player.connected = false
      room.lastActivity = Date.now()
      rooms.set(roomCode, room)
      persistDebounced(room)

      // Store timer key
      const timerKey = `${roomCode}:${playerId}`
      // Clear any existing timer for this player
      const existing = disconnectTimers.get(timerKey)
      if (existing) clearTimeout(existing)

      return { player, room }
    }
  }
  return null
}

/** Set the grace period timer for a disconnected player */
export function setDisconnectTimer(roomCode: string, playerId: string, timer: NodeJS.Timeout): void {
  const timerKey = `${roomCode}:${playerId}`
  const existing = disconnectTimers.get(timerKey)
  if (existing) clearTimeout(existing)
  disconnectTimers.set(timerKey, timer)
}

/** Mark a player as reconnected — cancel grace timer, update socketId */
export function markPlayerReconnected(roomCode: string, playerId: string, newSocketId: string): { player: Player; room: Room } | null {
  const timerKey = `${roomCode}:${playerId}`
  const timer = disconnectTimers.get(timerKey)
  if (timer) {
    clearTimeout(timer)
    disconnectTimers.delete(timerKey)
  }

  const room = rooms.get(roomCode)
  if (!room) return null

  const player = room.players.get(playerId)
  if (!player) return null

  player.connected = true
  player.socketId = newSocketId
  room.lastActivity = Date.now()
  rooms.set(roomCode, room)
  persistDebounced(room)

  // If this player is the host, also update room.host
  if (player.isHost) {
    room.host = player
  }

  return { player, room }
}

// ── Seat lookup ────────────────────────────────────────────
//
// Chunk 2 item 5c DELETED four functions that used to live here:
// `findPlayerByUserId`, `findPlayerBySessionId`, `findPlayerInRoomByUserId` and
// `findPlayerInRoomBySessionId`. Between them they accepted FOUR different strings as proof of
// who you were — `player.uid`, `player.sessionId`, and (in both userId variants) the internal
// `playerId` itself, via `player.uid === userId || playerId === userId`.
//
// That last clause is the one that mattered: it made the room's internal player key a valid
// login. Every additional accepted credential is another thing that must never leak, and D2b
// had already shown those values being broadcast to the whole room in `players_update`.
//
// They are deleted rather than left unused. Only the reconnect path called them, and a dead
// helper named `findPlayerBySessionId` is an invitation for the next reconnect bug to be fixed
// by calling it again. What replaces them are the two below: one verified identity, one
// server-issued secret. Nothing else resolves a seat.

/** Find a player in a room by VERIFIED Clerk subject. The middleware is the only writer of `uid`. */
export function findPlayerInRoomByUid(roomCode: string, uid: string): { playerId: string; player: Player } | null {
  if (!uid) return null
  const room = rooms.get(roomCode.toUpperCase())
  if (!room) return null
  for (const [playerId, player] of room.players.entries()) {
    if (player.uid && player.uid === uid) {
      return { playerId, player }
    }
  }
  return null
}

/**
 * Find a player in a room by the server-issued reconnect token (Chunk 2 item 5b).
 *
 * Compares against the stored SHA-256, in constant time, per seat. Note this walks every player
 * rather than short-circuiting on the first hash mismatch — the loop is over at most seven
 * seats, and matching per-seat is what makes one player's token useless against another's.
 */
export function findPlayerInRoomByReconnectToken(roomCode: string, token: string): { playerId: string; player: Player } | null {
  if (!token) return null
  const room = rooms.get(roomCode.toUpperCase())
  if (!room) return null
  for (const [playerId, player] of room.players.entries()) {
    if (reconnectTokenMatches(token, player.reconnectHash)) {
      return { playerId, player }
    }
  }
  return null
}

/** Remove a player after grace period expires */
export function removePlayerAfterGrace(roomCode: string, playerId: string): { player: Player; room: Room } | null {
  const timerKey = `${roomCode}:${playerId}`
  disconnectTimers.delete(timerKey)

  const room = rooms.get(roomCode)
  if (!room) return null

  const player = room.players.get(playerId)
  if (!player) return null
  // Only remove if still disconnected
  if (player.connected !== false) return null

  removePlayer(room, playerId)
  return { player, room }
}

// ── Timeout Management ─────────────────────────────────────

export function setRoomTimeout(code: string, timeout: NodeJS.Timeout): void {
  // Clear any existing timeout to prevent orphaned timers (e.g., double calculateResults)
  const existing = roomTimeouts.get(code)
  if (existing) clearTimeout(existing)
  roomTimeouts.set(code, timeout)
}

export function getRoomTimeout(code: string): NodeJS.Timeout | undefined {
  return roomTimeouts.get(code)
}

export function clearRoomTimeout(code: string): void {
  const timeout = roomTimeouts.get(code)
  if (timeout) {
    clearTimeout(timeout)
    roomTimeouts.delete(code)
  }
}

export function setPlotTwistTimeout(code: string, timeout: NodeJS.Timeout): void {
  const existing = plotTwistTimeouts.get(code)
  if (existing) clearTimeout(existing)
  plotTwistTimeouts.set(code, timeout)
}

export function getPlotTwistTimeout(code: string): NodeJS.Timeout | undefined {
  return plotTwistTimeouts.get(code)
}

export function clearPlotTwistTimeout(code: string): void {
  const timeout = plotTwistTimeouts.get(code)
  if (timeout) {
    clearTimeout(timeout)
    plotTwistTimeouts.delete(code)
  }
}

/** Clean up all timeouts for a room */
export function clearAllRoomTimeouts(code: string): void {
  clearRoomTimeout(code)
  clearPlotTwistTimeout(code)
  // Clear any disconnect timers for this room
  for (const [key, timer] of disconnectTimers.entries()) {
    if (key.startsWith(`${code}:`)) {
      clearTimeout(timer)
      disconnectTimers.delete(key)
    }
  }
}

// ── Startup Recovery ───────────────────────────────────────

/** Load rooms from Firestore on startup */
export async function loadRoomsFromFirestore(): Promise<void> {
  try {
    const db = getDatabase()
    if (!db.isConnected()) {
      logger.info('[RoomService] Database not connected, skipping room recovery')
      return
    }

    const docs = await db.getAll<FirestoreRoom>(Collections.ROOMS)
    const now = Date.now()
    const twoHours = 2 * 60 * 60 * 1000
    let recovered = 0
    let cleaned = 0

    for (const doc of docs) {
      // Clean up rooms older than 2 hours
      if (now - doc.lastActivity > twoHours) {
        await db.delete(Collections.ROOMS, doc.code).catch(() => {})
        cleaned++
        continue
      }

      const room = firestoreToRoom(doc)
      let changed = normalizeRecoveredRoom(room, now)

      // Stale PERFORMING rooms (>2min since activity) → transition to RESULTS
      if (room.gameState === 'PERFORMING' && now - room.lastActivity > 2 * 60 * 1000) {
        room.gameState = 'RESULTS'
        changed = true
      }

      // LOADING rooms that are stale → back to SELECTION
      if (room.gameState === 'LOADING' && now - room.lastActivity > 2 * 60 * 1000) {
        room.gameState = 'SELECTION'
        changed = true
      }

      rooms.set(room.code, room)

      if (changed) {
        await db.set(Collections.ROOMS, room.code, roomToFirestore(room))
      }

      recovered++
    }

    if (recovered > 0 || cleaned > 0) {
      logger.info(`[RoomService] Recovered ${recovered} room(s), cleaned ${cleaned} stale room(s) from Firestore`)
    }
  } catch (err) {
    logger.error('[RoomService] Failed to load rooms from Firestore:', err)
  }
}

// ── Cleanup ────────────────────────────────────────────────

let cleanupInterval: NodeJS.Timeout | null = null

/** Start periodic cleanup of inactive rooms (both cache and Firestore) */
export function startRoomCleanup(): void {
  startRetryQueue()

  cleanupInterval = setInterval(() => {
    const now = Date.now()
    let cleanedCount = 0

    for (const [code, room] of rooms.entries()) {
      if (now - room.lastActivity > ROOM_INACTIVITY_TIMEOUT) {
        logger.info(`Cleaning up inactive room: ${code}`)
        clearAllRoomTimeouts(code)
        cleanupRoomTwists(code)
        rooms.delete(code)
        forgetRoomCreator(code)
        deleteFromFirestore(code)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} inactive room(s)`)
    }
  }, ROOM_CLEANUP_INTERVAL)

  logger.info('Room cleanup service started')
}

/** Stop cleanup (for graceful shutdown) */
export function stopRoomCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval)
    cleanupInterval = null
  }
  if (retryInterval) {
    clearInterval(retryInterval)
    retryInterval = null
  }
  // Clear all debounced writes
  for (const timeout of debouncedWrites.values()) {
    clearTimeout(timeout)
  }
  debouncedWrites.clear()
  // Clear all room timeouts
  for (const timeout of roomTimeouts.values()) {
    clearTimeout(timeout)
  }
  roomTimeouts.clear()
  for (const timeout of plotTwistTimeouts.values()) {
    clearTimeout(timeout)
  }
  plotTwistTimeouts.clear()
  // Clear all disconnect timers
  for (const timeout of disconnectTimers.values()) {
    clearTimeout(timeout)
  }
  disconnectTimers.clear()
}
