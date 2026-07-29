/**
 * Server-issued reconnect tokens — Chunk 2 item 5b.
 *
 * THE DEFECT THIS REPLACES. A seat was claimed with `playerSessionId`: a string the CLIENT
 * chooses, sends in the socket handshake, and which the server then stored verbatim as the
 * seat's identity. `rejoin_room(code, 'session-alice')` from any socket took Alice's seat,
 * including the host's, along with the host's powers. The harness demonstrates it in one line
 * (`identity` scenario). Nothing was guessed and nothing was stolen — the value was simply
 * asserted, because the server had no way to tell an assertion from a proof.
 *
 * The root cause is not weak validation. It is that the credential was never issued by the
 * party checking it, so there was nothing to check it against.
 *
 * WHAT REPLACES IT. On join the server mints 32 bytes of CSPRNG randomness, hands the plaintext
 * back exactly once in the join ack, and keeps only a SHA-256 hash on the Player. On rejoin the
 * client presents the token; the server hashes it and compares. Three properties follow:
 *
 *  - unguessable — 256 bits, from `randomBytes`, not from anything the client controls;
 *  - unbroadcastable — the hash is the only copy the server keeps, and `toPublicPlayer` is an
 *    allow-list, so it cannot reach a client even by accident;
 *  - unreplayable across seats — the hash is per-player, so holding one seat's token proves
 *    nothing about another.
 *
 * The tokens are deliberately NOT signed or expiring. A room lives at most an hour and its
 * players live in server memory alongside the hash, so a token's lifetime is already bounded by
 * the thing it unlocks. Adding a JWT here would add key management and a second clock without
 * shortening that window.
 */

import { randomBytes, createHash, timingSafeEqual } from 'crypto'

/** 32 bytes → 64 hex chars. */
const TOKEN_BYTES = 32

export function mintReconnectToken(): { token: string; hash: string } {
  const token = randomBytes(TOKEN_BYTES).toString('hex')
  return { token, hash: hashReconnectToken(token) }
}

export function hashReconnectToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Constant-time comparison of two hex digests.
 *
 * The timing channel here is genuinely marginal — an attacker would be measuring a string
 * compare across a websocket — but `timingSafeEqual` costs nothing and removes the need to
 * argue about it. It throws on length mismatch, so that is checked first rather than caught.
 */
export function reconnectTokenMatches(token: string, storedHash: string | undefined): boolean {
  if (typeof token !== 'string' || !token || !storedHash) return false
  const candidate = Buffer.from(hashReconnectToken(token), 'hex')
  const stored = Buffer.from(storedHash, 'hex')
  if (candidate.length !== stored.length) return false
  return timingSafeEqual(candidate, stored)
}
