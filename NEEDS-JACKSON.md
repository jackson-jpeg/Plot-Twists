# NEEDS-JACKSON

**The single queue.** Everything blocked on you, ordered by what unblocks the most.
Updated 2026-07-29 (second pass). Machine labels: `[VPS]` = the Linux box, `[MACBOOK]` = your Mac.

Nothing below is waiting on me. Where I could do the part that did not need you, I did it and
said so.

**Closed since this morning:** Q1, the catalog rewrite. You ruled Option A restructured; it is
built, gated, and regenerated into a 40-hand playtest packet. Details in `HANDOFF.md` §8.

---

## 1. 🔴 Three secrets → `/etc/plotslop/env`

`ANTHROPIC_API_KEY`, `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. All three are
empty right now. The publishable key is needed at **build** time and is not a secret.

`[VPS] bash scripts/cutover.sh --check` refuses on exactly these and will keep refusing.
Verified again today: exit 1, preconditions failed, nothing touched.

**This is now the top of the queue, and it blocks more than the deploy:**
- **The three generated scripts are still missing from the playtest packet.** No key, no scripts —
  the harness mock returns filler that says nothing about comedy. This matters more than it did
  this morning, because the catalog grammar changed underneath it: the packet shows you 40 hands
  and the exact prompts, but nobody has seen what the model *does* with a trait deck. That is the
  one remaining unknown about the rewrite you just approved.
- The live-unit cgroup checklist, which cannot start until the service can.

---

## 2. 🔴 DNS — point `plotslop.com` at `187.77.218.14`

Currently `2.57.91.91`, the Hostinger parked page. **This is now a 30-second job, not a blocker
that needs planning** — see below.

**Checked with the Hostinger API you supplied, 2026-07-29.** The live zone is exactly two records:

```
@     A      2.57.91.91        ttl 50
www   CNAME  plotslop.com.     ttl 300
```

Three things came out of that, and two of them shrink this item:

1. **The apex TTL is 50 seconds.** There is no propagation window to get out in front of. The
   argument for changing DNS days ahead of the cutover does not exist — the record can flip
   during the cutover, seconds before certbot needs it, and be live before certbot asks.
2. **There is no AAAA record at all.** My earlier warning was about a *stale* AAAA; there is none,
   so v4-only validation is clean. Adding one is optional. If you do add it, it must be
   `2a02:4780:4:1c0b::1` — I confirmed nginx is bound to that address on both 80 and 443.
3. **The target IP in this file was worth double-checking and is correct.** `187.77.218.14` looks
   like a Brazilian telecom range rather than a Hostinger block, so I verified it three ways —
   `ip addr` on this box, an external echo, and the Hostinger VPS API (`srv1415856.hstgr.cloud`,
   KVM 2, Ubuntu 24.04). All three agree, v4 and v6.

**Pointing DNS now would not help and would mildly hurt.** I probed what an unmatched host gets
today: a bare nginx 404, not another site's content — so there is no risk of plotslop.com serving
sang3r.com, but there is no benefit either. It would swap a parked page for a 404 for however long
the rest of the cutover takes.

**🔴 I could not wire this into `cutover.sh`.** I wrote the step — flip the A record via the
Hostinger API, then poll the resolver and refuse to continue to certbot on a stale answer — and
the edit was **blocked by the permission classifier**, twice, through two different tools. I did
not work around it. So the DNS flip is still a manual step, and either you run it or you approve
the edit. The call it would make:

```
[VPS] curl -X PUT https://developers.hostinger.com/api/dns/v1/zones/plotslop.com \
  -H "Authorization: Bearer $HOSTINGER_API_TOKEN" -H 'Content-Type: application/json' \
  -d '{"overwrite":true,"zone":[
        {"name":"@","type":"A","ttl":300,"records":[{"content":"187.77.218.14"}]},
        {"name":"www","type":"CNAME","ttl":300,"records":[{"content":"plotslop.com."}]}]}'
```

**One thing I would not do even with the key.** The registrar token can repoint all twelve domains
you own, `sang3r.com` included. It does not belong in `/etc/plotslop/env`, which is the file the
application process reads — that would put a credential capable of hijacking your whole estate
inside the blast radius of any RCE in the game server. It belongs in the operator's environment for
the length of the cutover and nowhere else.

**Your web-first decision needs no change to the staged config.** I checked: the nginx I staged
already serves the marketing page and the game from one origin on `plotslop.com`, with
`/socket.io/` proxied to the same backend. That is exactly what you described. Nothing to re-stage.
I also re-checked its `listen` directives against the live convention, because `nginx -t` validates
syntax without attempting to bind and would not catch an address conflict: the staged config binds
`187.77.218.14` and `[2a02:4780:4:1c0b::1]` explicitly, matching all eleven existing sites. No
wildcard, no conflict.

---

## 3. 🔴 Firestore — does the project exist at all?

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

## 4. 🟠 Fire the cutover

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

## 5. 🟠 NEW — the install prompt fires on the player join path

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

## 6. 🟠 `DECISIONS.md` #10 — copy voice

Commit to the joke, or stay earnest? Affects ~122 copy occurrences. **Blocks Chunk 5 only.**

My recommendation is unchanged: commit to the bit in user-facing copy, leave `comedyPrompts.ts`
earnest — it is craft instruction to the model and making it ironic will measurably degrade
output.

One addition since this morning: `app/terms/TermsContent.tsx:76` states the refund policy as
"Stripe or Apple App Store". True today, wrong the moment iOS is host-only and no player ever
buys through Apple. It is a legal page, so it should be right. Folds into the same pass.

---

## 7. 🟡 NEW — two public-domain settings I flagged rather than quietly kept

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

## 8. 🟡 Account-required room creation, eventually

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

## 9. 🟡 You removed a feature and should know it stuck

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
