/**
 * Script Customization Service
 * Generates dynamic prompts based on customization settings
 */

import type {
  ScriptCustomization,
  ComedyStyle,
  ScriptLength,
  ScriptDifficulty,
  PhysicalComedyLevel,
  DEFAULT_SCRIPT_CUSTOMIZATION
} from '../../lib/types'

// Line count ranges for each script length
const SCRIPT_LENGTH_RANGES: Record<ScriptLength, { min: number, max: number }> = {
  lightning: { min: 8, max: 12 },
  quick: { min: 15, max: 25 },
  // 2026-07-30, Jackson's ruling: 42-52, up from 30-38 (which was itself his 2026-07-29 ruling,
  // down from 30-40). BOTH MOVES ARE HIS AND THEY ARE NOT A CONTRADICTION — the first was decided
  // against a six-seat room and the second against an eight-seat one. What changed underneath is
  // the seat cap, not his opinion of how long a party will sit still.
  //
  // The trigger was a rule he set in advance: measure mean speaking lines per seated player at 8,
  // and if it comes in under 5, raise the budget rather than lower the cap. It measured 4.71 across
  // three live generations (mean), 3.5 (median), range 2-12. See PLAYTEST-2026-07-30.md.
  //
  // WHY THE BAND WIDENS RATHER THAN SHIFTS. A narrow band is what forced the model to pay for an
  // extra character by starving three others; the skew, not the total, was the finding. Ten lines
  // of slack lets it seat everyone without cutting the busiest part.
  //
  // The ceiling is still a ceiling: 52 lines is ~2.5 minutes of reading at 120 wpm and 5.8
  // words/line (measured), against the ~3.4 minutes his "seventy lines" remark was about.
  standard: { min: 42, max: 52 },
  epic: { min: 45, max: 60 }
}

/**
 * Output ceilings, in tokens.
 *
 * THESE ARE CEILINGS, NOT TARGETS. Nothing is spent by raising one; the model stops when it is
 * done. The reason to LOWER one is to bound the worst case, and the reason to be careful about
 * lowering one is that a ceiling reached mid-JSON is not a short script — it is a PARSE FAILURE,
 * i.e. a generation that dies in front of a room full of people rather than one that runs long.
 *
 * `standard` is derived from measurement rather than guessed. Three real 8-player ENSEMBLE
 * generations on 2026-07-29 produced 59/70/73 lines at 2267/2538/2704 output tokens — a stable
 * 36-38 tokens per line across all three; the 2026-07-30 re-run at 38 lines measured 39.
 *
 * RAISED 2,600 -> 3,000 ON 2026-07-30, with the line band. This is arithmetic, not preference:
 * at 39 tokens/line a 52-line script is ~2,030 tokens plus title and synopsis, which is 78% of
 * 2,600. That is too close to a ceiling whose failure mode is not a short script but a PARSE
 * FAILURE in front of a room full of people. 3,000 restores ~14% headroom over the worst case
 * the band now permits.
 *
 * The others are left over-provisioned on purpose: they are unmeasured, and an over-provisioned
 * ceiling costs nothing while an under-provisioned one breaks the scene.
 */
const SCRIPT_LENGTH_TOKENS: Record<ScriptLength, number> = {
  lightning: 2048,
  quick: 4096,
  standard: 3000,
  epic: 12000
}

/**
 * Generate comedy style instructions for the AI prompt
 */
export function getComedyStyleInstructions(style: ComedyStyle): string {
  const styles: Record<ComedyStyle, string> = {
    witty: `
═══════════════════════════════════════
COMEDY STYLE: WITTY & CLEVER
═══════════════════════════════════════
Focus on sharp, intelligent humor:
- Wordplay, puns, and double meanings
- Quick comebacks and clever retorts
- Subverted expectations and irony
- References and callbacks that reward attention
- Dry humor and understated delivery
- Characters should sound SMART, even when being absurd
Think: drawing-room wit meets high-concept afterlife comedy`,

    slapstick: `
═══════════════════════════════════════
COMEDY STYLE: PHYSICAL SLAPSTICK
═══════════════════════════════════════
Focus on physical comedy described through dialogue:
- Characters describing their own pratfalls and mishaps
- Exaggerated reactions to physical events
- Chain reactions of comedic disasters
- Objects behaving unpredictably
- Characters getting increasingly disheveled
- Lines like "Why am I covered in pudding now?!"
Think: Three Stooges meets Looney Tunes`,

    absurdist: `
═══════════════════════════════════════
COMEDY STYLE: ABSURDIST & SURREAL
═══════════════════════════════════════
Embrace the weird and nonsensical:
- Logic that makes NO sense but characters accept completely
- Non-sequiturs that somehow connect
- Reality-bending scenarios treated as mundane
- Objects and concepts doing impossible things
- Characters with bizarre, unexplained abilities
- "The toast is screaming again" energy
Think: Monty Python meets Adult Swim`,

    dark: `
═══════════════════════════════════════
COMEDY STYLE: DARK COMEDY
═══════════════════════════════════════
Find humor in uncomfortable places:
- Gallows humor and morbid observations
- Characters casually discussing terrible things
- Dramatic irony where audience knows more than characters
- Juxtaposition of mundane and macabre
- Characters being oblivious to darkness around them
- Uncomfortable truths delivered with a smile
Think: Fargo meets What We Do in the Shadows`,

    sitcom: `
═══════════════════════════════════════
COMEDY STYLE: CLASSIC SITCOM
═══════════════════════════════════════
Embrace sitcom conventions:
- Misunderstandings that escalate hilariously
- Characters with distinct quirks and catchphrases
- Setup-punchline structure with clear beats
- Running gags that pay off
- "Will they won't they" tension
- Heartwarming moments undermined by comedy
Think: deadpan workplace mockumentary meets ensemble precinct comedy`,

    improv: `
═══════════════════════════════════════
COMEDY STYLE: IMPROV THEATER
═══════════════════════════════════════
Write like an improv troupe at peak performance:
- Strong "YES AND" energy - build on everything
- Characters making bold choices and committing
- Heightening and exploring single ideas
- Finding the game of the scene quickly
- Support and gifts between characters
- Discovery and surprise in the moment
Think: Whose Line meets UCB Harold`
  }

  return styles[style] || styles.witty
}

/**
 * Generate difficulty-specific instructions
 */
export function getDifficultyInstructions(difficulty: ScriptDifficulty): string {
  const difficulties: Record<ScriptDifficulty, string> = {
    beginner: `
═══════════════════════════════════════
DIFFICULTY: BEGINNER-FRIENDLY
═══════════════════════════════════════
Make this easy for first-time performers:
- Short, punchy lines (under 15 words each)
- Clear emotional cues in the dialogue
- Obvious comedic beats that are hard to miss
- Forgiving timing - jokes that work even with pauses
- Simple character voices without complex accents
- Include "reaction" lines that are easy to deliver
- Avoid tongue-twisters or complex wordplay`,

    intermediate: `
═══════════════════════════════════════
DIFFICULTY: INTERMEDIATE
═══════════════════════════════════════
Balance accessibility with challenge:
- Mix of short and medium-length lines
- Some character-specific vocal choices
- Timing matters but isn't critical
- Include some wordplay and callbacks
- Allow for improvisation opportunities
- Build to a climax that rewards good delivery`,

    advanced: `
═══════════════════════════════════════
DIFFICULTY: ADVANCED (IMPROV VETERANS)
═══════════════════════════════════════
Challenge experienced performers:
- Varied line lengths including longer speeches
- Complex character voices and accents required
- Precise timing for maximum comedic effect
- Dense wordplay and layered callbacks
- Opportunities to add physical business
- Emotional range within single scenes
- Build to multiple climax points
- Reward performers who take risks`
  }

  return difficulties[difficulty] || difficulties.intermediate
}

/**
 * Generate physical comedy instructions
 */
export function getPhysicalComedyInstructions(level: PhysicalComedyLevel): string {
  const levels: Record<PhysicalComedyLevel, string> = {
    none: `
PHYSICAL COMEDY: NONE
Keep the comedy purely verbal. No stage directions or physical gags.
Characters should not reference physical actions or movements.`,

    minimal: `
PHYSICAL COMEDY: MINIMAL
Include occasional physical references:
- Simple gestures mentioned in dialogue
- Facial expressions described verbally
- Minor physical reactions ("Did you just flinch?")
Keep physical comedy to 10-15% of the humor.`,

    heavy: `
PHYSICAL COMEDY: HEAVY
Embrace physical comedy throughout:
- Characters describing their own pratfalls
- Lots of movement and action in dialogue
- Physical gags that escalate scene-to-scene
- Include [STAGE DIRECTION] lines for performers
- Encourage physicality: "Why are you army-crawling?"
- Reward performers who commit to physical bits
Physical comedy should be 40-50% of the humor.`
  }

  return levels[level] || levels.minimal
}

/**
 * Get line count range for script length
 */
export function getLineCountRange(length: ScriptLength): { min: number, max: number } {
  return SCRIPT_LENGTH_RANGES[length] || SCRIPT_LENGTH_RANGES.standard
}

/**
 * Get max tokens for script length
 */
export function getMaxTokens(length: ScriptLength): number {
  // The ENSEMBLE ×1.25 that used to be applied here is GONE, and removing it is the point of
  // this change rather than a tidy-up. It re-inflated `standard` to 3,250 on exactly the mode
  // Jackson capped at 2,600 — so capping the table alone would have left the live 8-player path
  // uncapped while every test of the change looked correct.
  //
  // It was also never justified. Cast size does not change tokens-per-LINE: the 2026-07-29
  // measurements are 8-player ENSEMBLE at 36-38 tokens/line, the same rate a two-hander produces.
  // More performers means each speaks less often, not that the script is denser.
  return SCRIPT_LENGTH_TOKENS[length] || SCRIPT_LENGTH_TOKENS.standard
}

/**
 * Generate callback instructions if enabled
 */
export function getCallbackInstructions(enabled: boolean, previousJokes?: string[]): string {
  if (!enabled) {
    return ''
  }

  let instructions = `
═══════════════════════════════════════
CALLBACKS ENABLED
═══════════════════════════════════════
Create opportunities for callbacks within this script:
- Establish a pattern or phrase in the first third
- Reference it unexpectedly in the middle
- Pay it off with a twist at the end
- Make callbacks feel earned, not forced`

  if (previousJokes && previousJokes.length > 0) {
    instructions += `

PREVIOUS ROUND CALLBACKS:
The following jokes/moments landed well in previous rounds.
Consider subtle references if they fit naturally:
${previousJokes.map((j, i) => `${i + 1}. "${j}"`).join('\n')}

Only use these if they fit the current scene - don't force them!`
  }

  return instructions
}

/**
 * Generate custom instructions section if provided
 */
export function getCustomInstructions(instructions?: string): string {
  if (!instructions || instructions.trim() === '') {
    return ''
  }

  return `
═══════════════════════════════════════
HOST SPECIAL INSTRUCTIONS
═══════════════════════════════════════
The host has requested the following:
${instructions}

Honor these requests while maintaining comedy quality.`
}

/**
 * Build the complete customization prompt section
 */
export function buildCustomizationPrompt(
  customization: ScriptCustomization,
  gameMode: string,
  previousJokes?: string[]
): string {
  const lineRange = getLineCountRange(customization.scriptLength)

  return `
${getComedyStyleInstructions(customization.comedyStyle)}

${getDifficultyInstructions(customization.difficulty)}

${getPhysicalComedyInstructions(customization.physicalComedy)}

${getCallbackInstructions(customization.enableCallbacks, previousJokes)}

${getCustomInstructions(customization.customInstructions)}

═══════════════════════════════════════
SCRIPT LENGTH REQUIREMENTS
═══════════════════════════════════════
Target: ${lineRange.min}-${lineRange.max} lines
Mode: ${customization.scriptLength.toUpperCase()}
${customization.scriptLength === 'quick' ? 'Keep it snappy - every line must earn its place!' : ''}
${customization.scriptLength === 'epic' ? 'Build a complete narrative arc with multiple beats!' : ''}
`
}

/**
 * Validate customization settings
 */
export function validateCustomization(customization: Partial<ScriptCustomization>): ScriptCustomization {
  const validStyles: ComedyStyle[] = ['witty', 'slapstick', 'absurdist', 'dark', 'sitcom', 'improv']
  const validLengths: ScriptLength[] = ['lightning', 'quick', 'standard', 'epic']
  const validDifficulties: ScriptDifficulty[] = ['beginner', 'intermediate', 'advanced']
  const validPhysical: PhysicalComedyLevel[] = ['none', 'minimal', 'heavy']

  return {
    comedyStyle: validStyles.includes(customization.comedyStyle as ComedyStyle)
      ? customization.comedyStyle as ComedyStyle
      : 'witty',
    scriptLength: validLengths.includes(customization.scriptLength as ScriptLength)
      ? customization.scriptLength as ScriptLength
      : 'standard',
    difficulty: validDifficulties.includes(customization.difficulty as ScriptDifficulty)
      ? customization.difficulty as ScriptDifficulty
      : 'intermediate',
    physicalComedy: validPhysical.includes(customization.physicalComedy as PhysicalComedyLevel)
      ? customization.physicalComedy as PhysicalComedyLevel
      : 'minimal',
    enableCallbacks: customization.enableCallbacks ?? true,
    customInstructions: customization.customInstructions?.slice(0, 500) // Max 500 chars
  }
}
