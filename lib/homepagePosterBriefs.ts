export interface HomepagePosterBrief {
  slug: string
  title: string
  publicSafeTitle: string
  hook: string
  prompt: string
  fallbackPalette: {
    background: string
    accent: string
    text: string
  }
}

const SHARED_POSTER_SUFFIX = `Create a theatrical 2:3 portrait movie poster with one dominant focal subject, strong readable silhouette, cinematic lighting, and a clean lower area reserved for title treatment. Do not add logos, studio marks, watermarks, or embedded poster text unless explicitly requested. Avoid collage clutter, malformed anatomy, extra limbs, unreadable faces, and generic AI gloss. Preserve the intended source-medium logic exactly. The humor must come from the crossover collision, not from turning everything into the same visual style.`

export const HOMEPAGE_POSTER_PRIMARY_MODEL = process.env.GEMINI_POSTER_PRIMARY_MODEL || 'gemini-3.1-flash-image-preview'
export const HOMEPAGE_POSTER_FALLBACK_MODEL = process.env.GEMINI_POSTER_FALLBACK_MODEL || 'gemini-2.5-flash-image'

export const HOMEPAGE_POSTER_BRIEFS: HomepagePosterBrief[] = [
  {
    slug: 'shrek-in-seinfeld',
    title: 'Shrek in Seinfeld',
    publicSafeTitle: 'Swamp Roommate',
    hook: 'The only animated ogre in a totally normal 90s sitcom apartment.',
    fallbackPalette: {
      background: 'linear-gradient(180deg, #f4dbc3 0%, #dfc4aa 58%, #b98f63 100%)',
      accent: '#7a9f47',
      text: '#24160d',
    },
    prompt: `Create a theatrical 2:3 portrait crossover movie poster for "Shrek in Seinfeld."

Core concept:
An animated swamp ogre becomes the most disruptive presence inside a grounded 1990s Manhattan sitcom universe.

Medium rules:
Shrek must remain fully animated, clearly cartoon and fantasy in his original kind of visual logic: broad ogre silhouette, expressive animated face, textured green skin, fairy-tale creature rendering.
He must be the only animated subject in the image.
All humans, furniture, props, streets, and interiors must remain live-action and grounded.
Do not cartoonize the world.
Do not make Shrek photorealistic.

World style:
The world should feel like a live-action 1990s New York sitcom: cozy apartment realism, mild observational-comedy tension, natural human reactions, warm practical lighting, everyday city texture.

Composition:
Center or foreground Shrek inside a recognizable sitcom-style apartment or social setup while realistic human characters react around him with annoyance, confusion, or deadpan disbelief.
The image should look like a real comedy one-sheet, not a parody meme collage.

Tone:
Dry, neurotic, socially uncomfortable sitcom energy.
The joke is that one obviously animated ogre exists in a normal live-action TV-comedy frame.

${SHARED_POSTER_SUFFIX}`,
  },
  {
    slug: 'lightning-mcqueen-in-the-sopranos',
    title: 'Hotshot Racer in The Sopranos',
    publicSafeTitle: 'Pit Crew Mob Boss',
    hook: 'An animated hotshot race car framed like a dead-serious suburban crime legend.',
    fallbackPalette: {
      background: 'linear-gradient(180deg, #78808c 0%, #4a4c55 62%, #19181d 100%)',
      accent: '#d53b2f',
      text: '#faf7f1',
    },
    prompt: `Create a theatrical 2:3 portrait crossover movie poster for "Hotshot Racer in The Sopranos."

Core concept:
A bright animated race car is treated with total seriousness inside a grim suburban mob-family drama.

Medium rules:
The lead vehicle must remain fully animated, clearly stylized as an expressive cartoon race car with glossy red bodywork, large windshield eyes, a confident smile, racing decals, and a sleek championship silhouette.
He must be the only animated subject in the image.
All humans, streets, houses, clothing, sky, lighting, and props must remain grounded live-action realism.
Do not make the world cartoonish.
Do not make the car photorealistic.
Do not distort the car's facial construction, proportions, or silhouette.
Do not melt, stretch, or semi-realistically reinterpret the car.
Do not use copyrighted logos, exact franchise markings, or exact studio-specific character features.

World style:
Live-action prestige-crime New Jersey suburbia, muted palette, overcast or moody lighting, ominous family tension, expensive but weary domestic realism.

Composition:
Create a true one-sheet composition, not a candid still.
Frame Lightning McQueen as though he belongs in a serious mob-family poster: driveway portrait, family lineup, or quiet suburban confrontation.
Use a low camera angle, strong visual hierarchy, and a clear lower title-safe area.
The surrounding humans must look realistic and deadly serious.
Favor one powerful tableau over multiple visual ideas.

Tone:
Prestige crime drama played completely straight.
The humor comes from a vividly animated race car being accepted by a live-action mafia world.

${SHARED_POSTER_SUFFIX}`,
  },
  {
    slug: 'ned-stark-in-hannah-montana',
    title: 'Ned Stark in Hannah Montana',
    publicSafeTitle: 'Winter Lord of Pop',
    hook: 'A severe fantasy father inside a glossy teen pop double-life poster.',
    fallbackPalette: {
      background: 'linear-gradient(180deg, #8d8ac4 0%, #e7b5d5 54%, #f7ddb9 100%)',
      accent: '#353f7e',
      text: '#20152d',
    },
    prompt: `Create a theatrical 2:3 portrait crossover movie poster for "Ned Stark in Hannah Montana."

Core concept:
A stern medieval-fantasy patriarch is trapped inside a glossy live-action teen pop double-life universe.

Medium rules:
Everything must remain live-action.
Ned Stark must look like a grounded, realistic fantasy-drama character: severe expression, heavy medieval clothing, strong northern-warrior presence.
The surrounding world must remain bright, glossy, youthful, and celebrity-pop driven.
Do not cartoonize anything.
Do not turn the whole image grim or desaturated.

World style:
Live-action Disney-style teen-pop atmosphere: stage lights, bright wardrobe, backstage sparkle, polished celebrity fantasy, playful public-versus-private identity energy.

Composition:
Create a polished theatrical one-sheet, not a concert photo.
Use a split-world or stage-and-backstage composition where Ned stands out immediately as emotionally and visually incompatible with the pop-star environment.
He should look stoic, burdened, and completely out of place.
Favor a strong central hero portrait with pop-world imagery, signage, or backup performers around him instead of a literal performance snapshot.
Keep a clean lower title-safe area with no built-in text.

Tone:
Fish-out-of-water tonal collision.
The world stays fun and glossy; Ned stays severe and realistic.

${SHARED_POSTER_SUFFIX}`,
  },
  {
    slug: 'barbie-in-breaking-bad',
    title: 'Barbie in Breaking Bad',
    publicSafeTitle: 'Plastic Queenpin',
    hook: 'A fashion-doll icon dropped into a desert crime spiral.',
    fallbackPalette: {
      background: 'linear-gradient(180deg, #ffd4ea 0%, #f39bb6 42%, #d3ae72 100%)',
      accent: '#ff4d98',
      text: '#2d1621',
    },
    prompt: `Create a theatrical 2:3 portrait crossover movie poster for "Barbie in Breaking Bad."

Core concept:
Ultra-polished doll-like glamour collides with a harsh live-action desert crime world.

Medium rules:
Everything must read as live-action.
The lead character should have high-fashion, doll-inspired styling: immaculate silhouette, glossy beauty, controlled pink-forward styling, but still physically plausible and cinematic.
The world must remain grounded crime-drama realism.
Do not turn the entire image into plastic CGI.
Do not soften the danger of the environment.

World style:
Live-action desert crime realism: harsh sun, dry air, dusty landscapes, tense criminal atmosphere, faded infrastructure, moral collapse.

Composition:
Create a true theatrical one-sheet with narrative tension, not an editorial fashion photograph.
Place the polished heroine prominently against hostile desert-crime surroundings.
Use strong contrast between candy-clean styling and brutal environment.
Include visual signs of danger, criminal stakes, and desert-lawlessness in the environment.
Use stronger depth, foreground-background drama, and a clean lower title-safe area.
The poster should feel expensive, dangerous, ironic, and story-driven.

Tone:
Elegant surface beauty inside a grim criminal world.
The humor is tonal and visual contradiction, not cartoon parody.

${SHARED_POSTER_SUFFIX}`,
  },
  {
    slug: 'darth-vader-in-the-office',
    title: 'Dark Lord in The Office',
    publicSafeTitle: 'Dark Lord of Human Resources',
    hook: 'A black-armored galactic tyrant as the most unbearable person in a paper company.',
    fallbackPalette: {
      background: 'linear-gradient(180deg, #eef2f3 0%, #c8d0d2 48%, #8a9499 100%)',
      accent: '#101010',
      text: '#101820',
    },
    prompt: `Create a theatrical 2:3 portrait crossover movie poster for "Dark Lord in The Office."

Core concept:
A towering black-armored galactic tyrant becomes the most unbearable presence in a painfully ordinary paper company.

Medium rules:
Everything must remain live-action.
The dark lord must remain cinematic live-action sci-fi: black armor, imposing silhouette, realistic materials, physically present, serious and intimidating.
The office world must remain plain, fluorescent, beige, documentary-style realism.
Do not cartoonize the dark lord.
Do not make the office stylized or futuristic.
Do not use copyrighted logos, exact franchise insignia, or exact studio-specific costume markings.

World style:
Bland mockumentary workplace realism: dull conference room, cubicles, breakroom lighting, awkward coworkers, suburban office park energy.

Composition:
Use a conference-room, bullpen, or group-office composition where the dark lord dominates the frame while normal coworkers sit or stand around him in visible discomfort.
He must be treated visually with total seriousness.
Create a strong one-sheet composition with a clean lower title-safe area and no built-in text.

Tone:
Deadpan corporate misery.
The joke is a huge cinematic tyrant inserted into a tiny ordinary office world.

${SHARED_POSTER_SUFFIX}`,
  },
  {
    slug: 'wednesday-addams-in-baywatch',
    title: 'Wednesday Addams in Baywatch',
    publicSafeTitle: 'Gloom Girl Lifeguard',
    hook: 'A gothic deadpan outsider planted in a hyper-glossy beach rescue drama.',
    fallbackPalette: {
      background: 'linear-gradient(180deg, #9ee3f5 0%, #ffb572 56%, #ff6b5f 100%)',
      accent: '#1b1a24',
      text: '#17161b',
    },
    prompt: `Create a theatrical 2:3 portrait crossover movie poster for "Wednesday Addams in Baywatch."

Core concept:
A gothic deadpan outsider stands motionless inside a hyper-glossy sun-drenched lifeguard-action melodrama.

Medium rules:
Everything must remain live-action.
Wednesday must remain pale, dark, severe, gothic, emotionally still, and visually restrained.
The surrounding beach world must remain bright, glossy, athletic, and dramatically sunny.
Do not turn the whole poster horror-dark.
Do not drain the beach world of color.

World style:
Live-action beach-action glamour: golden sunlight, intense ocean blue, red rescue accents, fitness-heavy ensemble energy, dramatic slow-motion rescue atmosphere.

Composition:
Place Wednesday as the central or strongest visual anchor while bright lifeguard action, motion, or posed beach drama surrounds her.
She should feel emotionally disconnected from the world around her.

Tone:
Extreme contrast between cheerful beach melodrama and gothic indifference.

${SHARED_POSTER_SUFFIX}`,
  },
]

export function getHomepagePosterBySlug(slug: string) {
  return HOMEPAGE_POSTER_BRIEFS.find((poster) => poster.slug === slug)
}
