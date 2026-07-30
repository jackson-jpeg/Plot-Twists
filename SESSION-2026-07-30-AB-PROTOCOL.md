# Session — 2026-07-30 — the A/B protocol defect, the Chunk 4 verdict, and the deck audit

**Nothing in the product changed.** No code path, no catalog, no deck, no prompt. This session
corrected documents and recorded findings.

**Bottom line up front:**

1. **Your derivation was right, and the key was right too.** Answer is **(a)** — data fine, docs
   and protocol wrong. Nothing needs re-deriving.
2. **Do not reverse Chunk 4.** 3–3 by arm on the twelve scripts. On merit, not on cost.
3. **Trait deck: 156 engines / 95 voices** of 251. No rewrite — freeze holds.

---

## 1. The protocol defect — (a), with one correction to how (a) was phrased

You asked which was true. **(a): the key is correct; only the prose and the answer protocol were
wrong.** Verified three independent ways, all agreeing:

| Source | Assignment |
|---|---|
| Derived from rendered `AB-PACKET.md` (first speaker label per arm per pair) | `name, trait, name, name, trait, trait` |
| `.ab-key.json` | `name, trait, name, name, trait, trait` |
| Hardcoded `A_IS` in `scripts/ab-packet.ts` | `name, trait, name, name, trait, trait` |

Your read of the packet was correct pair for pair. `.ab-key.json` records a **per-pair**
assignment, not a single global one, so **(b) does not apply and nothing needs re-deriving.**

**One correction to (a) as you worded it: the generator did not randomise per pair.** `A_IS` is a
hardcoded literal, deliberately so — the comment explains that a random shuffle would make the
key irreproducible from the repo, which would defeat the point of writing it down separately. So
the assignment is *fixed but varies per pair*, which lands in the same place for your purposes.

**That is also the root cause, and it is one word.** The comment called `A_IS` "fixed", meaning
*not randomised at runtime*. Downstream prose read "fixed" as *the same arm in every pair*. One
ambiguous word propagated into a header, an answer protocol, and an analysis.

**A note on "alternate":** the arms vary per pair but do not strictly alternate — pairs 3 and 4
are both name, pairs 5 and 6 are both trait. The generator's comment claiming it is "deliberately
not alternating" is therefore correct, and it does not conflict with your finding. Your
substantive claim — **A is not a fixed arm across the six pairs** — is the one that matters and it
is right.

## 2. Why it was inverted, not merely lossy — confirming your arithmetic

You are exactly right, and I checked both directions:

- **Unanimous 6–0 for either arm → 3 A / 3 B by letter.** A is the name arm in exactly 3 of 6
  pairs, so a clean sweep splits the letters evenly. The pre-registered reading of 3–3 was
  *"prices the question at zero, freeze holds by default"* — so **the instrument returned "no
  difference" precisely when the answer was "unanimous."**
- **The observed genuine 3–3 by arm → 4 A / 2 B by letter.** Your second-opinion sheet, decoded:
  pairs 1, 2, 4, 5 → A; pairs 3, 6 → B. A real tie reads as a two-vote lead for A.

So the defect distorts in **both** directions on live data. Logged as **correction #28** in
`HANDOFF.md` §9, framed as you framed it: the same guard-watching-the-wrong-input shape as the
stale margin table, one layer deeper — inside the measurement rather than inside the thing
measured.

## 3. What was fixed

The defect had propagated to **four** files, not two:

| File | Fix | Committed? |
|---|---|---|
| `scripts/ab-packet.ts` | Emitted header rewritten; both misleading comments disambiguated so a regeneration cannot reintroduce it | yes |
| `AB-PACKET.md` | Header replaced in place | gitignored, pushed to your Mac |
| `CHUNK4-REVERSAL-ANALYSIS.md` | Self-contradicting sentence in §3 fixed; the "3–3 prices it at zero" line marked **by arm**; letter-based ending replaced; new §4 with the verdict and findings | yes |
| `NEEDS-JACKSON.md` | The ask itself said "tell me a letter" — corrected and **closed** | yes |

**Answer form is now: one verdict per pair, named by pair, tallied by arm. Never by letter.**

**`.ab-key.json` was deliberately not regenerated.** Re-running the generator would rewrite it and
destroy the timestamp that is its tamper-evidence — the thing that lets you check it was not
quietly edited to match a verdict. I verified out-of-tree that a regeneration would be
**byte-identical** anyway, so nothing is lost. Its original 21:55:35 mtime is intact, 92 seconds
after `.ab-generation.json`, consistent with the claim that it was written by the rendering script
before anyone read a line.

## 4. The verdict — do not reverse

**Recorded: DO NOT REVERSE CHUNK 4, on merit rather than on cost.** Names funnier in pairs 1, 4,
6; traits funnier in pairs 2, 3, 5 — **3–3 by arm**. The scripts do not show the name arm winning.
Priced at zero, freeze holds — now on a correctly-read instrument.

## 5. The deck audit — 156 engines / 95 voices

Criterion, as you defined it: an **engine** supplies a mechanism — a behaviour generating
escalating consequences, so each firing changes the state of the scene. A **voice** supplies only
a manner of speaking, so each firing is the same joke.

| | count | share |
|---|---:|---:|
| **Engines** | **156** | 62.2% |
| **Voices** | **95** | 37.8% |
| Total | 251 | 100% |

**The deck is about five-eighths engine.** Better than the packet's failure cases suggest, and not
good enough to leave alone: **95 entries are dead weight by the only variable that predicted
funniness in the experiment.**

**Two caveats, because you should not treat 62% as a measured constant:**

1. **~40 of the 251 are genuinely borderline** and were forced to a side. *Believes the room is
   being recorded* is a belief (voice) that drives guarded behaviour (engine). *Has read one book
   about leadership* is a cliché generator (voice) whose holder keeps trying to run the room
   (engine). A second reader would plausibly move the split by ±8 points.
2. **This is a classification, not a measurement.** Nothing was scored against generated scripts.
   The criterion earned its standing by predicting six of six pairs — but it was *derived* from
   those same six pairs, so it has not been tested out-of-sample. Suggestive, not validated.

**No rewrite done and none proposed. Post-playtest work; the freeze holds.**

## 6. The Scooby-Doo hazard — logged as you asked

Pair 5's **name** arm, `AB-PACKET.md:1071` onward, four lines:

```
SCOOBY-DOO
    Rwo rakes? Rhat's rike, rour rakes!
SCOOBY-DOO
    Rmaybe rone rake ris a rhost!
SCOOBY-DOO
    Ri'll rake rhe rwhole rfing!
SCOOBY-DOO
    Ri rote for Re!
```

**Every instrument scores those four lines as healthy** — on-cast, inside the line budget, the
seat clears the 3-line floor, and layer 3 does not fire because a phonetic respelling is not a
protected term as written. A player performs it aloud, cold, off a phone, in front of seven
strangers.

Second instance of the packet carrying what the metrics cannot, after the clustered-cast finding.
Both point the same way: **the distribution metrics measure whether lines were dealt, not whether
they can be performed.** It is also specific to the name arm — a trait card cannot ask for an
accent, because it describes a behaviour rather than a person with a voice.

## 7. Verification

- `npx tsc --noEmit` → **0 errors**
- `npx jest` → **553/553**, 38 suites — unchanged from baseline
- Corrected packet verified **byte-identical** to what the fixed generator emits
- Stale `AB-PACKET.md` on your Mac confirmed defective by md5 and **replaced**

## 8. Nothing new for you

**`NEEDS-JACKSON.md` is back to the three credentials: Vercel, Clerk production, Android
fingerprint.** The A/B ask is closed — you answered it. No new asks from this session.
