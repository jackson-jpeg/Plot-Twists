/**
 * Unbiased shuffling — Chunk 3 item 4.
 *
 * `[...pool].sort(() => Math.random() - 0.5)` is the idiom this replaces. It is not a shuffle.
 * A comparator that answers randomly is not a consistent ordering, so the sort algorithm's own
 * access pattern decides the result: V8's TimSort touches early elements far more often than
 * late ones, and the output is measurably biased toward the input order. For a card game that
 * means the first characters an author happened to type appear disproportionately often, across
 * every game, forever — a content problem disguised as a correctness nit.
 *
 * The card-dealing path already got a correct implementation when IP layer 2 rewrote it
 * (cardCatalog.service.ts `sample`). This is the same algorithm, shared, for the three other
 * call sites that still had the broken idiom: weekly challenge selection, plot-twist option
 * ordering, and lib/content.ts's `getRandomContent`.
 *
 * NOT crypto-grade. `Math.random()` is fine for dealing cards and would be wrong for anything
 * that has to be unguessable — reconnect tokens use `crypto.randomBytes` for exactly that
 * reason (see utils/reconnectToken.ts).
 */

/** Fisher-Yates, on a copy. The input array is never mutated. */
export function shuffled<T>(items: readonly T[]): T[] {
  const pool = [...items]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool
}

/** `size` items drawn without replacement. Returns fewer if the pool is smaller. */
export function sampleOf<T>(items: readonly T[], size: number): T[] {
  return shuffled(items).slice(0, size)
}
