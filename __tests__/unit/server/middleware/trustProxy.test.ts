/**
 * `trust proxy` — the setting that decides who the rate limiter thinks you are.
 *
 * Everything reaches this app through nginx on loopback. Without `trust proxy`, `req.ip` is
 * 127.0.0.1 for every visitor and express-rate-limit's per-IP buckets become one global bucket.
 * With the WRONG `trust proxy`, it is worse: a client that sends its own `X-Forwarded-For` picks
 * its own bucket, and the limiter looks like it is working while protecting nothing.
 *
 * The difference between `1` and `true` is one character and inverts the security property, so it
 * is asserted behaviourally — against real express, over a real socket, with a forged header —
 * rather than by reading the value back out of the config. Reading the value back would pass just
 * as happily on `true`.
 */

import express from 'express'
import { createServer, type Server } from 'http'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { AddressInfo } from 'net'

/** Boot a one-route app with the given trust-proxy setting and report what `req.ip` resolves to. */
async function ipAsSeenBy(
  trustProxy: number | boolean | undefined,
  headers: Record<string, string>,
): Promise<string> {
  const app = express()
  if (trustProxy !== undefined) app.set('trust proxy', trustProxy)
  app.get('/whoami', (req, res) => { res.json({ ip: req.ip }) })

  const server: Server = createServer(app)
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve))
  try {
    const { port } = server.address() as AddressInfo
    const response = await fetch(`http://127.0.0.1:${port}/whoami`, { headers })
    const body = (await response.json()) as { ip: string }
    // Node dials loopback over IPv4 here, but express may report it v6-mapped. Normalise so the
    // assertions are about WHICH address was chosen, not about how it was spelled.
    return body.ip.replace(/^::ffff:/, '')
  } finally {
    await new Promise<void>(resolve => { server.close(() => resolve()) })
  }
}

// nginx sends `X-Forwarded-For $proxy_add_x_forwarded_for`, which appends the real peer to
// whatever arrived. A client forging a header therefore produces exactly this shape: its lie
// first, the truth last.
const FORGED_THEN_REAL = { 'x-forwarded-for': '1.2.3.4, 203.0.113.9' }

describe('trust proxy', () => {
  it('without it, every visitor behind nginx shares one identity', async () => {
    // The bug this fixes. Not a hypothetical: express-rate-limit was throwing a ValidationError
    // on every request in the live journal because of exactly this.
    await expect(ipAsSeenBy(undefined, FORGED_THEN_REAL)).resolves.toBe('127.0.0.1')
  })

  it("with `1`, req.ip is the entry nginx appended — the one a client cannot forge", async () => {
    await expect(ipAsSeenBy(1, FORGED_THEN_REAL)).resolves.toBe('203.0.113.9')
  })

  it('with `true`, the client picks its own rate-limit key — which is why it is not `true`', async () => {
    // This is the non-vacuity check for the choice above. If `true` and `1` behaved the same,
    // the comment in server.ts would be folklore and this test would be decoration.
    await expect(ipAsSeenBy(true, FORGED_THEN_REAL)).resolves.toBe('1.2.3.4')
  })

  it('with `1` and no forged header, req.ip is still the real peer', async () => {
    await expect(ipAsSeenBy(1, { 'x-forwarded-for': '203.0.113.9' })).resolves.toBe('203.0.113.9')
  })

  it('server.ts sets it to 1, before any middleware that reads req.ip', async () => {
    // The behavioural tests above prove `1` is the right value; this proves the app actually has
    // it. Source-scanned because the setting lives inside `app.prepare().then(...)` in server.ts,
    // which cannot be imported without booting Next and the whole socket server.
    const source = readFileSync(join(__dirname, '../../../../server.ts'), 'utf8')
    expect(source).toContain("expressApp.set('trust proxy', 1)")
    expect(source).not.toContain("expressApp.set('trust proxy', true)")

    const setAt = source.indexOf("expressApp.set('trust proxy'")
    const firstUse = source.indexOf('expressApp.use(')
    expect(setAt).toBeGreaterThan(-1)
    expect(setAt).toBeLessThan(firstUse)
  })
})
