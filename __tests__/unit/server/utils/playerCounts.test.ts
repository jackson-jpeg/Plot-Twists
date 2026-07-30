/**
 * The seat cap, and the guard against it drifting apart from what the UI says.
 *
 * WHY THIS FILE EXISTS. Until 2026-07-30 nothing in the suite asserted MAX_PLAYERS at all. The cap
 * was 6; the host lobby rendered "Max 8" directly above a mode card reading "3-6 performers"; the
 * marketing OG card said "1-6 Players". Three hand-typed literals, three different answers, all
 * deployed. Changing the cap turned nothing red, which is exactly how they got out of sync.
 *
 * So there are two kinds of assertion here and they fail for different reasons:
 *   1. Value assertions — pin the numbers. Changing the cap SHOULD break these, and the person
 *      changing it should have to come here and say so deliberately.
 *   2. The drift guard — reads the real UI source and fails if a bare player-count literal
 *      reappears. This is the one that catches the actual historical bug, because it fails even
 *      when someone "fixes" the copy by editing a string instead of deriving it.
 */

import fs from 'fs'
import path from 'path'
import { MAX_PLAYERS, MIN_PLAYERS } from '@/server/utils/constants'
import {
  seatRange,
  seatRangeLabel,
  performersLabel,
  ALL_MODES_PLAYER_RANGE_LABEL,
  FALLBACK_MAX_PLAYERS,
} from '@/lib/playerCounts'

const REPO_ROOT = path.resolve(__dirname, '../../../..')

describe('MAX_PLAYERS — the seat cap', () => {
  it('seats 8 in ENSEMBLE', () => {
    // Jackson's scope-freeze condition is "played with eight people who are not my friends".
    // If this fails, the product can no longer seat its own release gate.
    expect(MAX_PLAYERS.ENSEMBLE).toBe(8)
  })

  it('seats exactly 1 in SOLO and 2 in HEAD_TO_HEAD', () => {
    expect(MAX_PLAYERS.SOLO).toBe(1)
    expect(MAX_PLAYERS.HEAD_TO_HEAD).toBe(2)
  })

  it('never puts the floor above the ceiling', () => {
    for (const mode of Object.keys(MAX_PLAYERS) as (keyof typeof MAX_PLAYERS)[]) {
      expect(MIN_PLAYERS[mode]).toBeLessThanOrEqual(MAX_PLAYERS[mode])
    }
  })

  it('defines a floor and a ceiling for every mode, with no extras on either side', () => {
    expect(Object.keys(MIN_PLAYERS).sort()).toEqual(Object.keys(MAX_PLAYERS).sort())
  })
})

describe('matchmaking uses the shared floor, not a private copy', () => {
  it('auto-starts a public room at MIN_PLAYERS', () => {
    // matchmaking.service.ts used to own a second AUTO_START_THRESHOLD table. A change to the
    // seat range could land in the lobby and miss matchmaking entirely.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getRequiredPlayersForMode } = require('@/server/services/matchmaking.service')
    expect(getRequiredPlayersForMode('ENSEMBLE')).toBe(MIN_PLAYERS.ENSEMBLE)
    expect(getRequiredPlayersForMode('HEAD_TO_HEAD')).toBe(MIN_PLAYERS.HEAD_TO_HEAD)
    expect(getRequiredPlayersForMode('SOLO')).toBe(MIN_PLAYERS.SOLO)
  })
})

describe('label helpers derive from the constants', () => {
  it('collapses a fixed-size mode to one number', () => {
    expect(seatRangeLabel('SOLO')).toBe('1')
    expect(seatRangeLabel('HEAD_TO_HEAD')).toBe('2')
  })

  it('renders ENSEMBLE as a range', () => {
    expect(seatRangeLabel('ENSEMBLE')).toBe(`${MIN_PLAYERS.ENSEMBLE}-${MAX_PLAYERS.ENSEMBLE}`)
    expect(seatRangeLabel('ENSEMBLE')).toBe('3-8')
  })

  it('pluralises the cast-size line correctly', () => {
    expect(performersLabel('SOLO')).toBe('1 player')
    expect(performersLabel('HEAD_TO_HEAD')).toBe('2 performers')
    expect(performersLabel('ENSEMBLE')).toBe('3-8 performers')
  })

  it('spans every mode in the marketing range', () => {
    expect(ALL_MODES_PLAYER_RANGE_LABEL).toBe('1-8')
  })

  it('falls back to the widest cap, which cannot over-report a room as full', () => {
    expect(FALLBACK_MAX_PLAYERS).toBe(MAX_PLAYERS.ENSEMBLE)
  })

  it('returns matching floor/ceiling pairs from seatRange', () => {
    expect(seatRange('ENSEMBLE')).toEqual({ min: 3, max: 8 })
  })
})

describe('drift guard — no bare player-count literals in user-facing copy', () => {
  // Every file that renders a seat count to a human. Add to this list, do not shorten it.
  const SURFACES = [
    'app/host/components/HostLobby.tsx',
    'app/join/components/JoinForm.tsx',
    'app/join/components/JoinLobby.tsx',
    'app/join/invite/[code]/page.tsx',
    'app/join/components/PublicRoomCard.tsx',
    'app/opengraph-image.tsx',
    'app/join/invite/[code]/opengraph-image.tsx',
  ]

  // "3-6 performers", "1-6 Players", "2 performers", "up to 8 players", "max 8 players".
  const COUNT_LITERAL =
    /\b\d+\s*(?:-|–|—|to)\s*\d+\s*(?:player|performer|people)|(?:^|[^\w.])\d+\s+(?:player|performer|people)/i

  it.each(SURFACES)('%s states no seat count as a literal', (relPath) => {
    const abs = path.join(REPO_ROOT, relPath)
    const source = fs.readFileSync(abs, 'utf8')

    const offenders = source
      .split('\n')
      .map((line, i) => ({ line: line.trim(), n: i + 1 }))
      // Comments are allowed to name the historical numbers — that is where the reasoning lives.
      .filter(({ line }) => !line.startsWith('//') && !line.startsWith('*') && !line.startsWith('/*'))
      .filter(({ line }) => COUNT_LITERAL.test(line))

    expect(
      offenders.map(o => `${relPath}:${o.n}  ${o.line}`)
    ).toEqual([])
  })

  it('the guard actually catches the strings that shipped', () => {
    // A drift guard that matches nothing passes forever. These are verbatim from the deployed
    // bundle on 2026-07-30, before this change.
    expect(COUNT_LITERAL.test(`desc: '3-6 performers + host'`)).toBe(true)
    expect(COUNT_LITERAL.test(`{ icon: '🎤', text: '1-6 Players' }`)).toBe(true)
    expect(COUNT_LITERAL.test(`desc: '2 performers + host'`)).toBe(true)
    // ...and does not fire on the derived replacements.
    expect(COUNT_LITERAL.test('desc: `${performersLabel(\'ENSEMBLE\')} + host`')).toBe(false)
    expect(COUNT_LITERAL.test('Max {maxPlayers}')).toBe(false)
  })
})
