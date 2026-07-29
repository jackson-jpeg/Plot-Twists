# NEEDS-JACKSON

**The single queue.** Everything blocked on you, ordered by what unblocks the most.
Updated 2026-07-29 (second pass). Machine labels: `[VPS]` = the Linux box, `[MACBOOK]` = your Mac.

Nothing below is waiting on me. Where I could do the part that did not need you, I did it and
said so.

**Closed since this morning:** Q1, the catalog rewrite (`HANDOFF.md` §8). **Closed this evening:**
DNS and the certificate (item 2), the script-length cap (`DECISIONS.md` #9, now closed on measured
margins), the straight-man casting change, and the install-prompt suppression.

---

## 1. 🔴 Three secrets → `/etc/plotslop/env`

`ANTHROPIC_API_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. All three are
empty right now. The publishable key is needed at **build** time and is not a secret.

`[VPS] bash scripts/cutover.sh --check` refuses on exactly these and will keep refusing.
Verified again today: exit 1, preconditions failed, nothing touched.

**This is now the top of the queue, and it blocks more than the deploy:**
- **It is why your Vercel emails say "failed".** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is required at
  *build* time by the prerendered `/admin` page, so `next build` exits 1 without it. See item 3 —
  though the Vercel project has a bigger problem than a missing key.
- **The three generated scripts are still missing from the playtest packet.** No key, no scripts —
  the harness mock returns filler that says nothing about comedy. This matters more than it did
  this morning, because the catalog grammar changed underneath it: the packet shows you 40 hands
  and the exact prompts, but nobody has seen what the model *does* with a trait deck. That is the
  one remaining unknown about the rewrite you just approved.
- The live-unit cgroup checklist, which cannot start until the service can.

---

## 2. ✅ DNS and TLS — DONE 2026-07-29

You pointed it, I took it to the certificate and stopped there.

`plotslop.com` → `187.77.218.14`, TTL 60, agreed by four resolvers. `www` CNAMEs to the apex.
No AAAA, as you instructed — **it stays that way; nothing here needs one.**

Certificate issued for both names, expires **2026-10-27**, renewal dry-run passes. Verified by
reading the certificate rather than trusting certbot's exit code, and by proving port 80 was
reachable from off-box before spending an issuance attempt. sang3r.com was re-checked after the
nginx reload and is unaffected.

**One thing to know before you or anyone else opens the domain:** `https://plotslop.com` currently
shows a **certificate name-mismatch warning** naming chirpchirps.com. Nothing is wrong — DNS points
here but no `:443` block claims the name yet, so TLS falls through to another site on this IP. It
resolves at cutover step 4, and only there. Plain HTTP correctly serves
`plotslop: awaiting certificate`.

---

## 3. 🟠 NEW — Vercel is emailing you about failed preview deploys. That is me.

You asked mid-session. Diagnosed, and the cause is boring; what it exposes is not.

**Why they started:** every push to `audit/2026-07-28-snapshot` triggers a Vercel preview build,
and I have pushed **20 commits to that branch today**. One email each.

**Why they fail:** reproduced locally with `npx next build` — it is not a Vercel problem.

```
Error occurred prerendering page "/admin"
Error: @clerk/clerk-react: Missing publishableKey.
Export encountered an error on /admin/page: /admin, exiting the build.
```

`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is needed at **build** time, and `/admin` is statically
prerendered. Same missing key as item 1 — **the build has been broken since the key went missing,
not since I started pushing. I only made it visible, twenty times.**

**The part that actually matters: this project cannot run on Vercel at all.** `package.json`
start is `tsx server.ts` — a custom Socket.IO server. Vercel's Next.js preset never runs it, and
serverless functions cannot hold WebSocket connections. **A *successful* Vercel deploy would
produce a site where no game can start.** The last green deploy on `v2` was 2026-04-23, which is
roughly when the architecture stopped matching it. Per `DECISIONS.md` #12 the game is served from
this VPS behind nginx, so the Vercel project is a leftover pointing at an architecture the product
left behind.

**What I did:** disabled preview deploys for the audit branch only, in `vercel.json`. Narrow,
reversible, stops the emails, touches nothing else. Your account was not touched.

**What I did not do, because it is your account and your call:**

- **Delete or disconnect the Vercel project.** My recommendation. It cannot serve this product,
  and while it exists it is a live URL someone could point a domain at by mistake.
- **Keep it and set the Clerk env vars in Vercel** — sensible only if you want previews as a
  build-check. It would still not run a playable game.

One caveat on "just delete it": I did not check whether anything currently links to a
`*.vercel.app` URL for this project. Worth thirty seconds before you pull it.

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

Everything is staged, validated and unexecuted. When 1, 2 and 3 are answered:

```
[VPS] bash scripts/cutover.sh --check     # must pass clean
[VPS] bash scripts/cutover.sh             # dry run, read the plan
[VPS] bash scripts/cutover.sh --apply
```

Validated offline: `nginx -t` passes on both configs, `systemd-analyze verify` is clean,
`systemd-analyze security` went 6.7 MEDIUM → 3.1 OK.

**Step 6 of that script is yours and is blocking** — the five-box cgroup re-verification on the
*running* unit. Every isolation measurement so far was on a transient `systemd-run` unit. That
proves the directives work; it does not prove this unit gets them.

---

## 6. 🟠 NEW — the install prompt fires on the player join path

Small, and it directly contradicts the decision you just made.

`InstallPrompt` renders globally from `app/layout.tsx:159`, so it appears on `/join`. On iOS
Safari it fires on a timer regardless of which page the player is on. Under *"players join in a
phone browser with a room code, no install, ever"*, an install banner over the join flow
interrupts the exact moment that must not be interrupted — somebody who was handed a code at a
party and has thirty seconds of patience.

**I did not change it**, because it is not obviously wrong everywhere: offering PWA install to a
**host**, who will run this repeatedly on the same device, is reasonable. Which surfaces keep it
is a UX call.

| | |
|---|---|
| **A** | Suppress on `/join` and `/game`, keep elsewhere *(my recommendation)* |
| **B** | Remove entirely — "no install, ever" means what it says |
| **C** | Leave it |

---

## 7. 🟠 `DECISIONS.md` #10 — copy voice

Commit to the joke, or stay earnest? Affects ~122 copy occurrences. **Blocks Chunk 5 only.**

My recommendation is unchanged: commit to the bit in user-facing copy, leave `comedyPrompts.ts`
earnest — it is craft instruction to the model and making it ironic will measurably degrade
output.

One addition since this morning: `app/terms/TermsContent.tsx:76` states the refund policy as
"Stripe or Apple App Store". True today, wrong the moment iOS is host-only and no player ever
buys through Apple. It is a legal page, so it should be right. Folds into the same pass.

---

## 8. 🟡 NEW — two public-domain settings I flagged rather than quietly kept

Both are legal. Both are arguable, and you should get the choice.

- **"A Laboratory In A Thunderstorm With A Sheet Over Something."** Frankenstein is public domain
  (1818), but the lightning-powered laboratory is not in the novel — it is the 1931 film, which
  is not public domain. I reached for the copyrighted imagery, not the book's.
- **"An Opera House Box That Is Always Kept Empty."** Box Five is from the 1910 Leroux novel and
  is genuinely public domain, but public association runs through the musical, which is not.

Both are cheap to cut and neither is load-bearing. Default if you say nothing: they stay.

There is also a rule conflict I resolved by interpretation and should flag: your rule 2 ("no entry
may map 1:1 to an identifiable character") and rule 3 ("public domain is allowed") pull against
each other, because a Holmes or Dracula card is legal *and* nameable. I kept public domain out of
the character deck entirely and used it only in settings, where what is evoked is a scene rather
than a person. If you want named public-domain characters in the character slot, rule 2 needs an
explicit exemption.

---

## 9. 🟡 Account-required room creation, eventually

Not blocking, but you should know the ceiling exists before it bites.

Chunk 3 re-keyed the rate limiters onto client IP, which fixed a real bypass (50 rooms in ~2s by
reconnecting). The cost is that **carrier-grade NAT puts thousands of unrelated mobile
subscribers in one bucket.** At playtest volume this cannot bite — it needs eleven strangers
behind one carrier IP creating rooms inside the same five minutes. At scale it will, and it will
present as *"the game is broken on mobile data"*, not as a rate limit.

**Your web-first decision makes this more likely to matter, not less**, because every player is
now on a phone browser rather than an installed app, and phone browsers are where CGNAT lives.

Mitigated for now: both limits are env knobs, answerable from `/etc/plotslop/env` without a
deploy (`ROOM_CREATE_MAX`, `ROOM_CREATE_WINDOW_MS`, `MAX_LIVE_ROOMS_PER_CREATOR`). Signed-in
hosts are already immune — their key is the Clerk subject, not the IP.

The durable fix is requiring an account to create a room. Product decision, so it is yours, and
it is not urgent.

---

## 10. 🟡 You removed a feature and should know it stuck

Not a question, a notification, repeated because it is user-visible and easy to lose.

**"✎ Write your own" is gone.** It was the client half of D1 and it partly contradicts your own
Option B in `AUDIT.md`. As recorded there: *Option B is not dead, but it cannot return as a text
box on the submit path.*

A second one joins it today: **the card browser no longer shows a source line under each card.**
`CardBrowseModal` and `CardPicker` both rendered `item.source`, which was the franchise name. The
field is deleted, so the badge is gone. Nobody would have seen it recently — layer 1 emptied the
data a session ago — but the code was still there and would have rendered attribution to players
the moment anything repopulated it.

---

## Not waiting on you

For completeness, so you can see what moved without you: the catalog restructure is done and
gated, four more IP leaks were found and fixed (one of them shipping to the model on every
request), the source-audit gate went from one file to five, the playtest packet is regenerated at
40 hands, and both `DECISIONS.md` #4 and #12 are written. Suite 448/448, harness 49/49, typecheck
clean. Details in `HANDOFF.md` §7 and §8.
