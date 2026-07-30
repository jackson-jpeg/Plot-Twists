# Session report — 2026-07-30, night

**The short speaker label, six empty poster slots, and a deploy that changed nothing.**

Machine labels: `[VPS]` = the Linux box, `[MACBOOK]` = your Mac.

---

## What you asked for

1. **Do the shorter display form, keep the binding.**
2. **BUG, do now:** the homepage poster wall renders six empty gradient placeholders. Generate
   posters *or* restyle the cards to have no image slots — **say which is cheaper first**, and
   **curl the page and look at what actually renders, don't assume.**
3. **NOT NOW, log it:** the homepage design pass as Chunk 7, with four named findings.
4. **What should you watch for while hosting tonight?**

All four done. Deployed **20:17 UTC**. The watch-list is at the top of `NEEDS-JACKSON.md`.

---

## 1. The short speaker label

Labels are now the **shortest unique prefix** of the trait: 45 characters become 17-26, one line
each at 13px instead of two or three.

```
Was promoted last week and has not recovered   →  WAS PROMOTED LAST…
Asks how much everything cost                  →  ASKS HOW MUCH EVERYTHING…
Interprets all silence as agreement            →  INTERPRETS ALL…
Suggests a group photograph at every escalation →  SUGGESTS A GROUP…
```

Applied on the teleprompter (current line and Up Next), the host screen (per line, and the cast
list under the title — eight full traits joined by `·` was its own wall of text) and the replay
viewer.

### The rule the whole thing rests on

> **Shortening is a rendering concern. Identity is not.**

| Keeps the full trait | Shows the short label |
|---|---|
| `isMyTurn` — `MobileTeleprompter.tsx:99` | the current-line speaker |
| clip and digest attribution | the "Up Next" footer |
| `formatScriptAsText` — the copy a player shares | host screen, per line and cast list |
| every `aria-label` — screen readers get the whole card | replay viewer, both views |

A test reads component source **as text** to hold that line, because the separation cannot be
observed at runtime: an edit that swapped `labelFor(...)` into the `===` would pass every
behavioural test in the file and silently un-fix last night's bug.

### Why a prefix and not something cleverer

The player is holding the card. A prefix is something they can match against what is in their
hand. *"Treats every conversation as a negotiation"* could be summarised as "A NEGOTIATION", which
is shorter and matches nothing they can see. Prefixes are also deterministic, which is what makes
the next part possible.

### The failure this could have introduced

Two cards in your deck open identically — *"Has already searched your bag"* and *"Has already named
the children"*. If both shortened to the same label, **the teleprompter would show one player's cue
to another.** That is worse than the wrapping it replaces. Colliding labels grow a word at a time
until they separate; uniqueness beats brevity whenever the two conflict, and the loop terminates
even for two speakers that cannot be separated at all.

### Verification

23 new tests, suite **517 → 540**. Both guards proved non-vacuous by injection, per rule 2.2:

| Injected regression | What went red |
|---|---|
| neutered the collision-growth loop | the collision test, only |
| `isMyTurn` compares the **label** | the source-scan test, only |

Restored and re-greened at 23/23.

---

## 2. The poster wall — and the answer to "which is cheaper"

**Restyle. And the deciding factor was not the money.**

| | generate six posters | remove the image slots |
|---|---|---|
| Gemini calls | ~$0.24 | $0 |
| Rewrite the generator + six briefs (both deleted in 4a) | yes | no |
| New IP surface needing **your** judgement | six images | none |
| Repo weight | ~11 MB | 0 |
| Survives Chunk 7 | probably not | n/a |

The six archetype titles map one-to-one onto the characters 4a removed. Any brief detailed enough
to make a good poster is a brief that has to be **defended** — and 4a's finding was that the briefs
were worse than the images, because they were evidence of intent. **Generating artwork re-opens the
question you closed three days ago.**

### You said don't assume — so I looked, and curl is not enough here

`curl https://plotslop.com/` returns 25 KB containing the words "PlotSlop" and "Join Game" and
nothing else. The homepage is client-rendered behind an auth check, so the poster wall does not
exist in the HTML at all. **It takes a real browser to see this page.** I drove one.

What was actually there, two mechanisms: `imagePath` was `undefined` on all six entries so the
`<img>` never mounted (code), and the live DOM had `imgCount: 0` with six thumbnail divs holding
zero children over a bare `linear-gradient` (browser).

### What changed

`imagePath` is **gone from the interface**, not left optional-and-unset — an unset optional reads
as "artwork is coming", and it is not. The 80px thumbnail column became a 3px accent rule. The
hero card no longer reserves poster-shaped space it will never fill.

Verified after deploying, at 1280px and 390px: zero `<img>`, six rows, no horizontal overflow.

---

## 3. Chunk 7, logged and not touched

Your four findings are in `BACKLOG.md`, each with the file and line that causes it. I counted the
duplication rather than repeating your estimate: **"Now Showing" appears four times** before the
fold — marquee subtitle, section heading, hero pill, and the active row's status label, while the
other five rows say "Coming Soon".

I added one you did not list, and left it alone under the same freeze: **a near-white strip under
the landing page on mobile.** `body` is `#FAFAF9` and the shell paints nothing over it, so the
72px bottom-nav allowance shows body colour. Pre-existing and not caused by the card change —
`/join` has no strip only because its `<main>` has no bottom padding. Shortening the poster wall
just brings it into view sooner. Desktop is unaffected. The fix is one background declaration, but
*which element owns the page background* is a shell decision, and that is Chunk 7's to make.

---

## 4. The thing I got wrong tonight

**I built, restarted the service, and changed nothing.**

The unit runs `WorkingDirectory=/srv/plotslop`. The source tree at `/root/Plot-Twists` is only an
input — `deploy.sh` builds there and then **rsyncs** to the runtime tree, and it is the rsync that
matters. I ran `npm run build` and `systemctl restart plotslop` by hand and got a healthy service
serving the old code.

Every gate was green. The service was active. The site returned 200. **I only caught it because I
loaded the page in a browser and saw the old layout** — which is the same lesson as this morning's
invite card, arriving from a direction I had not considered: not "compiling is not responding" but
"restarting is not deploying".

Recorded in `HANDOFF.md` §16 and in the deploy row of §1.

One smaller thing: `next build` fails without `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. It is documented
at the top of `deploy.sh`; it bites anyone who runs `npm run build` directly.

---

## Verification

| Gate | |
|---|---|
| `npx tsc --noEmit` | 0 errors |
| `npx jest` | **540/540** (was 517) |
| `npx tsx scripts/harness/run.ts` | **50/50** |
| `npm run build` | exit 0 |
| Live routes | **16 curled, no 500s** |
| Homepage in a real browser | 1280px and 390px, zero `<img>`, no overflow |
| Label code in the **served** bundle | the compiled wrapper regex fetched over TLS |
| Journal since restart | 0 errors |

`deploy.sh` took its EOF abort at the restart prompt again. I checked the window first — the only
connections on :3100 were my own browser through nginx — and completed it by hand at 20:17:26.
Did not pipe `y`.

### Still not verified

**A rendered teleprompter on a real game.** No game has been completed on the deployed instance, so
there is no replay to render, and the credit gate stops an anonymous host generating one. What is
proven is that the code reaches browsers: the served chunk contains the compiled label function.
Disk presence and a served bundle are two mechanisms; **neither one is a rendered label.**

Your round tonight closes this and the §0 item from the earlier pass together.

---

## Two things found along the way, neither of them fixed

**A stray credential file, mine.** Running `npx tsx server.ts` by hand without sourcing
`/etc/plotslop/env` makes the Clerk SDK create a throwaway instance and write
`.clerk/.tmp/keyless.json` — containing a `publishableKey` **and** a `secretKey`. It is gitignored
by an entry the SDK adds itself, so nothing in the commit path sees it; but rsync does not read
`.gitignore`, and it rode into `/srv/plotslop`. Never committed, never tracked, and the credential
was for the SDK's own disposable instance rather than yours — the running service takes its keys
from `EnvironmentFile` regardless. Removed from both trees, and `deploy.sh` now excludes it so the
next person to make the same mistake is covered.

**`trust proxy` is never set**, and everything arrives through nginx — so `req.ip` is the nginx
loopback address for every visitor. The limiters that matter are unaffected (room creation and
script generation are socket-keyed, not IP-keyed). The one casualty is a 30/minute limit on two
read-only metadata routes, now shared by everybody instead of per visitor. One-line fix, not
shipped: it is a security-middleware change and tonight is the wrong night. Detail in
`NEEDS-JACKSON.md`.

---

## What is yours now

Six items in `NEEDS-JACKSON.md`, down from seven — and the top one is no longer a design question
waiting on you. **Read the ⭐ watch-list at the top of that file before you host.** The short
version: sign in first, or the round stops at the credit gate; and the one thing only tonight can
prove is whether YOUR TURN fires for a real person.

Afterwards this makes your playtest a measurement rather than an impression:

```
[VPS] journalctl -u plotslop --since "1 hour ago" | grep -E "Cast binding|not seated|no lines at all|below the 3-line"
```

Every generation logs one line with the real per-seat distribution, plus a warning for any off-cast
speaker, any silent player and anyone under the floor.
