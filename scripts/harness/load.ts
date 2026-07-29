/**
 * Load harness — measures the SERVER's peak RSS under a realistic worst case.
 *
 * Why this exists, separately from `run.ts`:
 *
 * The systemd memory ceiling (`MemoryMax=768M`) was originally tuned by watching
 * a deliberate runaway allocator get OOM-killed. That measures the ATTACK, not
 * the GAME. A ceiling sized against an attacker can sit below legitimate peak,
 * and if it does, real games get OOM-killed mid-round and it presents as an
 * unreproducible crash — the worst possible failure to debug from a bug report.
 *
 * `run.ts` cannot answer this: it boots the server IN-PROCESS alongside every
 * socket client and the mock Anthropic server, so its RSS is a blend of all
 * three. This script runs the server as a SEPARATE process and samples only
 * that process, so the number means "the game server needed this much".
 *
 * Usage:
 *   npx tsx scripts/harness/load.ts [rooms] [playersPerRoom] [rounds]
 *   npx tsx scripts/harness/load.ts 6 10 2
 */

import { execSync, spawn } from 'child_process'
import { io as ioClient, type Socket } from 'socket.io-client'
import { readFileSync } from 'fs'
import { startMockAnthropic } from './mock-anthropic'

const ROOMS = Number(process.argv[2] || 6)
const PLAYERS_PER_ROOM = Number(process.argv[3] || 10)
const ROUNDS = Number(process.argv[4] || 2)

const MOCK_PORT = Number(process.env.MOCK_PORT || 8789)
const GAME_PORT = Number(process.env.HARNESS_PORT || 4601)
const URL = `http://127.0.0.1:${GAME_PORT}`

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

/** RSS of a pid in kB, read from /proc — no ps subprocess per sample. */
function rssKb(pid: number): number {
  try {
    const statm = readFileSync(`/proc/${pid}/statm`, 'utf8').split(' ')
    return (Number(statm[1]) * 4096) / 1024 // resident pages → kB
  } catch {
    return 0
  }
}

interface Client {
  socket: Socket
  label: string
  cards?: { characterId: string; settingId: string; circumstanceId: string }
}

function connect(label: string): Promise<Client> {
  return new Promise((resolve, reject) => {
    const socket = ioClient(URL, {
      transports: ['websocket'],
      auth: { playerSessionId: `load-${label}` },
      reconnection: false,
    })
    const client: Client = { socket, label }
    socket.on('available_cards', (cards: {
      characters: Array<{ id: string }>
      settings: Array<{ id: string }>
      circumstances: Array<{ id: string }>
    }) => {
      if (cards?.characters?.[0] && cards?.settings?.[0] && cards?.circumstances?.[0]) {
        client.cards = {
          characterId: cards.characters[0].id,
          settingId: cards.settings[0].id,
          circumstanceId: cards.circumstances[0].id,
        }
      }
    })
    socket.on('connect', () => resolve(client))
    socket.on('connect_error', reject)
    setTimeout(() => reject(new Error(`${label} connect timeout`)), 15_000)
  })
}

function ack<T>(socket: Socket, event: string, ...args: unknown[]): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${event} ack timeout`)), 20_000)
    socket.emit(event, ...args, (response: T) => {
      clearTimeout(timer)
      resolve(response)
    })
  })
}

/** One room: host + players, played through `ROUNDS` full rounds. */
async function playRoom(index: number): Promise<string> {
  const host = await connect(`h${index}`)
  const created = await ack<{ success: boolean; code?: string; error?: string }>(
    host.socket, 'create_room',
    { isMature: false, gameMode: 'ENSEMBLE', isPublic: false }
  )
  if (!created.success || !created.code) throw new Error(`room ${index}: ${created.error}`)
  const code = created.code

  const players: Client[] = []
  for (let p = 0; p < PLAYERS_PER_ROOM; p++) {
    const client = await connect(`r${index}p${p}`)
    const joined = await ack<{ success: boolean; error?: string }>(
      client.socket, 'join_room', code, `P${p}`
    )
    if (!joined.success) throw new Error(`room ${index} p${p}: ${joined.error}`)
    players.push(client)
  }

  for (let round = 0; round < ROUNDS; round++) {
    host.socket.emit('start_game', code)
    await sleep(1200) // let available_cards land on every client

    // Every player submits at once — this is the concurrent path, and the one
    // that allocates: N selections plus a full script generation per room.
    await Promise.all(players.map(async (client) => {
      if (!client.cards) return
      await ack(client.socket, 'submit_cards', code, client.cards)
    }))

    await sleep(3000) // generation + broadcast
    if (round < ROUNDS - 1) host.socket.emit('request_new_game', code)
    await sleep(800)
  }

  for (const client of players) client.socket.close()
  host.socket.close()
  return code
}

async function main() {
  // Refuse to run against a stale listener. An earlier version killed only the
  // `npx` wrapper on exit, leaving the real node alive on this port; the next
  // run then silently measured THAT process and reported its numbers as fresh.
  // A load measurement taken against the wrong server is worse than no
  // measurement, because it looks like one.
  const portInUse = execSync(`ss -ltn 2>/dev/null | grep -c ':${GAME_PORT} ' || true`, {
    encoding: 'utf8',
  }).trim()
  if (portInUse !== '0') {
    console.error(`port ${GAME_PORT} is already in use — a previous harness server is still alive.`)
    console.error(`kill it:  ps -eo pid,args | grep -E "harness/serve[r]\\.ts" | awk '{print $1}' | xargs -r kill -9`)
    process.exit(1)
  }

  const mock = await startMockAnthropic(MOCK_PORT)

  const server = spawn('npx', ['tsx', 'scripts/harness/server.ts'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      HARNESS_PORT: String(GAME_PORT),
      ANTHROPIC_API_KEY: 'sk-ant-harness-fake',
      ANTHROPIC_BASE_URL: `http://127.0.0.1:${MOCK_PORT}`,
      LOG_LEVEL: 'error',

      // Chunk 3 keyed the room limits on client IP, and this driver opens 220 sockets from
      // 127.0.0.1 — indistinguishable from the abuse those limits exist to stop. The first
      // run after Chunk 3 landed reported `0/6 rooms completed` with `growth 0.0 MB`, which
      // is not a memory measurement at all: it is a measurement of a server that was
      // correctly refusing to do anything.
      //
      // Raised through the env knobs rather than bypassed in code, so this exercises the same
      // CONFIG.abuse path production reads. A load test measures capacity; the `rateLimit`
      // scenario in run.ts is what measures the limits, and it runs at production defaults.
      ROOM_CREATE_MAX: '10000',
      ROOM_JOIN_MAX: '10000',
      MAX_LIVE_ROOMS_PER_CREATOR: '10000',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  // Surface the server's own output. The first version swallowed both streams,
  // so when every room failed with `submit_cards ack timeout` there was nothing
  // to look at — the load driver reported a product failure it had caused.
  const serverLog: string[] = []
  server.stdout.on('data', (chunk: Buffer) => serverLog.push(chunk.toString()))
  server.stderr.on('data', (chunk: Buffer) => serverLog.push(chunk.toString()))

  /**
   * `npx tsx` is FOUR processes deep before the real node appears:
   *   npx -> sh -c tsx -> node bin/tsx -> node --require preflight  <- the server
   *
   * The first version of this sampled only `pgrep -P <npx pid>` — direct
   * children — and so measured the npx wrapper, which does not grow. It
   * reported peak == baseline == 87.4 MB exactly, and "growth under load:
   * 0.0 MB", which would have shipped as "the ceiling is comfortable".
   * A peak identical to baseline to one decimal place is not a measurement,
   * it is a broken instrument. Walk the whole subtree.
   */
  const pids = new Set<number>([server.pid!])
  const refreshPids = () => {
    // FOURTH instrument correction to this file, 2026-07-29, and the subtlest.
    //
    // The frontier used to be seeded with `[server.pid]` and extended ONLY by newly-discovered
    // pids: `if (!pids.has(pid)) { pids.add(pid); frontier.push(pid) }`. So on every call after
    // the first, every known pid was already in the set, nothing was pushed, and the walk never
    // descended past depth one. A process that appeared AFTER its parent was already known —
    // which is exactly what `npx → tsx → node` does — could never be found.
    //
    // Symptom: alternating runs reported 4 pids (85+2+64+121 MB, baseline ~268 MB) and 3 pids
    // (85+2+62 MB, baseline 149 MB, growth 0.0), on identical inputs. The missing 121 MB was
    // the server itself. Two runs of the same command disagreeing by 120 MB is what gave it
    // away; a single run would have looked plausible either way.
    //
    // Re-seed the frontier from EVERY known pid each pass.
    const frontier = [...pids]
    while (frontier.length) {
      const parent = frontier.pop()!
      try {
        const out = execSync(`pgrep -P ${parent} || true`, { encoding: 'utf8' }).trim()
        for (const line of out.split('\n')) {
          const pid = Number(line)
          if (pid && !pids.has(pid)) {
            pids.add(pid)
            frontier.push(pid)
          }
        }
      } catch { /* process gone mid-walk */ }
    }
  }

  let peakKb = 0
  let baselineKb = 0
  const sampler = setInterval(() => {
    refreshPids()
    let total = 0
    for (const pid of pids) total += rssKb(pid)
    if (total > peakKb) peakKb = total
  }, 100)

  // Wait for the port to actually accept a connection rather than guessing at
  // a boot time. `tsx` compiles on first run and can take well over 6s.
  const bootDeadline = Date.now() + 60_000
  for (;;) {
    try {
      const probe = ioClient(URL, { transports: ['websocket'], reconnection: false })
      await new Promise<void>((resolve, reject) => {
        probe.on('connect', () => { probe.close(); resolve() })
        probe.on('connect_error', reject)
        setTimeout(() => reject(new Error('probe timeout')), 2000)
      })
      break
    } catch {
      if (Date.now() > bootDeadline) {
        console.error('server never came up. Its output:')
        console.error(serverLog.join('') || '(nothing)')
        server.kill('SIGKILL')
        process.exit(1)
      }
      await sleep(1000)
    }
  }
  await sleep(500)
  refreshPids()
  baselineKb = [...pids].reduce((sum, pid) => sum + rssKb(pid), 0)

  // THIRD instrument correction to this file, 2026-07-29. `peakKb` had been accumulating
  // since before the server finished booting, so "PEAK" could be a boot-time high-water mark
  // that load never exceeded — which is how a 6-room run reported peak EXACTLY equal to
  // baseline and 0.0 MB growth while completing 6/6 rooms. Rebasing here means peak measures
  // what happens AFTER the room is quiet, which is the only thing the number is meant to say.
  peakKb = baselineKb

  console.log(`baseline (idle server): ${(baselineKb / 1024).toFixed(1)} MB`)
  console.log(`  sampled pids: ${[...pids].map(pid => `${pid}:${(rssKb(pid) / 1024).toFixed(0)}MB`).join(' ')}`)
  console.log(`driving ${ROOMS} rooms x ${PLAYERS_PER_ROOM} players x ${ROUNDS} rounds...`)

  const started = Date.now()
  const results = await Promise.allSettled(
    Array.from({ length: ROOMS }, (_, i) => playRoom(i))
  )
  const elapsed = ((Date.now() - started) / 1000).toFixed(1)

  await sleep(1500)
  clearInterval(sampler)

  const ok = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected')

  console.log('')
  console.log('═══ LOAD RESULT ═══')
  console.log(`rooms completed:   ${ok}/${ROOMS}   (${elapsed}s)`)
  for (const failure of failed) {
    console.log(`  FAILED: ${(failure as PromiseRejectedResult).reason}`)
  }
  console.log(`concurrent players: ${ROOMS * (PLAYERS_PER_ROOM + 1)}`)
  console.log(`baseline RSS:       ${(baselineKb / 1024).toFixed(1)} MB`)
  console.log(`PEAK SERVER RSS:    ${(peakKb / 1024).toFixed(1)} MB`)
  console.log(`growth under load:  ${((peakKb - baselineKb) / 1024).toFixed(1)} MB`)
  if (failed.length) {
    console.log('')
    console.log('--- server output ---')
    console.log(serverLog.join('').slice(-4000) || '(nothing)')
  }

  // Kill the WHOLE subtree. `server.kill()` reaps only the npx wrapper and
  // leaves the real node listening — which is what poisoned an earlier run.
  refreshPids()
  for (const pid of pids) {
    try { process.kill(pid, 'SIGKILL') } catch { /* already gone */ }
  }
  await mock.close()
  process.exit(failed.length ? 1 : 0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
