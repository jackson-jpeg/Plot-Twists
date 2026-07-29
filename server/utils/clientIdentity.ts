/**
 * Who to rate-limit — Chunk 3 item 1.
 *
 * THE DEFECT. Every socket limiter was keyed on `socket.id`, which is minted fresh on every
 * connection. So the limit was per-connection, and a connection is free: the harness creates
 * 50 rooms in about two seconds against a limit of 10 per five minutes by reconnecting five
 * times. A limit that resets when the attacker asks it to is not a limit.
 *
 * WHAT REPLACES IT. An authenticated user is keyed on their verified Clerk subject; everyone
 * else is keyed on client IP. Both survive reconnection, which is the whole property that was
 * missing.
 *
 * GETTING THE IP RIGHT MATTERS MORE THAN IT LOOKS. In production every socket arrives from
 * nginx on loopback, so `handshake.address` is 127.0.0.1 for every player alive — keying on it
 * would put the entire internet in one bucket and lock out the first real party of the evening.
 * The forwarded headers are therefore load-bearing. But they are also attacker-controlled on
 * any request that did NOT come through our proxy, so trusting them unconditionally would hand
 * an attacker a fresh bucket per request — strictly worse than keying on socket.id.
 *
 * Hence: forwarded headers are honoured ONLY when the immediate peer is loopback, which is
 * exactly the case where our own nginx is the one that set them. A client that reaches the
 * server directly gets its real peer address and its headers ignored.
 */

import type { Socket } from 'socket.io'

/** Peers we are willing to accept forwarding headers from: our own reverse proxy. */
function isLoopback(address: string): boolean {
  const addr = address.replace(/^::ffff:/, '')
  return addr === '127.0.0.1' || addr === '::1' || addr === 'localhost'
}

export function getClientIp(socket: Pick<Socket, 'handshake'>): string {
  const handshake = socket.handshake as unknown as {
    address?: string
    headers?: Record<string, string | string[] | undefined>
  }
  const peer = handshake.address ?? ''
  const headers = handshake.headers ?? {}

  if (!isLoopback(peer)) {
    // Direct connection. The peer address is the only thing here we did not let the client write.
    return peer || 'unknown'
  }

  // `X-Real-IP` is set by our nginx from $remote_addr and cannot be appended to, so it is
  // preferred over X-Forwarded-For.
  const realIp = headers['x-real-ip']
  const realIpValue = Array.isArray(realIp) ? realIp[0] : realIp
  if (realIpValue) return realIpValue.trim()

  // Fallback: X-Forwarded-For. Take the LAST entry, not the first. nginx's
  // `$proxy_add_x_forwarded_for` APPENDS the peer it actually saw to whatever the client sent,
  // so with exactly one trusted proxy the final element is the real client and every earlier
  // element is client-supplied fiction. Reading [0] — the usual reflex — reads the fiction.
  const forwarded = headers['x-forwarded-for']
  const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded
  if (forwardedValue) {
    const parts = forwardedValue.split(',').map(p => p.trim()).filter(Boolean)
    if (parts.length) return parts[parts.length - 1]
  }

  return peer || 'unknown'
}

/**
 * The key every socket rate limiter counts against.
 *
 * Namespaced so a Clerk subject can never collide with an IP literal, and so a limiter's
 * contents are readable when something needs debugging.
 */
export function rateLimitKey(socket: Pick<Socket, 'handshake' | 'data'>): string {
  const uid = (socket.data?.userId ?? socket.data?.uid) as string | undefined
  if (uid) return `user:${uid}`
  return `ip:${getClientIp(socket)}`
}

/**
 * A key for limits that belong to a SEAT rather than to a person or a network.
 *
 * In-room chatter — reactions, heckles — is the one place `rateLimitKey` is the wrong answer.
 * This game's whole premise is a group of people in one room, which means one IP, which means
 * an IP-keyed limit divides one player's allowance across the entire party and goes off exactly
 * when the room is having the most fun. A seat key still survives reconnection (which is what
 * the socket.id keying failed at) without punishing people for sitting on the same sofa.
 *
 * Falls back to `rateLimitKey` when there is no room context to key against.
 */
export function seatKey(socket: Pick<Socket, 'handshake' | 'data' | 'id'>, roomCode: unknown): string {
  if (typeof roomCode !== 'string' || !roomCode) return rateLimitKey(socket)
  const uid = (socket.data?.userId ?? socket.data?.uid) as string | undefined
  // An authenticated player keeps one bucket per room across reconnects. A guest's only stable
  // per-seat handle from inside a rate-limit check is the connection, so guests keep the old
  // behaviour here — deliberately, because the cost of getting this wrong is silencing a party,
  // and because reaction spam is bounded broadcast rather than an allocation vector.
  return `${roomCode.toUpperCase()}:${uid ?? socket.id}`
}
