# NORTH-STAR — what PlotSlop should look and feel like

**Source of the aesthetic:** the six deleted showcase one-sheets (Chunk 4a,
removed for IP reasons). They were studied from git history in an off-repo
scratchpad for this document. Per that chunk's ruling, **no image, franchise,
or character name from them is ever committed** — what carries forward is the
design language, which was never the infringing part.

## The one-line brief

**A film studio's marketing department took a very silly party game completely
seriously.** Every surface is produced, not decorated. The comedy comes from
the gap between the earnest register and the absurd content — the design never
winks, never bubbles, never tells you it's funny.

## The six principles (distilled from the reference set)

1. **Deadpan commitment.** The absurd premise gets full production values:
   real shadows, atmospheric light, photographic depth, grain. Nothing flat,
   nothing cartoon. If a screen looks like it knows it's a joke, it fails.
2. **One-sheet grammar.** The 2:3 poster is the sacred object of this product.
   Title block lives in the bottom fifth; a billing-block of micro-type
   (9–10px, tracked wide, uppercase) is the signature texture of legitimacy.
   Use it on posters, results, share cards — sparingly elsewhere.
3. **Host-genre fidelity, one world per surface.** Each reference poster fully
   committed to a single genre's palette and light (fluorescent office beige;
   overcast suburban grey; sun-blasted desert; candy-neon stage; beach chroma;
   warm 90s interior). The rule: **one dominant world-palette plus exactly one
   high-chroma accent.** Never three accents competing (this is homepage
   finding #3 — see LEDGER).
4. **The star is centered and lit.** Every screen has one subject; it gets the
   light, the scale, and the contrast. Everything else recedes into supporting
   cast. Six identical-weight sidebar rows = no star = failure (homepage
   finding #4).
5. **Typography does the register work.** Display type is earnest and
   genre-styled — serif gravitas, condensed impact, painted drama — never
   rounded/bubbly. Micro-type is texture. Body copy is quiet sentence-case
   prose: **uppercase + letterspacing is a label treatment, never a sentence
   treatment** (homepage finding #2).
6. **Motion is a camera, not a toy.** Slow push-ins, parallax, crossfades,
   light sweeps — the vocabulary of trailers and title sequences. Springs and
   bounces only where a physical object (card, ticket) is being handled.
   Everything honors `prefers-reduced-motion`.

## Translation table

| Poster language | UI equivalent |
|---|---|
| Billing block micro-type | Tracked uppercase 9–10px credit lines under heroes/results |
| One genre palette per poster | One world-palette per route; theater mode in-game |
| Photographic grain/atmosphere | Subtle noise/vignette on dark surfaces, never on reading surfaces |
| Title in bottom fifth | Hero composition: image/subject above, typography anchored low |
| The absurd element lit as star | The script/card/winner gets peak contrast; chrome recedes |
| Earnest credits ("directed by…") | Deadpan produced-by copy voice in empty states and footers |

## Homepage direction — binding constraint

**Moving away from the cinema "Now Showing" marquee format. Do not reinvent
it.** (Jackson, 2026-08-06.) The four failure modes of the current page, in his
words (BACKLOG.md Chunk 7): "Now Showing" appears four times above the fold;
letterspaced uppercase used for body copy; three competing accents on
near-black; six sidebar rows with identical weight and no hierarchy. Whatever
replaces it must not be a re-skinned marquee.

## Anti-patterns (the wink list)

- Rounded/bubbly display type (the current Fredoka display font is on notice —
  replacing it is a token iteration, argued in its own commit).
- More than one accent color active on a surface.
- Uppercase-letterspaced sentences.
- Confetti, wobble, or bounce on anything that isn't a physical object.
- Glass pills and gradient borders as default decoration.
- Any franchise-identifiable name, silhouette, or costume in copy, placeholder
  examples, or generated assets. (Gate: `contentSource.test.ts` runs every
  iteration.)
