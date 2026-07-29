/**
 * Host Migration — Chunk 2 item 3
 *
 * What this fixes, in party terms: the host's phone dies during the performance. Today the
 * room freezes and never recovers. `end_performance` is host-only (game.handler.ts:59), the
 * disconnect handler auto-pauses the teleprompter (handlers/index.ts:64), and nothing else
 * moves a room out of PERFORMING. Everyone stands around looking at a stalled screen until the
 * one-hour inactivity sweep deletes the room.
 *
 * WHAT THE WRITTEN RECORD GOT WRONG: CHUNKS.md item 3 and the harness both describe a "2-minute
 * PERFORMING sweep" at room.service.ts:463 that jumps the room to RESULTS with zero votes. That
 * line is inside `loadRoomsFromFirestore`, which only ever runs at server STARTUP. During a live
 * session it never executes. So the real behaviour is worse than recorded: not a bad automatic
 * ending, no ending at all.
 *
 * The fix restores the missing capability rather than guessing an ending: promote a player to
 * host so a human can decide when the show is over.
 */

import type { Server as SocketIOServer } from 'socket.io'
import type { Room, Player, ClientToServerEvents, ServerToClientEvents } from '../../lib/types'
import * as roomService from './room.service'
import { startTeleprompterSync } from './teleprompter.service'
import { toPublicPlayers } from '../socket/serialize'
import { logger } from '../../lib/logger'

type AppIO = SocketIOServer<ClientToServerEvents, ServerToClientEvents>

/**
 * How long a frozen room waits for its host before handing the show to someone else.
 *
 * Deliberately NOT the 60s reconnection grace period. That number is sized for a player whose
 * absence costs the room nothing but a seat; this one is sized for a room that is frozen
 * mid-performance, where every second is dead air in front of an audience. Five seconds rides
 * out an ordinary network blip — socket.io only reports the disconnect after its own ping
 * timeout, so the client has already been gone a beat before this timer even starts — while
 * keeping the stall shorter than the pause it takes to notice something is wrong.
 *
 * A host who returns inside the window keeps the room: markPlayerReconnected restores
 * `room.host` and flips `connected`, and the callback below re-reads both before acting.
 */
export const HOST_MIGRATION_DELAY_MS = 5_000

const migrationTimers = new Map<string, NodeJS.Timeout>()

/** Cancel a pending migration — the host came back, or the room is going away. */
export function cancelHostMigration(roomCode: string): void {
  const timer = migrationTimers.get(roomCode)
  if (timer) {
    clearTimeout(timer)
    migrationTimers.delete(roomCode)
  }
}

/**
 * Pick the successor: the longest-present connected PLAYER who is not the outgoing host.
 *
 * `room.players` is a Map and Maps iterate in insertion order, so first-found is
 * longest-present. There is no `joinedAt` on Player to sort by — insertion order is the only
 * join-order signal that exists, and it is exact rather than approximate, so this is a real
 * ordering and not a fallback. If a `joinedAt` is ever added, prefer it and delete this note.
 *
 * SPECTATORs are excluded on purpose. They are not in the show, several of them are only
 * spectators because they overflowed the six-seat cap without being told (room.handler.ts:172),
 * and handing the performance controls to someone who never chose a card is not a recovery.
 */
function pickSuccessor(room: Room): Player | undefined {
  for (const player of room.players.values()) {
    if (player.isHost) continue
    if (player.role !== 'PLAYER') continue
    if (player.connected === false) continue
    return player
  }
  return undefined
}

/**
 * Schedule migration for a room whose host has just dropped mid-game.
 * Safe to call repeatedly; the newest call wins.
 */
export function scheduleHostMigration(room: Room, io: AppIO): void {
  cancelHostMigration(room.code)

  const timer = setTimeout(() => {
    migrationTimers.delete(room.code)

    // Re-read from the cache rather than trusting the captured reference: five seconds is long
    // enough for the room to have been deleted, ended, or reclaimed.
    const current = roomService.getRoomFromCache(room.code)
    if (!current) return
    if (current.gameState === 'LOBBY') return
    if (current.host.connected !== false) return // host reclaimed its seat

    migrateHost(current, io)
  }, HOST_MIGRATION_DELAY_MS)

  timer.unref()
  migrationTimers.set(room.code, timer)
}

/** Promote a successor and hand back control of the room. Exported for direct testing. */
export function migrateHost(room: Room, io: AppIO): Player | undefined {
  const successor = pickSuccessor(room)

  if (!successor) {
    // Nobody left to hand the show to. Say so rather than leaving the room frozen and silent —
    // this is the branch where the party genuinely is over.
    logger.info(`[HostMigration] Room ${room.code} has no eligible successor; notifying and standing down`)
    io.to(room.code).emit('host_disconnected', {
      message: 'The host has left and there is nobody left to take over.',
    })
    return undefined
  }

  const outgoing = room.host
  outgoing.isHost = false

  successor.isHost = true
  room.host = successor
  room.hostUid = successor.uid ?? undefined
  room.lastActivity = Date.now()

  logger.info(`[HostMigration] Room ${room.code}: ${outgoing.nickname} abandoned, ${successor.nickname} promoted to host`)

  // The successor keeps role 'PLAYER'. They are still in the show and still get voted on; what
  // they gain is the host CONTROLS. Flipping them to 'HOST' would silently pull them out of the
  // cast mid-performance and drop them off the ballot.
  roomService.updateRoom(room)

  io.to(room.code).emit('host_changed', { nickname: successor.nickname })
  io.to(room.code).emit('players_update', toPublicPlayers(room))

  // Un-freeze. The disconnect handler paused the teleprompter when the host dropped; leaving it
  // paused would hand the new host a dead screen and a control they cannot use.
  if (room.gameState === 'PERFORMING' && room.isPaused) {
    room.isPaused = false
    roomService.updateRoom(room)
    io.to(room.code).emit('performance_resumed')
    startTeleprompterSync(room, io as unknown as SocketIOServer)
    logger.info(`[HostMigration] Resumed the performance in room ${room.code} under ${successor.nickname}`)
  }

  return successor
}
