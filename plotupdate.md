# PlotSlop — where it stands

**A briefing for someone coming in cold.** Written 2026-07-30 by the AI agent doing the
engineering work, for an advisor with no prior context. No jargon assumed; where the project has
its own vocabulary I define it the first time.

---

## 1. What the product is

**PlotSlop is an AI-powered multiplayer improv party game.** Jackbox-shaped: one person hosts on a
big screen, everyone else joins from their phone browser with a room code. Nobody installs
anything.

A round works like this:

1. Up to **eight** players each get dealt a hand of cards and pick one **character**, one
   **setting**, one **circumstance**.
2. Those picks go to Claude, which writes a **~50-line comedy script** casting all eight players.
3. The script comes back and everyone **performs it out loud**, reading their lines off their own
   phone as a teleprompter highlights them.
4. Players vote, someone wins, and the app generates a "director's review" of the performance.

It lives on the web at **plotslop.com**, self-hosted on a single Linux VPS. It was called *Plot
Twists* until this week — the rename was decided on 2026-07-28 and finished shipping on the web on
2026-07-30. The iOS app is shelved and still carries the old name.

**One round costs about $0.056 in Claude API calls.** Players buy credits; one credit is one
round.

---

## 2. The single most important fact

**Nobody has ever played a full game of this with strangers.**

The product is live, the code works, the tests pass, the deployment is healthy. But the entire
project is currently gated on one event that has not happened: Jackson hosting a real round with
**eight people who are not his friends**.

That gate is not incidental. There is a **standing scope freeze** — no new features until it
happens — imposed after an audit on 2026-07-28 found the product had:

- no live deployment at all (no DNS, the old host returning 404),
- a build that had been failing since April,
- a test suite that had been red since April,
- and, meanwhile, referrals, weekly challenges, leaderboards, an XP system and a tvOS app all
  fully built.

The diagnosis was that **building had become a way of avoiding finding out whether the game is
fun.** Jackson asked in writing to be refused if he requested feature work before the playtest,
including anything framed as "quick".

So: everything below is either fixing what was broken, or answering a question the playtest will
settle. None of it is new features.

---

## 3. What happened in this session

Three things, in the order they matter.

### 3a. The big open question: should a major design decision be reversed?

**Background an outsider needs.** In late July the character deck was rewritten. It used to be
**252 named characters** — Shrek, Darth Vader, Tony Soprano and so on. That is a copyright
problem, so it was replaced with **traits**: *"Interprets all silence as agreement"*, *"Has
already searched your bag"*, *"Apologises for things that have not happened yet."* Instead of
playing a character, you play a way of being.

There was also a file in the repo containing **written instructions for how to draw Shrek** for
promotional posters. That got deleted first and separately, on the reasoning that *exposure is
what you did; intent is what you wrote down about doing it.*

**Jackson is now reconsidering.** His worry: the rewrite may have cost more comedy than it bought
in risk. His proposed alternative is **genre category slots** — the game deals you a card reading
*"a 90s sitcom character"* and **you type a name into it**. The product ships the category and
never the name; anything leaving the room renders the category only.

He asked for three things, and refused to be given options to choose between.

**1. What does reversing cost?** ≈**6 sessions of work**, and the cheap version does not exist.
The catalog rewrite everyone thinks *is* the reversal is the cheapest third of it — half the
catalog (the settings and situations) survives untouched, and so does the code that generates it.
The expensive parts are two guarantees that have to be rebuilt rather than edited. Only about 25
of the project's 553 automated tests are a write-off, not 553.

**2. What is wrong with the design?** The strongest argument is not legal:

> Under the trait deck, the game supplies the joke. Under the category design, the joke is
> **recognition** — and recognition is not something the game owns. It is something the room
> either has or does not.

Measured, before anyone read a word: with named characters the AI **writes less**. 6.4 words per
line against 7.2, and in the sparsest case a fifty-line script in 208 words. Lines like
*"Mmmm, crust."* are funny if and only if you brought Homer Simpson with you in your head. **That
is a fine trade at a party of friends and a bad one with eight strangers** — which is precisely
the playtest the whole project is gated on.

Three more findings, all measured rather than argued:

- **The safety screen becomes a popularity detector.** The system that scans generated scripts for
  protected names fires ~30 times per script on famous casts and **zero** times on a cast of
  obscure picks. It is loudest exactly when the comedy is working and silent when it is not. A
  control that punishes your best rounds is one somebody switches off.
- **In 4 of 6 test runs, the published summary would ship mangled.** Because the screen redacts
  names, the one-line synopsis on the results screen reads *"**someone you would recognise** must
  fairly distribute two cakes among eight workers."*
- **The failure mode Jackson predicted is invisible to the instruments.** He worried about seven
  players picking from the same show and one picking something obscure. That case produced the
  **most even line distribution of any run in the experiment**. Seven people performing an in-joke
  and one performing alone looks, in the logs, like the healthiest round of the night.

**3. Is it actually funnier?** This could not be reasoned about, so it was measured. **14 scripts
were generated against the live Claude API, $0.6957 total.** Six matched pairs — same setting,
same situation, same eight seats, same model, same everything except the cast — plus two runs
probing the failure cases.

The result is `AB-PACKET.md`: **six pairs of scripts, labelled A and B, with no indication of
which is which.** Jackson reads it and says a letter. **A 3–3 split is a real answer** and the
most useful one, because it prices the entire question at zero.

*If you are the advisor reading this: a second independent read of that packet would be genuinely
valuable, and you are better placed to give one than anybody who has been inside this project.
Read `AB-PACKET.md` **before** `CHUNK4-REVERSAL-ANALYSIS.md` — the analysis says which arm is
which near the end.*

### 3b. Infrastructure verification that had been deferred for two days

PlotSlop runs on the same VPS as Jackson's personal site, which holds his own data. It has a
demonstrated memory-exhaustion path. So it runs under a locked-down service configuration —
capped memory, capped CPU, its own user, its home directory made invisible — and a five-part
checklist existed to prove those caps are real on the **running** service rather than on a test
copy of it.

**Four of five checks now pass, with numbers:**

| | |
|---|---|
| Memory and CPU caps | Configuration and kernel agree exactly. 768 MB ceiling, no swap, one CPU core. |
| CPU cap actually bites | Four competing workloads on a two-core machine consumed exactly **1.00 core** over a 10-second window, not 2.00. |
| Home directory hidden | From inside the service, `/root` is an **empty directory**. From outside it has 22 entries. Jackson's other project and its secrets are invisible rather than merely unreadable. |
| Data location | The service's own tree is read-only except for its database directory. |

The fifth — deliberately exhausting memory to prove the service dies cleanly rather than freezing
— **was not run**, and the reason is worth stating precisely: an automated permission guard on the
agent's own tooling blocked it as a denial-of-service pattern. That block was not worked around.
The script is written and waiting.

### 3c. A rate-limiting bug, fixed and deployed

The server sat behind a reverse proxy without being told so, which meant **every visitor on earth
looked like the same visitor** to the rate limiter. Fixed, tested, deployed at 22:07 UTC.

The interesting part is the value: `1`, not `true`. Setting it to `true` would let any visitor
forge a header and choose their own rate-limit bucket — **a limiter that is worse than none,
because it looks like one.** There is now a test that fails if anyone changes it.

---

## 4. A finding from writing this document

Preparing the section above, I checked the unit economics against the written record and found
**the margin table in the project's decisions log is stale by 37.6%.**

It was computed when a script was 30–38 lines. The line budget was raised to 42–52 the same week
— the new cost was recorded, **the tier margins were never recomputed.**

| tier | net per credit (Stripe) | margin then → now |
|---|---:|---|
| Starter, $5 / 20 credits | $0.228 | 5.6× → **4.1×** |
| Party, $10 / 50 | $0.188 | 4.6× → **3.4×** |
| Pro, $50 / 300 | $0.161 | 4.0× → **2.9×** |
| Studio Head, $100 / 1000 | $0.097 | 2.4× → **1.7×** |

Every tier still clears cost on the web. But **Studio Head bought through Apple's App Store is now
1.25×** — about twenty cents of margin on a $100 purchase, before hosting, before support.

The part worth an advisor's attention is *how* it went stale. That decision entry wrote its own
tripwire: *"If Studio Head is ever offered through Apple IAP, that tier gets re-run against fresh
numbers before it ships."* The tripwire was set to fire on a **payment-rail** change. What
actually moved was **cost**. **A guard that watches one input while the other one moves is not a
guard** — and this is the fourth or fifth instance of that same shape found in this project in a
week.

It is now recorded and reopened as a watch item. It blocks nothing before the playtest.

---

## 5. What I asked Jackson for, and what he owes nobody

At the end of the session I sent him this, and it is still open:

> **Read `AB-PACKET.md` and tell me a letter.** Six pairs, twelve scripts, about ten minutes. Same
> setting and situation within each pair; the only thing that differs is the cast. A 3–3 split is
> a real answer.

That is the **only** thing asked of him that is not a password. It is asked of him because *"is it
funnier"* has no instrument — it is the one question in this project that cannot be automated, and
he said it is the only part he would do.

**Everything else was taken off his plate this session.** He set a new operating rule that
triggered it:

> Stop routing decisions and verification back to me. I am the messenger, not a QA tester and not
> a project manager. If something can be done, decided, or measured without my account
> credentials, do it and tell me what happened. If you think an item genuinely needs me, say WHY
> it needs my credentials specifically, not why you'd prefer a human ruling.

The blocked-items queue went from **six items to three**, and all three now need a credential that
does not exist on the server:

1. **Delete an old Vercel project** — no API token on the box, and the live game server still
   trusts that project's preview URLs as an origin. That trust should not outlive the project.
2. **Create a production Clerk instance** (the login provider) — the live site is running on a
   *development* auth instance. Fine for a playtest, not for launch.
3. **An Android signing-key fingerprint** — lives only on his laptop. Low stakes; the game is
   web-only.

---

## 6. What is genuinely unverified

Stated plainly, because the honest list is short and it matters more than the long list of things
that work:

- **A rendered teleprompter in a real game.** The code that tells a player *"your turn"* has never
  been observed firing for a human being. It is proven to be in the browser bundle; a bundle is
  not a rendered label. Until three days ago it could not have worked at all — every script the
  product had ever generated gave its parts to invented characters who belonged to nobody in the
  room.
- **Whether the game is fun.** No evidence either way from anyone who is not Jackson.
- **Whether the service dies cleanly under memory pressure** (§3b, box five).
- **Whether the AI-generated audience "plot twists" feature works** — it silently falls back to
  canned templates on error, so its failure mode looks like *boring*, not *broken*.

---

## 7. If you want to go deeper

Files in this folder, in the order they are worth reading:

| file | what it is |
|---|---|
| **`AB-PACKET.md`** | The blind test. Twelve scripts. **Read this first** — the others spoil it. |
| **`CHUNK4-REVERSAL-ANALYSIS.md`** | The full argument: reversal costed layer by layer, the case against the proposed design, and the measurements. ~25 KB. |
| `SESSION-2026-07-30-CHUNK4.md` | What happened this session, written for Jackson. |
| `NEEDS-JACKSON.md` | The open queue — three items, plus a watch-list for the playtest. |
| `BACKLOG.md` | Everything deliberately parked until after the playtest, with reasons. |
| `HANDOFF.md` | 88 KB of engineering context. For an engineer, not an advisor. Includes a running list of **27 corrections to the project's own written record**, which is the most honest artefact here. |

### The vocabulary

- **Chunk** — a numbered unit of the recovery plan. Chunk 1 was deployment, Chunk 4 was the IP
  problem, Chunk 5 was the rename.
- **Layer 1 / 2 / 3** — the three parts of the copyright fix. Layer 1 is what is in the card deck,
  layer 2 stops a player typing a protected name, layer 3 screens what the AI writes. Jackson's
  own rule: *"The IP fix is not the catalog rewrite. It is three layers, and shipping any one
  alone is theater."*
- **The harness** — an end-to-end test that drives real sockets through a whole game against a
  fake AI. 50/50 passing.
- **The two trees** — the source code lives in one directory and the running service in another,
  joined by a deploy script. Building in the first and restarting the service changes nothing and
  looks completely successful. This caused a real incident yesterday.

### Current health

`553/553` unit tests · `50/50` harness · type-check clean · build clean · site live · zero errors
in the service log since the last restart.

---

## 8. The one thing to take away

The engineering is in good shape and has been for about a week. **The risk in this project is not
technical.**

It is that a great deal of careful work — a copyright rewrite, a rename, a deployment, a rate
limiter, a cost model — has been done for a game that **eight strangers have never played once**.
Every open question of consequence, including the design question this whole session was about,
resolves the moment that happens and not before.

The most useful thing an advisor could do is make that evening happen sooner, and read the packet.
