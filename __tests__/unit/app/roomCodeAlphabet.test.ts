import { readFileSync } from 'fs'
import { join } from 'path'
import { ROOM_CODE_CHARS } from '@/server/utils/constants'

/**
 * Drift gate: the join form's validation regex must accept every character
 * the server can mint. Found 2026-08-07 when a live room code containing 'Z'
 * was refused by the form — the old range stopped at Y, making ~1 in 8 rooms
 * untypeable by code (the invite-link path hid it). Reads the component
 * source as text because the regex is module-private.
 */
describe('room code alphabets agree', () => {
  const source = readFileSync(
    join(__dirname, '../../../app/join/components/JoinForm.tsx'),
    'utf8'
  )
  const match = source.match(/VALID_ROOM_CODE_REGEX = (\/.+\/)/)

  it('JoinForm declares the regex', () => {
    expect(match).not.toBeNull()
  })

  it('accepts every server-mintable character in every position', () => {
    const regex = new RegExp(match![1].slice(1, -1))
    for (const c of ROOM_CODE_CHARS) {
      expect(`${c}${c}${c}${c}`).toMatch(regex)
    }
  })

  it('still rejects the confusable characters the server never mints', () => {
    const regex = new RegExp(match![1].slice(1, -1))
    for (const bad of ['IIII', 'OOOO', '0000', '1111']) {
      expect(bad).not.toMatch(regex)
    }
  })
})
