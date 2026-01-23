import Anthropic from '@anthropic-ai/sdk'
import type { Script, ScriptLine } from '../../lib/types'
import { ScriptSchema } from '../../lib/schema'
import { AI_MAX_TOKENS, AI_TEMPERATURE } from '../utils/constants'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

/**
 * Generate a comedy script using Claude AI
 */
export async function generateScript(
  characters: string[],
  setting: string,
  circumstance: string,
  isMature: boolean,
  gameMode: 'SOLO' | 'HEAD_TO_HEAD' | 'ENSEMBLE',
  previousScript?: Script
): Promise<Script> {
  const isSoloMode = gameMode === 'SOLO'
  const numPlayers = characters.length
  const characterList = characters.join(', ')

  // Build comedy writing guidelines based on rating
  const comedyGuidelines = buildComedyGuidelines(isMature)
  const modeInstructions = buildModeInstructions(gameMode, characters)
  const sequelInstructions = previousScript ? buildSequelInstructions(previousScript) : ''

  const systemPrompt = buildSystemPrompt(comedyGuidelines, sequelInstructions)
  const userMessage = buildUserMessage(
    characterList,
    setting,
    circumstance,
    isMature,
    gameMode,
    numPlayers,
    modeInstructions
  )

  try {
    console.log(`\n🎬 AI SCRIPT GENERATION ${previousScript ? '(SEQUEL MODE)' : ''}`)
    console.log(`════════════════════════════════════════`)
    console.log(`Mode: ${gameMode}`)
    console.log(`Rating: ${isMature ? '18+ (Adult Comedy)' : 'Family Friendly'}`)
    console.log(`Characters: ${characterList}`)
    console.log(`Setting: ${setting}`)
    console.log(`Circumstance: ${circumstance}`)
    if (previousScript) {
      console.log(`Sequel to: "${previousScript.title}"`)
    }
    if (isSoloMode) {
      console.log(`Note: AI will invent a hilarious Co-Star character to play opposite the human player`)
    }
    console.log(`════════════════════════════════════════\n`)

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: gameMode === 'ENSEMBLE' ? AI_MAX_TOKENS.ENSEMBLE : AI_MAX_TOKENS.DEFAULT,
      temperature: AI_TEMPERATURE,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    })

    console.log(`✅ Script generated successfully!\n`)

    const content = message.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Strip markdown code blocks if present
    let jsonText = content.text.trim()
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '')
      jsonText = jsonText.replace(/\n?```$/, '')
    }

    // Parse and validate with Zod
    const rawScript = JSON.parse(jsonText.trim())
    const validationResult = ScriptSchema.safeParse(rawScript)

    if (!validationResult.success) {
      console.error('❌ Script validation failed:', validationResult.error.format())
      throw new Error(`Invalid script format: ${validationResult.error.message}`)
    }

    return validationResult.data
  } catch (error) {
    console.error('❌ Error generating script:', error)
    throw error
  }
}

// Helper functions for building prompts
function buildComedyGuidelines(isMature: boolean): string {
  return isMature ? `
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
}

function buildModeInstructions(gameMode: string, characters: string[]): string {
  if (gameMode === 'HEAD_TO_HEAD') {
    return `
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
  } else if (gameMode === 'ENSEMBLE') {
    return `
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
  } else {
    return `
═══════════════════════════════════════
SCENE DYNAMICS (SOLO MODE - SETTING-BASED ENSEMBLE)
═══════════════════════════════════════
This is a SOLO performance. The human player will perform as ${characters[0]}.

YOUR MISSION: ${characters[0]} has wandered into a new world.
You must populate the scene with 2-3 characters who NATIVELY BELONG to that setting.

STEP 1: IDENTIFY THE SETTING'S UNIVERSE
Determine what world this represents and who belongs there.

STEP 2: GENERATE 2-3 SETTING-NATIVE CHARACTERS
Create an AI ensemble cast that fits the setting.

STEP 3: THE COMEDY CONTRAST
The humor comes from the FISH-OUT-OF-WATER dynamic.

LINE DISTRIBUTION:
- Human player (${characters[0]}): 40-50% of lines
- AI Ensemble (2-3 characters): 50-60% of lines TOTAL (split among them)
`
  }
}

function buildSequelInstructions(previousScript: Script): string {
  return `

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
`
}

function buildSystemPrompt(comedyGuidelines: string, sequelInstructions: string): string {
  return `You are a professional comedy writer. Not someone who TRIES to be funny - someone who IS funny.

These scripts will be performed OUT LOUD by amateur players. That means:
- Every line must sound NATURAL when spoken
- Comedy must land even with mediocre delivery
- The words themselves must be funny, not just the performance
- Avoid jokes that need perfect timing - focus on jokes that need perfect WORDS

${comedyGuidelines}

═══════════════════════════════════════════════════════
THE IMPROV PRINCIPLE: YES-AND
═══════════════════════════════════════════════════════
Each character should BUILD on what came before, not deny it.

CHARACTER VOICE IS NON-NEGOTIABLE
═══════════════════════════════════════════════════════
Match each character's voice exactly.

PACING & STRUCTURE
═══════════════════════════════════════════════════════
Lines 1-5: HOOK (establish the game instantly)
Lines 6-15: EXPLORE (play with the premise, build patterns)
Lines 16-25: ESCALATE (things get worse/weirder/more)
Lines 26-35: PEAK CHAOS (the scene reaches maximum absurdity)
Lines 36-40: BUTTON (callback, twist, or perfect punchline to end on)

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

Now write comedy that makes people ACTUALLY LAUGH.${sequelInstructions}`
}

function buildUserMessage(
  characterList: string,
  setting: string,
  circumstance: string,
  isMature: boolean,
  gameMode: string,
  numPlayers: number,
  modeInstructions: string
): string {
  return `Write a scene using these ingredients:

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
SCRIPT LENGTH: ${gameMode === 'ENSEMBLE' ? '40-50 lines' : '30-40 lines'}
PERFORMERS: ${numPlayers} player${numPlayers > 1 ? 's' : ''}

═══════════════════════════════════════
YOUR MISSION
═══════════════════════════════════════
1. Find the GAME of this scene immediately (what's the core comic premise?)
2. Write in the distinct voice of each character
3. Escalate from funny to FUNNIER to absolutely ridiculous
4. Use specific details, not generic reactions
5. Build patterns and break them (rule of three)
6. Include callbacks to jokes from earlier in the scene
7. Give every character emotional stakes (even if absurd)
8. End with a strong button - callback, twist, or perfect punchline

The premise is already absurd. Your job is to EXPLOIT that absurdity through sharp dialogue.

Write the scene now. Make it genuinely funny - the kind of funny where people will want to perform it again.`
}
