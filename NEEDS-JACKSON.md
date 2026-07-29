# NEEDS-JACKSON

**The single queue.** Everything blocked on you, ordered by what unblocks the most.
Updated 2026-07-29. Machine labels: `[VPS]` = the Linux box, `[MACBOOK]` = your Mac.

Nothing below is waiting on me. Where I could do the part that did not need you, I did it and
said so.

---

## 1. 🔴 Chunk 4 layer 1 did not do what it claims — how far do you want to go?

**This is a decision, not a task, and it is the one that changes the product.**

Read `PLAYTEST-2026-07-29.md` (also in your Downloads) before answering. The short version:
the 252-character rewrite produced **paraphrase, not archetype**. Every entry is still an
individually identifiable description of the same protected character, and the catalog kept its
franchise-by-franchise ordering.

```
A noodle-shop panda who became a martial arts prodigy
A cheerful fish with no short-term memory
A grey wizard who arrives precisely when he means to
A grumpy swamp ogre who just wants to be left alone
    ...dealt alongside "a talkative pack animal who will not stop narrating"
```

**Why this is your call.** The specificity is what makes the mashups funny. A true archetype
rewrite trades it away, and how much to trade is a product decision you explicitly reserved —
"do not judge whether it is funny — that is my call." I am not going to rewrite 252 entries a
second time on a guess about where you want that line.

**What you should know before deciding.** In your own framing about the poster briefs: *exposure
is what you did, intent is what you wrote down about doing it.* A description engineered to
evoke a character without naming it is the second thing. And layer 3 passes clean on every line
of it, permanently — it is a fixed denylist of names and cannot see a character that is
described rather than named.

**Roughly, the options:**

| | What it means | Cost |
|---|---|---|
| **A. True archetypes** | "A noodle-shop panda who became a martial arts prodigy" → "An unlikely martial arts prodigy". Break the 1:1 mapping and the franchise ordering. | The mashups get less funny. This is the real cost and I am not going to pretend otherwise. |
| **B. Thin the tail** | Keep archetypes that are genuinely generic (a regional manager, a consulting detective); rewrite only the ones that map to exactly one character. | Half the work, most of the exposure removed. Needs a judgement call per entry — mine, checkable by you. |
| **C. Accept it, documented** | Decide the exposure is acceptable pre-launch and record why. | Defensible for a playtest with eight people. Not for a public launch, and the record would need to say so plainly. |

**Answer this and I will execute it.** Until then Chunk 4 stays reopened and the scope freeze's
"chunks 1–4 ship first" is not satisfied.

---

## 2. 🔴 Three secrets → `/etc/plotslop/env`

`ANTHROPIC_API_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. All three are
empty right now. The publishable key is needed at **build** time and is not a secret.

`[VPS] bash scripts/cutover.sh --check` refuses on exactly these and will keep refusing.
Verified today: exit 1, 4 preconditions failed, nothing touched.

**This also blocks two things that are not the deploy:**
- The three generated scripts missing from the playtest packet. No key, no scripts — the harness
  mock returns filler that says nothing about comedy.
- The live-unit cgroup checklist (item 4), which cannot start until the service can.

---

## 3. 🔴 DNS — point `plotslop.com` at `187.77.218.14`

Currently `2.57.91.91`, the Hostinger parked page.

**If you add an AAAA record it must be `2a02:4780:4:1c0b::1`.** nginx already listens there.
A stale or absent-but-expected AAAA makes certbot validate over IPv6 and fail while everything
looks healthy over v4 — and it surfaces as a renewal failure two months later with no obvious
cause. `cutover.sh --check` checks this.

---

## 4. 🔴 Firestore — does the project exist at all?

Unchanged and still first among the deploy-blockers by risk, in your ordering.

There is **no Firebase project ID anywhere in either repo**, and
`/root/PlotTwists-Native/firebase-debug.log` shows the CLI calling `projects//services/…` — an
**empty** project segment. That session was never linked to a project.

- **If no project exists:** `DECISIONS.md` #7 closes permanently as moot. Say so and I will
  close it rather than carry it forward.
- **If one does exist:** send collection names and rough doc counts **before anything is
  deleted**. If non-Jackson user records sat under permissive rules, that is a disclosure
  question, not a cleanup question.

`[MACBOOK]` or any browser signed into Firebase. Project ID is in the console URL.

The cutover script refuses to run if the Firebase env vars are ever set, because that switches
the live database off the JSON adapter and onto a project whose rules nobody has read.

---

## 5. 🟠 Fire the cutover

Everything is staged, validated and unexecuted. When 2, 3 and 4 are answered:

```
[VPS] bash scripts/cutover.sh --check     # must pass clean
[VPS] bash scripts/cutover.sh             # dry run, read the plan
[VPS] bash scripts/cutover.sh --apply
```

Validated today, offline: `nginx -t` passes on both configs, `systemd-analyze verify` is clean,
`systemd-analyze security` went 6.7 MEDIUM → 3.1 OK.

**Step 6 of that script is yours and is blocking** — the five-box cgroup re-verification on the
*running* unit. Every isolation measurement so far was on a transient `systemd-run` unit. That
proves the directives work; it does not prove this unit gets them.

---

## 6. 🟠 `DECISIONS.md` #10 — copy voice

Commit to the joke, or stay earnest? Affects ~122 copy occurrences. **Blocks Chunk 5 only.**

My recommendation is unchanged: commit to the bit in user-facing copy, leave `comedyPrompts.ts`
earnest — it is craft instruction to the model and making it ironic will measurably degrade
output.

---

## 7. 🟡 NEW — account-required room creation, eventually

Not blocking, but you should know the ceiling exists before it bites.

Chunk 3 re-keyed the rate limiters onto client IP, which fixed a real bypass (50 rooms in ~2s by
reconnecting). The cost is that **carrier-grade NAT puts thousands of unrelated mobile
subscribers in one bucket.** At playtest volume this cannot bite — it needs eleven strangers
behind one carrier IP creating rooms inside the same five minutes. At scale it will, and it will
present as *"the game is broken on mobile data"*, not as a rate limit.

Mitigated for now: both limits are env knobs, answerable from `/etc/plotslop/env` without a
deploy (`ROOM_CREATE_MAX`, `ROOM_CREATE_WINDOW_MS`, `MAX_LIVE_ROOMS_PER_CREATOR`). Signed-in
hosts are already immune — their key is the Clerk subject, not the IP.

The durable fix is requiring an account to create a room. That is a product decision, so it is
yours, and it is not urgent.

---

## 8. 🟡 NEW — you removed a feature and should know it stuck

Not a question, a notification, repeated because it is user-visible and easy to lose.

**"✎ Write your own" is gone.** It was the client half of D1 and it partly contradicts your own
Option B in `AUDIT.md`. As recorded there: *Option B is not dead, but it cannot return as a text
box on the submit path.*

---

## Not waiting on you

For completeness, so you can see what moved without you: Chunk 2 items 2–7 and all of Chunk 3
are done (harness 38/46 → 49/49, suite 436/436), the cutover is staged, and the playtest packet
is generated. Details in `HANDOFF.md` §7.
