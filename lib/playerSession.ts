'use client'

const PLAYER_SESSION_KEY = 'plottwists_player_session_id'

function createSessionId(): string {
  return `ps_${crypto.randomUUID()}`
}

export function getPlayerSessionId(): string {
  if (typeof window === 'undefined') {
    return 'server-session'
  }

  let sessionId = localStorage.getItem(PLAYER_SESSION_KEY)
  if (!sessionId) {
    sessionId = createSessionId()
    localStorage.setItem(PLAYER_SESSION_KEY, sessionId)
  }

  return sessionId
}

// ── Reconnect tokens (Chunk 2 item 5b) ───────────────────────
//
// The session id above is client-generated and was, until this chunk, also what reclaimed your
// seat — which meant anyone who could produce the string owned the seat. Reconnect tokens are
// the replacement: minted by the server, handed back once in the join ack, stored here, and
// presented on `rejoin_room`.
//
// Keyed PER ROOM. One token per seat is the property that stops a token for room ABCD from
// being worth anything in room WXYZ, and a single shared slot would quietly break the case
// where a browser has two rooms open.
//
// localStorage rather than sessionStorage on purpose: the failure this exists to survive is a
// phone locking, a browser being killed, or a tab being closed and reopened mid-game.
// sessionStorage does not survive any of those.

const RECONNECT_TOKEN_PREFIX = 'plottwists_reconnect_'

function reconnectKey(roomCode: string): string {
  return `${RECONNECT_TOKEN_PREFIX}${roomCode.toUpperCase()}`
}

export function setReconnectToken(roomCode: string, token: string): void {
  if (typeof window === 'undefined' || !roomCode || !token) return
  try {
    localStorage.setItem(reconnectKey(roomCode), token)
  } catch {
    // Private mode / quota. A missing token degrades to "cannot auto-rejoin", which is the
    // same place we were before this existed — never a thrown error mid-join.
  }
}

export function getReconnectToken(roomCode: string): string {
  if (typeof window === 'undefined' || !roomCode) return ''
  try {
    return localStorage.getItem(reconnectKey(roomCode)) ?? ''
  } catch {
    return ''
  }
}

export function clearReconnectToken(roomCode: string): void {
  if (typeof window === 'undefined' || !roomCode) return
  try {
    localStorage.removeItem(reconnectKey(roomCode))
  } catch {
    // See setReconnectToken.
  }
}
