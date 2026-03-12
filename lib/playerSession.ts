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
