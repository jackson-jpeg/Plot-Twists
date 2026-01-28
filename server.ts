import 'dotenv/config'
import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server as SocketIOServer } from 'socket.io'
import express from 'express'
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  Room,
  Player,
  CardSelection,
  RoomSettings,
  Script,
  ScriptLine,
  AudienceReactionType,
  ScriptCustomization,
  AudioSettings,
  CardPack,
  SoundEffectType
} from './lib/types'
import { getFilteredContent, getGreenRoomQuestion } from './lib/content'
import { v4 as uuidv4 } from 'uuid'
import Anthropic from '@anthropic-ai/sdk'
import { ScriptSchema } from './lib/schema'
import { configureSecurityMiddleware, validateEnvironment } from './server/middleware/security'
import { SocketRateLimiter } from './server/middleware/rateLimiter'
import { sanitizeInput as sanitizeUserInput, isValidRoomCode, isValidNickname } from './server/utils/validation'

// Feature Services
import {
  initializeAudienceState,
  recordReaction,
  canSendReaction,
  startPlotTwist,
  votePlotTwist,
  finalizePlotTwist,
  generateTwistInjection,
  resetReactionCounts
} from './server/services/audience.service'
import {
  buildCustomizationPrompt,
  getMaxTokens,
  getLineCountRange,
  validateCustomization
} from './server/services/scriptCustomization.service'
import {
  listCardPacks,
  getCardPack,
  getPackCards,
  createCardPack,
  rateCardPack,
  incrementDownloads,
  STANDARD_PACK_ID
} from './server/services/cardpack.service'
import {
  enhanceScriptWithAudio,
  validateAudioSettings,
  getSoundEffectUrl,
  getAmbienceTrack,
  createDefaultAudioSettings
} from './server/services/audio.service'
import {
  saveGame,
  getGame,
  getGameByShareCode,
  getPlayerGames,
  shareGame,
  exportGameAsText
} from './server/services/gameHistory.service'
import {
  getPlayerStats,
  recordGameResult,
  getLeaderboard,
  unlockAchievement
} from './server/services/playerStats.service'

// Validate environment on startup
validateEnvironment()

const dev = process.env.NODE_ENV !== 'production'
const hostname = dev ? 'localhost' : '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// In-memory room storage
const rooms = new Map<string, Room>()

// Track teleprompter timeouts per room
const roomTimeouts = new Map<string, NodeJS.Timeout>()

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

// Generate a unique 4-letter room code
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude confusing characters
  let code = ''
  do {
    code = ''
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
  } while (rooms.has(code))
  return code
}

// Socket.io rate limiters
const roomCreationLimiter = new SocketRateLimiter(10, 5 * 60 * 1000) // 10 rooms per 5 minutes
const scriptGenerationLimiter = new SocketRateLimiter(20, 10 * 60 * 1000) // 20 scripts per 10 minutes
const joinRoomLimiter = new SocketRateLimiter(30, 60 * 1000) // 30 joins per minute
const reactionLimiter = new SocketRateLimiter(60, 60 * 1000) // 60 reactions per minute
const cardPackLimiter = new SocketRateLimiter(5, 60 * 1000) // 5 pack operations per minute

// Track plot twist timeouts per room
const plotTwistTimeouts = new Map<string, NodeJS.Timeout>()

// Sanitize user input (use enhanced version from utils)
function sanitizeInput(input: string): string {
  return sanitizeUserInput(input, 50)
}

// Clean up inactive rooms (runs every 5 minutes)
setInterval(() => {
  const now = Date.now()
  const oneHour = 60 * 60 * 1000
  for (const [code, room] of rooms.entries()) {
    if (now - room.lastActivity > oneHour) {
      console.log(`Cleaning up inactive room: ${code}`)
      rooms.delete(code)
    }
  }
}, 5 * 60 * 1000)

// Generate script using Claude
async function generateScript(
  characters: string[],
  setting: string,
  circumstance: string,
  isMature: boolean,
  gameMode: 'SOLO' | 'HEAD_TO_HEAD' | 'ENSEMBLE',
  previousScript?: Script,
  customization?: ScriptCustomization
) {
  const isSoloMode = gameMode === 'SOLO'
  const numPlayers = characters.length
  const characterList = characters.join(', ')

  // Get customization prompt if provided
  const customizationPrompt = customization
    ? buildCustomizationPrompt(customization, gameMode)
    : ''

  // Get script length requirements
  const lineRange = customization
    ? getLineCountRange(customization.scriptLength)
    : { min: 30, max: 40 }

  // Get max tokens based on customization
  const maxTokens = customization
    ? getMaxTokens(customization.scriptLength, gameMode)
    : (gameMode === 'ENSEMBLE' ? 10000 : 8192)

  // Build comedy writing guidelines based on rating
  const comedyGuidelines = isMature ? `
═══════════════════════════════════════════════════════
18+ MODE: WRITE LIKE SNL AT 1AM (NO CENSORS)
═══════════════════════════════════════════════════════

THE GAME OF THE SCENE:
Every scene needs a GAME - the central comic idea you're exploring. Examples:
- "What if a kindergarten teacher had to explain Bitcoin to actual wolves?"
- "Gordon Ramsay critiques a funeral he's catering"
- "A couple's therapist realizes both clients are serial killers"
Find the game IMMEDIATELY (line 1-3) and PLAY IT HARD.

CHARACTER DYNAMICS = COMEDY:
- CONFLICT over agreement (people arguing is funnier than people agreeing)
- STATUS GAMES (who has power? who's losing it? flip it unexpectedly)
- EMOTIONAL STAKES (even absurd characters must WANT something badly)
- FLAWS ARE FUNNY (cowards, narcissists, idiots, perverts - embrace it)
- Let characters be CONFIDENTLY WRONG about everything

THE PROFANITY PRINCIPLE:
Swearing is a SPICE, not the meal. Use it when:
- Frustration boils over ("Are you f*cking kidding me right now?")
- Shock value at the perfect moment (quiet conversation → sudden "SHIT!")
- Character voice demands it (drill sergeant, sailor, bitter ex)
DON'T just pepper it randomly. Earn each f-bomb.

TABOO TOPICS = COMEDY GOLD:
You can explore: sex, death, drugs, politics, religion, bodily functions, trauma
But be SPECIFIC and SURPRISING, not just edgy for edge's sake:
- BAD: "Haha, sex!"
- GOOD: "I'm not saying I'd sleep with my therapist, I'm saying I already did and now he won't validate my parking."

SURPRISE & MISDIRECTION:
Set up an expectation, then violate it:
- Character A: "I have something important to tell you."
- Character B: "You're dying."
- Character A: "No, I'm pregnant."
- Character B: "With what?"

THE RHYTHM OF FUNNY:
Long setup → SHORT punchline.
Or: Short, short, short → LONG ridiculous rant.
Vary it. Comedy lives in the unexpected beat.

CALLBACKS & RUNNING GAGS:
If something lands early (weird detail, strange accusation, dumb logic), BRING IT BACK.
Example: "Still not sorry about the ferrets!" mentioned casually in line 8 becomes the reveal in line 35.

AVOID LIKE POISON:
- Characters going "This is insane!" (we KNOW it's insane, that's not a joke)
- Explaining the joke ("Get it? Because he's a vampire!")
- Being too polite or reasonable in chaos
- Therapy-speak or emotional growth arcs
- Anyone learning a lesson
` : `
═══════════════════════════════════════════════════════
FAMILY FRIENDLY: WRITE LIKE PEAK NICKELODEON
═══════════════════════════════════════════════════════

THE GAME OF THE SCENE:
Find the absurd premise and COMMIT. Examples:
- "A pirate is terrified of water but won't admit it"
- "A ghost is trying to haunt a house that's already condemned"
- "SpongeBob logic: The worse things get, the more cheerful they are"
Find the game in lines 1-3. Never let go.

ABSURDISM IS YOUR WEAPON:
Kids' comedy isn't dumb - it's WEIRD. Embrace:
- Nonsense that feels somehow logical ("I can't come to work, my goldfish has jury duty")
- Characters being confidently incorrect ("The moon is obviously made of government lies")
- Overreacting to tiny things / underreacting to chaos
- Items/locations doing impossible things described casually
- Non-sequiturs that land because of COMMITMENT

ENERGY & MOMENTUM:
Fast pace. No dead air. If a line isn't moving the scene forward, cut it.
Think: rapid-fire Looney Tunes energy, not slow explanatory dialogue.
SHORT LINES for maximum impact:
- "Why?"
- "Because."
- "But—"
- "BECAUSE."

WORDPLAY & LINGUISTIC CHAOS:
Puns that make you groan. Malapropisms. Misheard phrases. Weird idioms.
- "It's not rocket surgery!"
- "Does a bear shop in the woods?"
- Character names that are puns (Dr. Payne the dentist)

PHYSICAL COMEDY IN DIALOGUE:
You can't write stage directions, so DESCRIBE physical comedy in what characters say:
- "Why are you hopping on one foot?"
- "Are you... are you juggling eggs right now?"
- "Did you just backflip over a couch for no reason?"

ESCALATION TO ABSURDITY:
Start weird. Get WEIRDER. Peak Nickelodeon shows never pumped the brakes:
- Line 5: "There's a penguin in the kitchen"
- Line 15: "There are seventeen penguins and they've formed a union"
- Line 30: "The penguin union has elected a pope"

RUNNING GAGS WITHIN THE SCENE:
Establish a pattern, repeat with variation:
- Every time Character A mentions tacos, something explodes
- Character B keeps trying to interject but gets interrupted
- Character C ends every sentence with "probably" even when it makes no sense

AVOID LIKE POISON:
- Jokes that require cultural knowledge kids don't have
- Sarcasm without a clear "tell" (kids miss subtle sarcasm)
- Emotional sincerity or "the moral of the story"
- Adults explaining things condescendingly
- Trying to sneak in educational content (this is COMEDY, not edutainment)
`

  const systemPrompt = `You are a professional comedy writer. Not someone who TRIES to be funny - someone who IS funny.

These scripts will be performed OUT LOUD by amateur players. That means:
- Every line must sound NATURAL when spoken
- Comedy must land even with mediocre delivery
- The words themselves must be funny, not just the performance
- Avoid jokes that need perfect timing - focus on jokes that need perfect WORDS

${comedyGuidelines}

═══════════════════════════════════════════════════════
THE IMPROV PRINCIPLE: YES-AND
═══════════════════════════════════════════════════════
Each character should BUILD on what came before, not deny it:
- BAD: "No, I'm not a vampire." "Yes you are." "No I'm not."
- GOOD: "I'm not a vampire." "Then explain the coffin." "It's for naps!"

Never have characters say "That doesn't make sense" - EVERYTHING makes sense in its own weird logic.

═══════════════════════════════════════════════════════
CHARACTER VOICE IS NON-NEGOTIABLE
═══════════════════════════════════════════════════════
If Gordon Ramsay is in the scene, EVERY line should sound exactly like Gordon Ramsay.
If Shakespeare is there, he speaks in iambic pentameter with flowery language.
If Yoda is present, backwards his sentences must be.
If a pirate appears, "yarr" and nautical metaphors, matey.

Mixing a pirate and Shakespeare? The pirate doesn't suddenly talk like Shakespeare - the CONTRAST is the comedy.

═══════════════════════════════════════════════════════
SPECIFICITY BEATS GENERIC EVERY TIME
═══════════════════════════════════════════════════════
"I dropped something in the fryer" ← Boring
"I dropped my 1987 Casio calculator watch in the fryer and it's beeping the Jeopardy theme underwater" ← Funny

Specific details = real. Generic = forgettable.

═══════════════════════════════════════════════════════
THE RULE OF THREE
═══════════════════════════════════════════════════════
Pattern, pattern, BREAK:
- "I need a weapon, a shield, and a really good therapist."
- "We've tried negotiating, we've tried bribing, and we've tried a flash mob."

Establish rhythm, then violate it.

═══════════════════════════════════════════════════════
EMOTIONAL STAKES IN ABSURDITY
═══════════════════════════════════════════════════════
Even in the most ridiculous scenarios, characters must CARE about something:
- A vampire at a beach might desperately want to fit in with surfers
- Gordon Ramsay at a funeral might be personally offended by bad catering
- Shakespeare in space might be homesick for Earth

If nobody wants anything, there's no scene. Stakes = investment = comedy.

═══════════════════════════════════════════════════════
PACING & STRUCTURE
═══════════════════════════════════════════════════════
Lines 1-5: HOOK (establish the game instantly)
Lines 6-15: EXPLORE (play with the premise, build patterns)
Lines 16-25: ESCALATE (things get worse/weirder/more)
Lines 26-35: PEAK CHAOS (the scene reaches maximum absurdity)
Lines 36-40: BUTTON (callback, twist, or perfect punchline to end on)

Every scene needs a BEGINNING (what's the situation?), MIDDLE (how does it escalate?), and END (what's the button?).

═══════════════════════════════════════════════════════
WHAT KILLS COMEDY (NEVER DO THESE)
═══════════════════════════════════════════════════════
❌ Characters being aware they're in a comedy ("This is like a sitcom!")
❌ Explaining the joke ("Because he's a doctor, get it?")
❌ Generic shock reactions ("Oh my god!" "What?!" "This is crazy!")
❌ Everyone agreeing with each other
❌ Characters being boringly competent
❌ Filler dialogue that doesn't advance anything
❌ Referencing memes or internet culture (dates instantly)

═══════════════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════════════
Return ONLY valid JSON. No markdown. No commentary. Just:

{
  "title": "A punny/clever title that hints at the premise",
  "synopsis": "One tight sentence: [CHARACTER] must [DO THING] while [OBSTACLE/CIRCUMSTANCE]",
  "lines": [
    {
      "speaker": "Character Name",
      "text": "Funny dialogue here",
      "mood": "angry | happy | confused | whispering | neutral"
    }
  ]
}

Title examples:
- GOOD: "The Codfather" (mafia don at aquarium)
- GOOD: "Fangs for the Memories" (vampire at reunion)
- BAD: "A Funny Scene" (lazy)

Synopsis examples:
- GOOD: "A pirate captain must navigate IKEA while his crew mutinies over the meatballs"
- GOOD: "Gordon Ramsay reviews a funeral he's catering and offends the widow"
- BAD: "Some characters are in a place and things happen"

Now write comedy that makes people ACTUALLY LAUGH.${previousScript ? `

═══════════════════════════════════════════════════════
🎬 SEQUEL MODE ACTIVATED
═══════════════════════════════════════════════════════
This is a DIRECT SEQUEL to a previous scene. Here's what happened in Episode 1:

PREVIOUS TITLE: "${previousScript.title}"
PREVIOUS SYNOPSIS: ${previousScript.synopsis}

PREVIOUS SCRIPT:
${previousScript.lines.map((line: ScriptLine, i: number) => `${i + 1}. ${line.speaker}: "${line.text}"`).join('\n')}

YOUR SEQUEL MISSION:
1. The characters are THE SAME
2. The setting is THE SAME
3. The situation must ESCALATE from where Episode 1 ended
4. CALL BACK to specific jokes, phrases, or moments from the previous script
5. Reference what "just happened" - treat this as Episode 2, not a reboot
6. The conflict should be a natural consequence of how Episode 1 ended
7. Make this feel like a continuation that rewards the audience for watching Episode 1

SEQUEL WRITING RULES:
- If a character had a catchphrase or running gag, BRING IT BACK
- If something absurd happened in Episode 1, the consequences should appear here
- Reference specific dialogue from Episode 1 ("Remember when you said..." or callbacks)
- Escalate the stakes: if they argued before, they should argue HARDER now
- Episode 2 should feel like "oh no, things got WORSE" or "wait, it's happening AGAIN?"

Think: If Episode 1 was "The Empire Strikes Back," this is "Return of the Jedi."
If Episode 1 was chaos, Episode 2 is controlled chaos with callbacks.
Make the audience laugh because they remember what happened in Episode 1.` : ''}`

  // Mode-specific scene dynamics
  const modeInstructions = gameMode === 'HEAD_TO_HEAD' ? `
═══════════════════════════════════════
SCENE DYNAMICS (HEAD-TO-HEAD MODE)
═══════════════════════════════════════
This is a COMPETITIVE scene. The two characters must have OPPOSING GOALS.

STRUCTURE:
- Character A (${characters[0]}) wants to achieve the Circumstance
- Character B (${characters[1]}) wants to STOP them or do it their own way
- Every line should escalate the conflict

WRITING STYLE:
- Rapid-fire banter with high energy
- Characters should interrupt each other
- Use short, punchy exchanges (think tennis rally)
- Each character believes they're 100% right
- The disagreement should feel personal and specific

PACING:
- Lines should alternate frequently (don't let one character monologue)
- Build to a comedic climax where both characters are at maximum frustration
- End with an unexpected twist or compromise (but make it funny)

AVOID:
- Friendly cooperation or easy agreement
- Long speeches (keep it snappy)
- Characters being reasonable or backing down early
`
  : gameMode === 'ENSEMBLE' ? `
═══════════════════════════════════════
SCENE DYNAMICS (ENSEMBLE MODE)
═══════════════════════════════════════
This is a CHAOTIC GROUP scene. Structure it like "The Office" or "Community."

ROLE ASSIGNMENTS:
- ${characters[0]} is the STRAIGHT MAN (the reasonable one trying to manage the situation)
- ${characters.slice(1).join(', ')} are AGENTS OF CHAOS (derailing the plan with their antics)

CRITICAL: You have ${characters.length} characters. You MUST give every single one of them dialogue and a personality. Do not leave anyone out.

STRUCTURE:
- Straight Man tries to execute the Circumstance logically
- Each Chaos Agent has their own agenda/misunderstanding that conflicts with the plan
- The scene spirals as multiple characters talk over each other

SPOTLIGHT MOMENTS:
Each character MUST get at least one memorable moment to shine:
- A ridiculous suggestion that somehow makes sense
- A running gag or catchphrase
- A reveal that changes the dynamic
- A physical comedy beat (described through dialogue)

PACING:
- Start with Straight Man outlining the plan
- Chaos Agents derail it one by one
- Escalate to maximum chaos where everyone is talking at once
- End with either spectacular failure or accidental success

AVOID:
- Everyone agreeing too quickly
- Characters standing around watching others perform
- Letting any character disappear for too long (max 5-6 lines without speaking)
`
  : `
═══════════════════════════════════════
SCENE DYNAMICS (SOLO MODE - SETTING-BASED ENSEMBLE)
═══════════════════════════════════════
This is a SOLO performance. The human player will perform as ${characters[0]}.

YOUR MISSION: ${characters[0]} has wandered into the world of "${setting}".
You must populate the scene with 2-3 characters who NATIVELY BELONG to that setting.

STEP 1: IDENTIFY THE SETTING'S UNIVERSE
Look at "${setting}" and determine:
- What fictional universe, show, location, or world does this represent?
- Who are the iconic/recognizable characters from that universe?
- What's the "local culture" or vibe of this place?

Examples:
- "The Simpsons Living Room" → This is Springfield. Natives: Homer Simpson, Marge Simpson, Bart Simpson
- "Central Perk (Friends)" → This is the Friends universe. Natives: Ross, Rachel, Chandler, Monica, Joey, Phoebe
- "The Office Conference Room" → This is Dunder Mifflin. Natives: Michael Scott, Dwight Schrute, Jim Halpert, Pam Beesly
- "The Death Star" → This is Star Wars. Natives: Darth Vader, Stormtroopers, Imperial Officers
- "A Haunted House" → Generic spooky setting. Natives: A Creepy Ghost, A Skeptical Homeowner, A Paranormal Investigator
- "A Pirate Ship" → Generic pirate setting. Natives: The Ship's Captain, A Drunken First Mate, A Parrot (who talks)

STEP 2: GENERATE 2-3 SETTING-NATIVE CHARACTERS
Create an AI ensemble cast that fits the setting:
- Use RECOGNIZABLE characters if the setting is from a known show/universe
- Create ARCHETYPAL characters if the setting is generic (e.g., "A Hospital" → Dr. House-type, Nervous Nurse, Grumpy Receptionist)
- Give each AI character a distinct personality, voice, and comedic function
- These characters should feel like they "own" the space - ${characters[0]} is the OUTSIDER

STEP 3: THE COMEDY CONTRAST
The humor comes from the FISH-OUT-OF-WATER dynamic:
- ${characters[0]} doesn't belong here and the locals KNOW IT
- The setting-native characters react to this interloper with confusion, suspicion, or annoyance
- ${characters[0]} must navigate the social rules and quirks of this unfamiliar world
- The Circumstance ("${circumstance}") becomes harder because ${characters[0]} doesn't understand how things work here

CHARACTER DYNAMICS:
- ${characters[0]} is trying to accomplish the Circumstance
- The 2-3 AI characters represent the "local establishment" reacting to this outsider
- Create conflict through misunderstanding, cultural clash, or the locals being unhelpful
- Each AI character should have their own agenda or quirk that complicates things

LINE DISTRIBUTION:
- Human player (${characters[0]}): 40-50% of lines
- AI Ensemble (2-3 characters): 50-60% of lines TOTAL (split among them)
- Mix rapid-fire exchanges with moments where multiple AI characters pile on

CRITICAL REQUIREMENTS:
- You MUST generate 2-3 AI characters (not 1, not 4+)
- The AI characters MUST fit the setting logically (don't put Batman in "The Simpsons Living Room")
- If the setting is from a known show/universe, USE THOSE CHARACTERS
- If the setting is generic, CREATE archetypal characters that fit the vibe
- ${characters[0]} should feel like an outsider trying to navigate this strange world
- Build to a comedic climax where the culture clash reaches peak absurdity

EXAMPLES OF GOOD CASTING:
✅ Setting: "The Simpsons Living Room" → AI Cast: Homer Simpson, Marge Simpson, Bart Simpson
✅ Setting: "A Therapist's Office" → AI Cast: Dr. Melfi (therapist), An Overly Honest Patient
✅ Setting: "A Medieval Tavern" → AI Cast: A Gruff Bartender, A Mysterious Hooded Stranger, A Singing Bard
✅ Setting: "Hogwarts Classroom" → AI Cast: Professor Snape, Hermione Granger, A Nervous First-Year

EXAMPLES OF BAD CASTING:
❌ Setting: "The Simpsons Living Room" → AI Cast: Darth Vader (doesn't fit)
❌ Setting: "A Hospital" → AI Cast: Just one doctor (need 2-3 characters)
❌ Setting: "The Death Star" → AI Cast: SpongeBob, Batman, Yoda (random characters, not Death Star natives)

Write the scene where ${characters[0]} has stumbled into "${setting}" and must deal with the locals while trying to "${circumstance}".
Make the culture clash HILARIOUS.
`

  const userMessage = `Write a scene using these ingredients:

═══════════════════════════════════════
THE SETUP
═══════════════════════════════════════
CHARACTERS: ${characterList}
SETTING: ${setting}
CIRCUMSTANCE: ${circumstance}
RATING: ${isMature ? '18+ (Adult comedy - profanity allowed, taboo topics fair game, SNL-level sharp writing)' : 'Family Friendly (Smart absurdist comedy for all ages - think peak Nickelodeon)'}

${modeInstructions}

═══════════════════════════════════════
SCRIPT REQUIREMENTS
═══════════════════════════════════════
SCRIPT LENGTH: ${lineRange.min}-${lineRange.max} lines
PERFORMERS: ${numPlayers} player${numPlayers > 1 ? 's' : ''}
${customizationPrompt}

═══════════════════════════════════════
YOUR MISSION
═══════════════════════════════════════
1. Find the GAME of this scene immediately (what's the core comic premise?)
2. Write in the distinct voice of each character (Yoda talks like Yoda, pirates talk like pirates)
3. Escalate from funny to FUNNIER to absolutely ridiculous
4. Use specific details, not generic reactions
5. Build patterns and break them (rule of three)
6. Include callbacks to jokes from earlier in the scene
7. Give every character emotional stakes (even if absurd)
8. End with a strong button - callback, twist, or perfect punchline

The premise is already absurd. Your job is to EXPLOIT that absurdity through sharp dialogue.

Write the scene now. Make it genuinely funny - the kind of funny where people will want to perform it again.`

  try {
    console.log(`\n🎬 AI SCRIPT GENERATION ${previousScript ? '(SEQUEL MODE)' : ''}`)
    console.log(`════════════════════════════════════════`)
    console.log(`Mode: ${gameMode}`)
    console.log(`Rating: ${isMature ? '18+ (Adult Comedy)' : 'Family Friendly'}`)
    console.log(`Characters: ${characterList}`)
    console.log(`Setting: ${setting}`)
    console.log(`Circumstance: ${circumstance}`)
    if (customization) {
      console.log(`Style: ${customization.comedyStyle}, Length: ${customization.scriptLength}, Difficulty: ${customization.difficulty}`)
    }
    if (previousScript) {
      console.log(`Sequel to: "${previousScript.title}"`)
    }
    if (isSoloMode) {
      console.log(`Note: AI will invent a hilarious Co-Star character to play opposite the human player`)
    }
    console.log(`════════════════════════════════════════\n`)

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: maxTokens,
      temperature: 1, // Max creativity for comedy writing
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage
        }
      ]
    })

    console.log(`✅ Script generated successfully!\n`)

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Strip markdown code blocks if present
    let jsonText = content.text.trim()
    if (jsonText.startsWith('```')) {
      // Remove opening ```json or ```
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '')
      // Remove closing ```
      jsonText = jsonText.replace(/\n?```$/, '')
    }

    // Parse and validate with Zod
    const rawScript = JSON.parse(jsonText.trim())
    const validationResult = ScriptSchema.safeParse(rawScript)

    if (!validationResult.success) {
      console.error('❌ Script validation failed:', validationResult.error.format())
      throw new Error(`Invalid script format: ${validationResult.error.message}`)
    }

    const script = validationResult.data
    return script
  } catch (error) {
    console.error('Error generating script:', error)
    throw error
  }
}

// Get trivia question based on setting (uses content.ts GREEN_ROOM_QUESTIONS)
function getGreenRoomTrivia(setting: string): string {
  return getGreenRoomQuestion(setting)
}

app.prepare().then(() => {
  const expressApp = express()

  // Configure security middleware
  configureSecurityMiddleware(expressApp)

  const server = createServer(expressApp)

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true)

        const allowedOrigins = dev ? [
          'http://localhost:3000',
          'http://localhost:3001'
        ] : [
          'https://plot-twists.com',
          'https://www.plot-twists.com',
          'https://plot-twists-dvkmt8tyq-jackson-sangers-projects.vercel.app',
          'https://web-production-c7981.up.railway.app'
        ]

        // Check exact matches
        if (allowedOrigins.includes(origin)) {
          return callback(null, true)
        }

        // In production, allow all Vercel preview deployments
        if (!dev && origin.endsWith('.vercel.app')) {
          return callback(null, true)
        }

        // Reject all other origins
        console.log(`CORS blocked origin: ${origin}`)
        callback(new Error('Not allowed by CORS'))
      },
      methods: ['GET', 'POST', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    // Force polling in production (Railway has WebSocket upgrade issues)
    transports: dev ? ['polling', 'websocket'] : ['polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    maxHttpBufferSize: 1e6,
    allowUpgrades: dev // Only allow upgrades in development
  })

  console.log(`Socket.IO configured for ${dev ? 'development' : 'production'} mode`)
  console.log(`Transports: ${dev ? 'polling + websocket' : 'polling-only'}`)

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    // Create room
    socket.on('create_room', (settings, callback) => {
      // Rate limiting
      if (!roomCreationLimiter.check(socket.id)) {
        console.warn(`Rate limit exceeded for room creation: ${socket.id}`)
        callback({ success: false, error: 'Too many room creation attempts. Please try again later.' })
        return
      }

      try {
        const code = generateRoomCode()
        const hostPlayer: Player = {
          id: uuidv4(),
          nickname: 'Host',
          role: 'HOST',
          isHost: true,
          socketId: socket.id
        }

        const room: Room = {
          code,
          host: hostPlayer,
          players: new Map([[hostPlayer.id, hostPlayer]]),
          gameState: 'LOBBY',
          gameMode: settings.gameMode || 'ENSEMBLE',
          isMature: settings.isMature || false,
          selections: new Map(),
          currentLineIndex: 0,
          isPaused: false,
          votes: new Map(),
          createdAt: Date.now(),
          lastActivity: Date.now(),
          // Feature 1: Audience Interaction
          audienceInteraction: settings.audienceInteractionEnabled ? initializeAudienceState() : undefined,
          // Feature 2: Script Customization
          scriptCustomization: settings.scriptCustomization || undefined,
          // Feature 3: Card Pack
          cardPackId: settings.cardPackId || STANDARD_PACK_ID,
          // Feature 4: Audio Settings
          audioSettings: settings.audioSettings || createDefaultAudioSettings()
        }

        rooms.set(code, room)
        socket.join(code)

        console.log(`Room created: ${code}`)
        callback({ success: true, code })
        socket.emit('room_created', code)
      } catch (error) {
        console.error('Error creating room:', error)
        callback({ success: false, error: 'Failed to create room' })
      }
    })

    // Join room
    socket.on('join_room', (roomCode, nickname, callback) => {
      // Rate limiting
      if (!joinRoomLimiter.check(socket.id)) {
        console.warn(`Rate limit exceeded for join room: ${socket.id}`)
        callback({ success: false, error: 'Too many join attempts. Please slow down.' })
        return
      }

      try {
        // Validate room code format
        if (!isValidRoomCode(roomCode)) {
          console.log(`Invalid room code format: ${roomCode}`)
          callback({ success: false, error: 'Invalid room code format' })
          return
        }

        // Validate nickname
        if (!isValidNickname(nickname)) {
          console.log(`Invalid nickname: ${nickname}`)
          callback({ success: false, error: 'Invalid nickname. Please use 1-50 characters.' })
          return
        }

        const upperRoomCode = roomCode.toUpperCase()
        console.log(`Join attempt - Room: ${upperRoomCode}, Nickname: ${nickname}`)
        console.log(`Available rooms:`, Array.from(rooms.keys()))

        const room = rooms.get(upperRoomCode)
        if (!room) {
          console.log(`Room ${upperRoomCode} not found!`)
          callback({ success: false, error: 'Room not found' })
          return
        }

        // Check if game already started
        if (room.gameState !== 'LOBBY') {
          callback({ success: false, error: 'Game already in progress' })
          return
        }

        const sanitizedNickname = sanitizeInput(nickname)
        if (!sanitizedNickname) {
          console.log(`Invalid nickname: ${nickname}`)
          callback({ success: false, error: 'Invalid nickname' })
          return
        }

        // Check player limits based on game mode
        const currentPlayerCount = Array.from(room.players.values()).filter(p => p.role === 'PLAYER').length
        const maxPlayers = room.gameMode === 'SOLO' ? 1 : room.gameMode === 'HEAD_TO_HEAD' ? 2 : 6
        const isRoomFull = currentPlayerCount >= maxPlayers

        // Check for duplicate nicknames
        const nicknameExists = Array.from(room.players.values()).some(p =>
          p.nickname.toLowerCase() === sanitizedNickname.toLowerCase()
        )
        if (nicknameExists) {
          callback({ success: false, error: 'Nickname already taken in this room' })
          return
        }

        // Join as SPECTATOR if room is full, otherwise as PLAYER
        const player: Player = {
          id: uuidv4(),
          nickname: sanitizedNickname,
          role: isRoomFull ? 'SPECTATOR' : 'PLAYER',
          isHost: false,
          socketId: socket.id,
          score: 0
        }

        room.players.set(player.id, player)
        room.lastActivity = Date.now()
        socket.join(upperRoomCode)

        const playersList = Array.from(room.players.values())
        io.to(upperRoomCode).emit('player_joined', player)
        io.to(upperRoomCode).emit('players_update', playersList)

        const roomSettings: RoomSettings = {
          isMature: room.isMature,
          gameMode: room.gameMode
        }

        console.log(`✓ ${player.role === 'SPECTATOR' ? 'Spectator' : 'Player'} "${sanitizedNickname}" (ID: ${player.id}) successfully joined room ${upperRoomCode}`)
        console.log(`Total players in room: ${playersList.length}`, playersList.map(p => p.nickname))

        callback({
          success: true,
          players: playersList,
          settings: roomSettings,
          role: player.role
        })
      } catch (error) {
        console.error('Error joining room:', error)
        callback({ success: false, error: 'Failed to join room' })
      }
    })

    // Submit card selections
    socket.on('submit_cards', (roomCode, selections, callback) => {
      try {
        const room = rooms.get(roomCode)
        if (!room) {
          callback({ success: false, error: 'Room not found' })
          return
        }

        // Find player by socket ID
        let playerId: string | undefined
        for (const [id, player] of room.players.entries()) {
          if (player.socketId === socket.id) {
            playerId = id
            break
          }
        }

        if (!playerId) {
          callback({ success: false, error: 'Player not found' })
          return
        }

        room.selections.set(playerId, selections)
        const player = room.players.get(playerId)
        if (player) {
          player.hasSubmittedSelection = true
        }
        room.lastActivity = Date.now()

        io.to(roomCode).emit('players_update', Array.from(room.players.values()))

        console.log(`Player ${playerId} submitted selections for room ${roomCode}`)
        callback({ success: true })

        // Solo mode: Start immediately when single player submits
        if (room.gameMode === 'SOLO') {
          const activePlayers = Array.from(room.players.values()).filter(p => p.role === 'PLAYER')
          if (activePlayers.length === 1 && activePlayers[0].hasSubmittedSelection) {
            startScriptGeneration(room, io)
          }
          return
        }

        // Ensemble/Head-to-Head: Check if all players have submitted (exclude spectators)
        const allSubmitted = Array.from(room.players.values())
          .filter(p => p.role === 'PLAYER')
          .every(p => p.hasSubmittedSelection)

        if (allSubmitted && room.players.size > 1) {
          // Start script generation
          startScriptGeneration(room, io)
        }
      } catch (error) {
        console.error('Error submitting cards:', error)
        callback({ success: false, error: 'Failed to submit selections' })
      }
    })

    // Start game
    socket.on('start_game', (roomCode) => {
      const room = rooms.get(roomCode)
      if (!room) return

      room.gameState = 'SELECTION'
      room.lastActivity = Date.now()
      io.to(roomCode).emit('game_state_change', 'SELECTION')

      // Send available cards to all players
      const content = getFilteredContent(room.isMature)
      io.to(roomCode).emit('available_cards', content)
    })

    // Submit vote
    socket.on('submit_vote', (roomCode, targetPlayerId) => {
      const room = rooms.get(roomCode)
      if (!room) return

      // Find voter by socket ID
      let voterId: string | undefined
      for (const [id, player] of room.players.entries()) {
        if (player.socketId === socket.id) {
          voterId = id
          break
        }
      }

      if (!voterId) return

      room.votes.set(voterId, targetPlayerId)
      const voter = room.players.get(voterId)
      if (voter) {
        voter.hasSubmittedVote = true
      }
      room.lastActivity = Date.now()

      io.to(roomCode).emit('players_update', Array.from(room.players.values()))

      // Check if all players have voted
      const allVoted = Array.from(room.players.values())
        .filter(p => p.role === 'SPECTATOR' || p.role === 'PLAYER')
        .every(p => p.hasSubmittedVote)

      if (allVoted) {
        calculateResults(room, io)
      }
    })

    // Advance script line
    socket.on('advance_script_line', (roomCode) => {
      const room = rooms.get(roomCode)
      if (!room || !room.script) return

      room.currentLineIndex++
      room.lastActivity = Date.now()
      io.to(roomCode).emit('sync_teleprompter', room.currentLineIndex)
    })

    // Pause script
    socket.on('pause_script', (roomCode) => {
      const room = rooms.get(roomCode)
      if (!room || !room.script) return

      room.isPaused = true
      room.lastActivity = Date.now()

      // Clear the current timeout
      const timeout = roomTimeouts.get(roomCode)
      if (timeout) {
        clearTimeout(timeout)
        roomTimeouts.delete(roomCode)
      }

      console.log(`Script paused for room ${roomCode}`)
    })

    // Resume script
    socket.on('resume_script', (roomCode) => {
      const room = rooms.get(roomCode)
      if (!room || !room.script) return

      room.isPaused = false
      room.lastActivity = Date.now()

      console.log(`Script resumed for room ${roomCode}`)

      // Restart teleprompter from current line
      const WPM = 120
      const advanceLine = (lineIndex: number) => {
        if (room.isPaused) return

        if (!room.script || lineIndex >= room.script.lines.length - 1) {
          roomTimeouts.delete(room.code)
          if (room.gameMode === 'HEAD_TO_HEAD' || room.gameMode === 'ENSEMBLE') {
            room.gameState = 'VOTING'
            io.to(room.code).emit('game_state_change', 'VOTING')
          } else {
            room.gameState = 'RESULTS'
            io.to(room.code).emit('game_state_change', 'RESULTS')
          }
          return
        }

        const currentLine = room.script.lines[lineIndex]
        const wordCount = currentLine.text.split(' ').length
        const readingTimeMs = (wordCount / WPM) * 60 * 1000

        const timeout = setTimeout(() => {
          if (!room.script) return
          room.currentLineIndex++
          io.to(room.code).emit('sync_teleprompter', room.currentLineIndex)
          advanceLine(room.currentLineIndex)
        }, readingTimeMs)

        roomTimeouts.set(room.code, timeout)
      }

      advanceLine(room.currentLineIndex)
    })

    // Jump to specific line
    socket.on('jump_to_line', (roomCode, lineIndex) => {
      const room = rooms.get(roomCode)
      if (!room || !room.script) return

      // Clear existing timeout
      const timeout = roomTimeouts.get(roomCode)
      if (timeout) {
        clearTimeout(timeout)
        roomTimeouts.delete(roomCode)
      }

      // Update line index
      room.currentLineIndex = lineIndex
      room.lastActivity = Date.now()

      // Broadcast new line to all clients
      io.to(roomCode).emit('sync_teleprompter', room.currentLineIndex)

      console.log(`Jumped to line ${lineIndex} in room ${roomCode}`)

      // If not paused, restart timer for new line
      if (!room.isPaused) {
        const WPM = 120
        const advanceLine = (currentLineIndex: number) => {
          if (room.isPaused) return

          if (!room.script || currentLineIndex >= room.script.lines.length - 1) {
            roomTimeouts.delete(room.code)
            if (room.gameMode === 'HEAD_TO_HEAD' || room.gameMode === 'ENSEMBLE') {
              room.gameState = 'VOTING'
              io.to(room.code).emit('game_state_change', 'VOTING')
            } else {
              room.gameState = 'RESULTS'
              io.to(room.code).emit('game_state_change', 'RESULTS')
            }
            return
          }

          const currentLine = room.script.lines[currentLineIndex]
          const wordCount = currentLine.text.split(' ').length
          const readingTimeMs = (wordCount / WPM) * 60 * 1000

          const newTimeout = setTimeout(() => {
            if (!room.script) return
            room.currentLineIndex++
            io.to(room.code).emit('sync_teleprompter', room.currentLineIndex)
            advanceLine(room.currentLineIndex)
          }, readingTimeMs)

          roomTimeouts.set(room.code, newTimeout)
        }

        advanceLine(lineIndex)
      }
    })

    // Request sequel
    socket.on('request_sequel', async (roomCode) => {
      const room = rooms.get(roomCode)
      if (!room || !room.script) {
        console.log(`Cannot generate sequel: room or script not found for ${roomCode}`)
        return
      }

      console.log(`🎬 Sequel requested for room ${roomCode}`)

      // Save the current script as previous
      const previousScript = room.script

      // Set loading state
      room.gameState = 'LOADING'
      room.lastActivity = Date.now()
      io.to(roomCode).emit('game_state_change', 'LOADING')

      try {
        // Get player characters from selections
        const playerIds = Array.from(room.players.values())
          .filter(p => p.role === 'PLAYER')
          .map(p => p.id)

        const allSelections = Array.from(room.selections.values())
        const playerSelections = allSelections.filter((_, index) => {
          const playerId = Array.from(room.selections.keys())[index]
          return playerIds.includes(playerId)
        })

        const characters = playerSelections.map(s => s.character)

        // Use the same setting and circumstance from the previous script
        // Extract from selections (they're still in the room)
        const chosenSetting = playerSelections[0]?.setting || 'Unknown Setting'
        const chosenCircumstance = playerSelections[0]?.circumstance || 'Unknown Circumstance'

        console.log(`Generating sequel with ${characters.length} character(s)`)

        // Generate sequel script with customization
        const sequelScript = await generateScript(
          characters,
          chosenSetting,
          chosenCircumstance,
          room.isMature,
          room.gameMode,
          previousScript as Script, // Pass the previous script
          room.scriptCustomization
        )

        // Enhance with audio metadata if audio is enabled
        const finalScript = room.audioSettings
          ? enhanceScriptWithAudio(sequelScript, room.audioSettings, chosenSetting)
          : sequelScript

        // Update room with new script
        room.script = finalScript
        room.gameState = 'PERFORMING'
        room.currentLineIndex = 0
        room.isPaused = false

        // Reset audience interaction for new performance
        if (room.audienceInteraction) {
          resetReactionCounts(room.audienceInteraction)
        }

        // Broadcast new script to all clients
        io.to(roomCode).emit('script_ready', finalScript)
        io.to(roomCode).emit('game_state_change', 'PERFORMING')

        // Start ambience if enabled
        if (room.audioSettings?.ambienceEnabled) {
          const ambienceTrack = getAmbienceTrack(chosenSetting)
          io.to(roomCode).emit('ambience_start', ambienceTrack)
        }

        console.log(`✅ Sequel generated: "${finalScript.title}"`)

        // Start teleprompter sync
        startTeleprompterSync(room, io)
      } catch (error) {
        console.error('Sequel generation failed:', error)
        io.to(roomCode).emit('error', 'Failed to generate sequel. Please try again.')

        // Reset to results state
        room.gameState = 'RESULTS'
        io.to(roomCode).emit('game_state_change', 'RESULTS')
      }
    })

    // Update room settings
    socket.on('update_room_settings', (roomCode, settings) => {
      const room = rooms.get(roomCode)
      if (!room) return

      if (settings.isMature !== undefined) {
        room.isMature = settings.isMature
      }
      if (settings.gameMode !== undefined) {
        room.gameMode = settings.gameMode
      }
      // Feature 2: Script Customization
      if (settings.scriptCustomization !== undefined) {
        room.scriptCustomization = validateCustomization(settings.scriptCustomization)
      }
      // Feature 3: Card Pack
      if (settings.cardPackId !== undefined) {
        room.cardPackId = settings.cardPackId
      }
      // Feature 4: Audio Settings
      if (settings.audioSettings !== undefined) {
        room.audioSettings = validateAudioSettings(settings.audioSettings)
      }
      // Feature 1: Audience Interaction
      if (settings.audienceInteractionEnabled !== undefined) {
        if (settings.audienceInteractionEnabled && !room.audienceInteraction) {
          room.audienceInteraction = initializeAudienceState()
        } else if (!settings.audienceInteractionEnabled) {
          room.audienceInteraction = undefined
        }
      }
      room.lastActivity = Date.now()

      const roomSettings: RoomSettings = {
        isMature: room.isMature,
        gameMode: room.gameMode,
        scriptCustomization: room.scriptCustomization,
        cardPackId: room.cardPackId,
        audioSettings: room.audioSettings,
        audienceInteractionEnabled: !!room.audienceInteraction
      }
      io.to(roomCode).emit('room_settings_update', roomSettings)
    })

    // ============================================================
    // FEATURE 1: Audience Interaction Events
    // ============================================================

    // Send audience reaction
    socket.on('send_audience_reaction', (roomCode, reactionType) => {
      // Rate limiting
      if (!reactionLimiter.check(socket.id)) {
        return
      }

      const room = rooms.get(roomCode)
      if (!room || !room.audienceInteraction) return

      // Find sender
      let sender: Player | undefined
      for (const player of room.players.values()) {
        if (player.socketId === socket.id) {
          sender = player
          break
        }
      }
      if (!sender) return

      // Check cooldown and record reaction
      if (!canSendReaction(sender.id)) return

      const reaction = recordReaction(
        room.audienceInteraction,
        reactionType,
        sender.id,
        sender.nickname
      )

      if (reaction) {
        room.lastActivity = Date.now()
        // Broadcast to all clients
        io.to(roomCode).emit('audience_reaction_received', reaction)
        io.to(roomCode).emit('audience_reaction_counts', room.audienceInteraction.reactionCounts)
      }
    })

    // Start a plot twist vote
    socket.on('start_plot_twist', (roomCode) => {
      const room = rooms.get(roomCode)
      if (!room || !room.audienceInteraction) return
      if (room.gameState !== 'PERFORMING') return

      // Only host can start plot twists
      if (room.host.socketId !== socket.id) return

      // Check if there's already an active twist
      if (room.audienceInteraction.activePlotTwist?.isActive) return

      const twist = startPlotTwist(room.audienceInteraction, 15000) // 15 seconds to vote
      room.lastActivity = Date.now()

      io.to(roomCode).emit('plot_twist_started', twist)

      // Set timeout to finalize and inject
      const timeout = setTimeout(() => {
        if (!room.audienceInteraction) return

        const winningTwist = finalizePlotTwist(room.audienceInteraction)
        if (winningTwist) {
          io.to(roomCode).emit('plot_twist_result', winningTwist)

          // Generate and inject new lines
          const speakers = room.script?.lines.map(l => l.speaker).filter((v, i, a) => a.indexOf(v) === i) || []
          const injectedLines = generateTwistInjection(winningTwist, speakers)

          if (room.script && injectedLines.length > 0) {
            // Insert lines after current position
            const insertIndex = room.currentLineIndex + 1
            room.script.lines.splice(insertIndex, 0, ...injectedLines)
            io.to(roomCode).emit('plot_twist_injected', insertIndex, injectedLines)
          }
        }

        plotTwistTimeouts.delete(roomCode)
      }, 15000)

      plotTwistTimeouts.set(roomCode, timeout)
    })

    // Vote on a plot twist option
    socket.on('vote_plot_twist', (roomCode, optionId) => {
      const room = rooms.get(roomCode)
      if (!room || !room.audienceInteraction) return

      // Find voter
      let voterId: string | undefined
      for (const [id, player] of room.players.entries()) {
        if (player.socketId === socket.id) {
          voterId = id
          break
        }
      }
      if (!voterId) return

      const result = votePlotTwist(room.audienceInteraction, optionId, voterId)
      if (result.success && result.newCount !== undefined) {
        room.lastActivity = Date.now()
        io.to(roomCode).emit('plot_twist_vote_update', optionId, result.newCount)
      }
    })

    // ============================================================
    // FEATURE 3: Card Pack Events
    // ============================================================

    // List available card packs
    socket.on('list_card_packs', (callback) => {
      try {
        const packs = listCardPacks()
        callback({ success: true, packs })
      } catch (error) {
        console.error('Error listing card packs:', error)
        callback({ success: false, error: 'Failed to list card packs' })
      }
    })

    // Select a card pack for the room
    socket.on('select_card_pack', (roomCode, packId, callback) => {
      const room = rooms.get(roomCode)
      if (!room) {
        callback({ success: false, error: 'Room not found' })
        return
      }

      // Only host can select packs
      if (room.host.socketId !== socket.id) {
        callback({ success: false, error: 'Only the host can select card packs' })
        return
      }

      // Verify pack exists
      if (packId !== STANDARD_PACK_ID && !getCardPack(packId)) {
        callback({ success: false, error: 'Card pack not found' })
        return
      }

      room.cardPackId = packId
      room.lastActivity = Date.now()

      // Increment download count for custom packs
      if (packId !== STANDARD_PACK_ID) {
        incrementDownloads(packId)
      }

      io.to(roomCode).emit('card_pack_selected', packId)
      callback({ success: true })
    })

    // Create a new card pack
    socket.on('create_card_pack', (packData, callback) => {
      // Rate limiting
      if (!cardPackLimiter.check(socket.id)) {
        callback({ success: false, error: 'Too many requests. Please wait a moment.' })
        return
      }

      try {
        const result = createCardPack(packData)
        callback(result)
      } catch (error) {
        console.error('Error creating card pack:', error)
        callback({ success: false, error: 'Failed to create card pack' })
      }
    })

    // Rate a card pack
    socket.on('rate_card_pack', (packId, rating, callback) => {
      // Rate limiting
      if (!cardPackLimiter.check(socket.id)) {
        callback({ success: false, error: 'Too many requests. Please wait a moment.' })
        return
      }

      try {
        const result = rateCardPack(packId, rating)
        callback(result)
      } catch (error) {
        console.error('Error rating card pack:', error)
        callback({ success: false, error: 'Failed to rate card pack' })
      }
    })

    // ============================================================
    // FEATURE 4: Audio Events
    // ============================================================

    // Update audio settings
    socket.on('update_audio_settings', (roomCode, settings) => {
      const room = rooms.get(roomCode)
      if (!room) return

      // Only host can change audio settings
      if (room.host.socketId !== socket.id) return

      room.audioSettings = validateAudioSettings({
        ...room.audioSettings,
        ...settings
      })
      room.lastActivity = Date.now()

      io.to(roomCode).emit('audio_settings_update', room.audioSettings)
    })

    // Trigger sound effect (host only)
    socket.on('trigger_sound_effect', (roomCode, effect) => {
      const room = rooms.get(roomCode)
      if (!room) return

      // Only host can trigger sound effects
      if (room.host.socketId !== socket.id) return

      if (!room.audioSettings?.soundEffectsEnabled) return

      room.lastActivity = Date.now()
      io.to(roomCode).emit('play_sound_effect', effect)
    })

    // Request line audio (for TTS)
    socket.on('request_line_audio', (roomCode, lineIndex, callback) => {
      const room = rooms.get(roomCode)
      if (!room || !room.script) {
        callback({ success: false, error: 'Room or script not found' })
        return
      }

      if (!room.audioSettings?.voiceEnabled) {
        callback({ success: false, error: 'Voice is not enabled' })
        return
      }

      // For now, return a placeholder - actual TTS would require external API
      // Browser TTS will be handled client-side
      const line = room.script.lines[lineIndex]
      if (!line) {
        callback({ success: false, error: 'Line not found' })
        return
      }

      // Return success - client will use browser TTS
      callback({ success: true, audioUrl: undefined })
    })

    // ============================================================
    // FEATURE 5: Game History Events
    // ============================================================

    // Get game history for a player
    socket.on('get_game_history', (playerId, limit, callback) => {
      try {
        const games = getPlayerGames(playerId, limit)
        callback({ success: true, games })
      } catch (error) {
        console.error('Error fetching game history:', error)
        callback({ success: false, error: 'Failed to load game history' })
      }
    })

    // Get specific game details
    socket.on('get_game_details', (gameId, callback) => {
      try {
        const game = getGame(gameId)
        if (!game) {
          callback({ success: false, error: 'Game not found' })
          return
        }
        callback({ success: true, game })
      } catch (error) {
        console.error('Error fetching game details:', error)
        callback({ success: false, error: 'Failed to load game' })
      }
    })

    // Share a game
    socket.on('share_game', (gameId, callback) => {
      try {
        const result = shareGame(gameId)
        if (result.success && result.shareCode) {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://plottwists.app'
          callback({
            success: true,
            shareUrl: `${baseUrl}/replay/${result.shareCode}`
          })
        } else {
          callback({ success: false, error: result.error })
        }
      } catch (error) {
        console.error('Error sharing game:', error)
        callback({ success: false, error: 'Failed to share game' })
      }
    })

    // ============================================================
    // FEATURE 6: Player Stats Events
    // ============================================================

    // Get player stats
    socket.on('get_player_stats', (playerId, callback) => {
      try {
        const stats = getPlayerStats(playerId)
        callback({ success: true, stats })
      } catch (error) {
        console.error('Error fetching player stats:', error)
        callback({ success: false, error: 'Failed to load stats' })
      }
    })

    // Get leaderboard
    socket.on('get_leaderboard', (category, limit, callback) => {
      try {
        const entries = getLeaderboard(category, limit)
        callback({ success: true, entries })
      } catch (error) {
        console.error('Error fetching leaderboard:', error)
        callback({ success: false, error: 'Failed to load leaderboard' })
      }
    })

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log('Client disconnected:', socket.id, 'Reason:', reason)

      // Give a grace period before removing players (helps with reconnections)
      setTimeout(() => {
        // Check if socket reconnected (if it's connected again, don't remove)
        const reconnected = io.sockets.sockets.get(socket.id)
        if (reconnected && reconnected.connected) {
          console.log('Socket reconnected, not removing player:', socket.id)
          return
        }

        // Find and remove player from rooms
        for (const [code, room] of rooms.entries()) {
          for (const [playerId, player] of room.players.entries()) {
            if (player.socketId === socket.id) {
              console.log(`Removing player ${player.nickname} from room ${code}`)
              room.players.delete(playerId)
              io.to(code).emit('player_left', playerId)
              io.to(code).emit('players_update', Array.from(room.players.values()))

              // If host left and room is still in lobby, allow others to continue
              // Only delete room if it's empty or has been too long
              if (player.isHost && room.gameState === 'LOBBY' && room.players.size === 0) {
                console.log(`Deleting empty room ${code}`)
                rooms.delete(code)
              } else if (player.isHost) {
                // Host left during game - notify but don't delete immediately
                io.to(code).emit('error', 'Host disconnected')
              }
              break
            }
          }
        }
      }, 3000) // 3 second grace period
    })
  })

  // Helper function to start script generation
  async function startScriptGeneration(room: Room, io: SocketIOServer) {
    // Rate limiting for script generation (use host socket ID)
    const hostSocketId = room.host.socketId
    if (!scriptGenerationLimiter.check(hostSocketId)) {
      console.warn(`Script generation rate limit exceeded for room ${room.code}`)
      io.to(room.code).emit('error', 'Too many script generation requests. Please wait a moment.')
      room.gameState = 'SELECTION'
      io.to(room.code).emit('game_state_change', 'SELECTION')
      return
    }

    room.gameState = 'LOADING'
    io.to(room.code).emit('game_state_change', 'LOADING')

    // Get all player selections
    const allSelections = Array.from(room.selections.values())
    if (allSelections.length === 0) return

    // For fairness in multiplayer, randomly pick setting and circumstance from all player selections
    // (Each player picked their own, so we combine them randomly)
    const randomSettingIndex = Math.floor(Math.random() * allSelections.length)
    const randomCircumstanceIndex = Math.floor(Math.random() * allSelections.length)

    const chosenSetting = allSelections[randomSettingIndex].setting
    const chosenCircumstance = allSelections[randomCircumstanceIndex].circumstance

    console.log(`🎲 Randomly selected setting: "${chosenSetting}" (from player ${randomSettingIndex + 1})`)
    console.log(`🎲 Randomly selected circumstance: "${chosenCircumstance}" (from player ${randomCircumstanceIndex + 1})`)

    // Send green room trivia based on chosen setting
    const triviaQuestion = getGreenRoomTrivia(chosenSetting)
    io.to(room.code).emit('green_room_prompt', triviaQuestion)

    try {
      // Collect characters from PLAYER role selections only (exclude spectators)
      const playerIds = Array.from(room.players.values())
        .filter(p => p.role === 'PLAYER')
        .map(p => p.id)

      const playerSelections = allSelections.filter((_, index) => {
        const playerId = Array.from(room.selections.keys())[index]
        return playerIds.includes(playerId)
      })

      let characters = playerSelections.map(s => s.character)

      console.log(`🎭 ${room.gameMode} mode: ${characters.length} player${characters.length > 1 ? 's' : ''}`)
      console.log(`   Characters: ${characters.join(', ')}`)
      console.log(`   Setting: "${chosenSetting}"`)
      console.log(`   Circumstance: "${chosenCircumstance}"`)
      if (room.gameMode === 'SOLO') {
        console.log(`   Note: AI will invent a hilarious Co-Star character to play opposite the human player`)
      }

      // Generate script with customization
      const script = await generateScript(
        characters,
        chosenSetting,
        chosenCircumstance,
        room.isMature,
        room.gameMode,
        undefined, // No previous script
        room.scriptCustomization
      )

      // Enhance with audio metadata if audio is enabled
      const finalScript = room.audioSettings
        ? enhanceScriptWithAudio(script, room.audioSettings, chosenSetting)
        : script

      room.script = finalScript
      room.gameState = 'PERFORMING'
      room.currentLineIndex = 0

      // Reset audience interaction for new performance
      if (room.audienceInteraction) {
        resetReactionCounts(room.audienceInteraction)
      }

      io.to(room.code).emit('script_ready', finalScript)
      io.to(room.code).emit('game_state_change', 'PERFORMING')

      // Start ambience if enabled
      if (room.audioSettings?.ambienceEnabled) {
        const ambienceTrack = getAmbienceTrack(chosenSetting)
        io.to(room.code).emit('ambience_start', ambienceTrack)
      }

      // Start teleprompter sync
      startTeleprompterSync(room, io)
    } catch (error) {
      console.error('Script generation failed:', error)
      io.to(room.code).emit('error', 'Failed to generate script. Please try again.')

      // Reset game state to SELECTION so players can try again
      room.gameState = 'SELECTION'
      room.selections.clear()

      // Reset all player submission flags
      for (const player of room.players.values()) {
        player.hasSubmittedSelection = false
      }

      io.to(room.code).emit('game_state_change', 'SELECTION')
      io.to(room.code).emit('players_update', Array.from(room.players.values()))

      // Send cards again
      const content = getFilteredContent(room.isMature)
      io.to(room.code).emit('available_cards', content)
    }
  }

  // Helper function for teleprompter sync
  function startTeleprompterSync(room: Room, io: SocketIOServer) {
    if (!room.script) return

    const WPM = 120 // Words per minute

    // Calculate reading time for each line individually
    const advanceLine = (lineIndex: number) => {
      // Check if paused
      if (room.isPaused) {
        console.log(`Teleprompter paused for room ${room.code}`)
        return
      }

      if (!room.script || lineIndex >= room.script.lines.length - 1) {
        // Clear timeout reference
        roomTimeouts.delete(room.code)

        // Move to voting or results
        if (room.gameMode === 'HEAD_TO_HEAD' || room.gameMode === 'ENSEMBLE') {
          room.gameState = 'VOTING'
          io.to(room.code).emit('game_state_change', 'VOTING')
        } else {
          room.gameState = 'RESULTS'
          io.to(room.code).emit('game_state_change', 'RESULTS')
        }
        return
      }

      // Calculate time for the CURRENT line being displayed
      const currentLine = room.script.lines[lineIndex]
      const wordCount = currentLine.text.split(' ').length
      const readingTimeMs = (wordCount / WPM) * 60 * 1000

      // Schedule next line advance based on current line's reading time
      const timeout = setTimeout(() => {
        if (!room.script) return
        room.currentLineIndex++
        io.to(room.code).emit('sync_teleprompter', room.currentLineIndex)
        advanceLine(room.currentLineIndex)
      }, readingTimeMs)

      // Store timeout reference for this room
      roomTimeouts.set(room.code, timeout)
    }

    // Start with the first line (index 0)
    advanceLine(0)
  }

  // Calculate voting results
  function calculateResults(room: Room, io: SocketIOServer) {
    const voteCounts = new Map<string, number>()

    for (const targetId of room.votes.values()) {
      voteCounts.set(targetId, (voteCounts.get(targetId) || 0) + 1)
    }

    const results = Array.from(voteCounts.entries())
      .map(([playerId, votes]) => ({
        playerId,
        playerName: room.players.get(playerId)?.nickname || 'Unknown',
        votes
      }))
      .sort((a, b) => b.votes - a.votes)

    const winner = results[0]

    room.gameState = 'RESULTS'
    io.to(room.code).emit('game_over', {
      winner,
      allResults: results
    })
    io.to(room.code).emit('game_state_change', 'RESULTS')

    // Save game to history and update player stats
    try {
      if (room.script) {
        // Get setting and circumstance from selections
        const allSelections = Array.from(room.selections.values())
        const setting = allSelections[0]?.setting || 'Unknown'
        const circumstance = allSelections[0]?.circumstance || 'Unknown'

        // Calculate game duration (approximate)
        const duration = Math.floor((Date.now() - room.createdAt) / 1000)

        // Get reaction count
        const reactionCount = room.audienceInteraction
          ? Object.values(room.audienceInteraction.reactionCounts).reduce((a, b) => a + b, 0)
          : 0

        // Save the game
        const savedGame = saveGame(
          room.code,
          room.script,
          Array.from(room.players.values()),
          room.gameMode,
          { winner, allResults: results },
          {
            setting,
            circumstance,
            cardPackId: room.cardPackId || 'standard',
            comedyStyle: room.scriptCustomization?.comedyStyle || 'witty',
            duration,
            audienceReactionCount: reactionCount,
            plotTwistsUsed: room.audienceInteraction?.plotTwistHistory || []
          }
        )

        console.log(`Saved game to history: ${savedGame.id}`)

        // Update player stats
        const players = Array.from(room.players.values()).filter(p => p.role === 'PLAYER')
        for (const player of players) {
          const voteResult = results.find(r => r.playerId === player.id)
          const newAchievements = recordGameResult(
            player.id,
            player.nickname,
            savedGame,
            {
              character: player.assignedCharacter || '',
              votesReceived: voteResult?.votes || 0,
              isWinner: winner?.playerId === player.id,
              reactionsReceived: Math.floor(reactionCount / players.length) // Approximate per-player
            }
          )

          // Notify player of new achievements
          if (newAchievements.length > 0) {
            const playerSocket = io.sockets.sockets.get(player.socketId)
            if (playerSocket) {
              // Emit achievement unlocked events (client can show toast)
              newAchievements.forEach(achievement => {
                playerSocket.emit('achievement_unlocked' as never, achievement)
              })
            }
          }
        }
      }
    } catch (error) {
      console.error('Error saving game to history:', error)
    }
  }

  // Handle Next.js requests
  expressApp.use((req, res) => {
    const parsedUrl = parse(req.url!, true)
    return handle(req, res, parsedUrl)
  })

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
