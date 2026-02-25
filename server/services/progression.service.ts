/**
 * Progression Service — XP, Levels, Titles, Rewards, Weekly Challenges
 */

import type {
  XPSource,
  XPEvent,
  LevelInfo,
  LevelReward,
  WeeklyChallenge,
  Progression,
  PlayerStats,
  Achievement,
} from '../../lib/types'
import { getDatabase, Collections } from '../db'
import { logger } from '../../lib/logger'

// ── Level Configuration ──────────────────────────────────

/** XP required for a given level: 100 * level^1.5 */
function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5))
}

/** Total XP needed to reach a given level (cumulative) */
function totalXPForLevel(level: number): number {
  let total = 0
  for (let i = 1; i < level; i++) {
    total += xpForLevel(i)
  }
  return total
}

/** Calculate level from total XP */
function levelFromXP(totalXP: number): number {
  let level = 1
  let accumulated = 0
  while (true) {
    const needed = xpForLevel(level)
    if (accumulated + needed > totalXP) break
    accumulated += needed
    level++
  }
  return level
}

// ── Titles ───────────────────────────────────────────────

const LEVEL_TITLES: [number, string][] = [
  [50, 'Hall of Famer'],
  [40, 'Comedy Legend'],
  [30, 'Improv Master'],
  [20, 'Comedy Pro'],
  [10, 'Scene Stealer'],
  [5, 'Rising Star'],
  [1, 'Rookie'],
]

function getTitleForLevel(level: number): string {
  for (const [minLevel, title] of LEVEL_TITLES) {
    if (level >= minLevel) return title
  }
  return 'Rookie'
}

// ── Level Rewards ────────────────────────────────────────

const LEVEL_REWARDS: LevelReward[] = [
  { level: 5, type: 'credits', value: 1, description: '1 free credit', claimed: false },
  { level: 10, type: 'credits', value: 2, description: '2 free credits + Scene Stealer title', claimed: false },
  { level: 15, type: 'credits', value: 1, description: '1 free credit', claimed: false },
  { level: 20, type: 'credits', value: 3, description: '3 free credits + Comedy Pro title', claimed: false },
  { level: 25, type: 'credits', value: 1, description: '1 free credit', claimed: false },
  { level: 30, type: 'credits', value: 3, description: '3 free credits + Improv Master title', claimed: false },
  { level: 35, type: 'credits', value: 1, description: '1 free credit', claimed: false },
  { level: 40, type: 'credits', value: 5, description: '5 free credits + Comedy Legend title', claimed: false },
  { level: 45, type: 'credits', value: 1, description: '1 free credit', claimed: false },
  { level: 50, type: 'credits', value: 10, description: '10 free credits + Hall of Famer title', claimed: false },
]

// ── XP Awards ────────────────────────────────────────────

const XP_AMOUNTS: Record<XPSource, number> = {
  game_completed: 50,
  game_won: 100,
  votes_received: 10,
  reactions_received: 5,
  achievement_unlocked: 50,
  win_streak: 25,
  daily_first_game: 50,
  weekly_challenge: 0, // Dynamic per challenge
  public_game_hosted: 25,
}

// ── Weekly Challenge Pool ────────────────────────────────

interface ChallengeTemplate {
  id: string
  title: string
  description: string
  target: number
  xpReward: number
}

const CHALLENGE_POOL: ChallengeTemplate[] = [
  { id: 'play_3', title: 'Triple Feature', description: 'Play 3 games this week', target: 3, xpReward: 150 },
  { id: 'win_2', title: 'Double Win', description: 'Win 2 games this week', target: 2, xpReward: 200 },
  { id: 'play_ensemble', title: 'Team Player', description: 'Play an Ensemble game', target: 1, xpReward: 100 },
  { id: 'get_20_reactions', title: 'Crowd Pleaser', description: 'Receive 20 reactions in a week', target: 20, xpReward: 150 },
  { id: 'play_5', title: 'Marathon', description: 'Play 5 games this week', target: 5, xpReward: 250 },
  { id: 'win_streak_2', title: 'Hot Streak', description: 'Win 2 games in a row', target: 2, xpReward: 200 },
  { id: 'play_h2h', title: 'Showdown', description: 'Play a Head-to-Head game', target: 1, xpReward: 100 },
  { id: 'play_public', title: 'Social Butterfly', description: 'Play a public game', target: 1, xpReward: 100 },
]

// ── Core Functions ───────────────────────────────────────

/**
 * Get or create progression data for a player
 */
export async function getProgression(playerId: string): Promise<Progression> {
  const db = getDatabase()
  let progression = await db.get<Progression>(Collections.PROGRESSION, playerId)

  if (!progression) {
    // Bootstrap from existing stats
    progression = await bootstrapProgression(playerId)
  }

  // Check if weekly challenges need refresh
  progression = refreshWeeklyChallenges(progression)

  return progression
}

/**
 * Bootstrap progression from existing player stats
 */
async function bootstrapProgression(playerId: string): Promise<Progression> {
  const db = getDatabase()
  const stats = await db.get<PlayerStats>(Collections.PLAYER_STATS, playerId)

  let totalXP = 0
  if (stats) {
    totalXP += (stats.gamesPlayed || 0) * XP_AMOUNTS.game_completed
    totalXP += (stats.gamesWon || 0) * XP_AMOUNTS.game_won
    totalXP += (stats.totalVotesReceived || 0) * XP_AMOUNTS.votes_received
  }

  const level = levelFromXP(totalXP)
  const title = getTitleForLevel(level)

  const progression: Progression = {
    playerId,
    totalXP,
    level,
    title,
    xpHistory: [],
    levelRewardsClaimed: [],
    weeklyChallenges: [],
  }

  // Generate initial weekly challenges
  refreshWeeklyChallenges(progression)

  await db.set(Collections.PROGRESSION, playerId, progression)
  return progression
}

/**
 * Award XP to a player. Returns XP events and whether they leveled up.
 */
export async function awardXP(
  playerId: string,
  events: { source: XPSource; amount?: number; description: string }[]
): Promise<{ xpEvents: XPEvent[]; newLevel: number; oldLevel: number; title: string; totalXP: number }> {
  const db = getDatabase()
  const progression = await getProgression(playerId)
  const oldLevel = progression.level

  const xpEvents: XPEvent[] = []

  for (const event of events) {
    const amount = event.amount ?? XP_AMOUNTS[event.source]
    if (amount <= 0) continue

    const xpEvent: XPEvent = {
      source: event.source,
      amount,
      description: event.description,
      timestamp: Date.now(),
    }

    progression.totalXP += amount
    xpEvents.push(xpEvent)
    progression.xpHistory.unshift(xpEvent)
  }

  // Keep last 50 XP events
  progression.xpHistory = progression.xpHistory.slice(0, 50)

  // Recalculate level
  progression.level = levelFromXP(progression.totalXP)
  progression.title = getTitleForLevel(progression.level)

  await db.set(Collections.PROGRESSION, playerId, progression)

  // Also update PlayerStats with level/title
  const stats = await db.get<PlayerStats>(Collections.PLAYER_STATS, playerId)
  if (stats) {
    stats.totalXP = progression.totalXP
    stats.level = progression.level
    stats.title = progression.title
    await db.set(Collections.PLAYER_STATS, playerId, stats)
  }

  return {
    xpEvents,
    newLevel: progression.level,
    oldLevel,
    title: progression.title,
    totalXP: progression.totalXP,
  }
}

/**
 * Get level info for display
 */
export function getLevelInfo(totalXP: number): LevelInfo {
  const level = levelFromXP(totalXP)
  const xpAtCurrentLevel = totalXPForLevel(level)
  const xpForNext = xpForLevel(level)
  const currentXP = totalXP - xpAtCurrentLevel
  const progressPercent = xpForNext > 0 ? Math.min((currentXP / xpForNext) * 100, 100) : 100

  return {
    level,
    currentXP,
    xpForNextLevel: xpForNext,
    progressPercent,
    title: getTitleForLevel(level),
  }
}

/**
 * Compute XP events for a completed game
 */
export function computeGameXPEvents(
  isWinner: boolean,
  votesReceived: number,
  reactionsReceived: number,
  currentWinStreak: number,
  isFirstGameToday: boolean,
  isPublicGame: boolean,
  isHost: boolean,
  newAchievements: Achievement[]
): { source: XPSource; amount?: number; description: string }[] {
  const events: { source: XPSource; amount?: number; description: string }[] = []

  events.push({ source: 'game_completed', description: 'Game completed' })

  if (isWinner) {
    events.push({ source: 'game_won', description: 'Won the game!' })
  }

  if (votesReceived > 0) {
    events.push({
      source: 'votes_received',
      amount: votesReceived * XP_AMOUNTS.votes_received,
      description: `${votesReceived} vote${votesReceived > 1 ? 's' : ''} received`,
    })
  }

  if (reactionsReceived > 0) {
    events.push({
      source: 'reactions_received',
      amount: reactionsReceived * XP_AMOUNTS.reactions_received,
      description: `${reactionsReceived} reaction${reactionsReceived > 1 ? 's' : ''} received`,
    })
  }

  if (currentWinStreak > 2) {
    const streakBonus = (currentWinStreak - 2) * XP_AMOUNTS.win_streak
    events.push({
      source: 'win_streak',
      amount: streakBonus,
      description: `${currentWinStreak}-game win streak!`,
    })
  }

  if (isFirstGameToday) {
    events.push({ source: 'daily_first_game', description: 'First game of the day' })
  }

  if (isPublicGame && isHost) {
    events.push({ source: 'public_game_hosted', description: 'Hosted a public game' })
  }

  for (const achievement of newAchievements) {
    const amount = achievement.rarity === 'legendary' ? 200
      : achievement.rarity === 'epic' ? 100
      : achievement.rarity === 'rare' ? 50
      : 25
    events.push({
      source: 'achievement_unlocked',
      amount,
      description: `Achievement: ${achievement.name}`,
    })
  }

  return events
}

/**
 * Check if this is the player's first game today
 */
export async function isFirstGameToday(playerId: string): Promise<boolean> {
  const progression = await getProgression(playerId)
  const today = new Date().toISOString().split('T')[0]
  return progression.lastDailyBonusDate !== today
}

/**
 * Mark today's daily bonus as claimed
 */
export async function markDailyBonus(playerId: string): Promise<void> {
  const db = getDatabase()
  const progression = await getProgression(playerId)
  progression.lastDailyBonusDate = new Date().toISOString().split('T')[0]
  await db.set(Collections.PROGRESSION, playerId, progression)
}

/**
 * Refresh weekly challenges if they've expired
 */
function refreshWeeklyChallenges(progression: Progression): Progression {
  const now = Date.now()
  const needsRefresh = progression.weeklyChallenges.length === 0 ||
    progression.weeklyChallenges.every(c => c.expiresAt < now)

  if (!needsRefresh) return progression

  // Generate 3 random challenges
  const shuffled = [...CHALLENGE_POOL].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, 3)

  // Challenges expire next Monday at midnight UTC
  const nextMonday = getNextMondayUTC()

  progression.weeklyChallenges = selected.map(template => ({
    id: template.id,
    title: template.title,
    description: template.description,
    target: template.target,
    progress: 0,
    xpReward: template.xpReward,
    expiresAt: nextMonday,
    completed: false,
  }))

  return progression
}

function getNextMondayUTC(): number {
  const now = new Date()
  const day = now.getUTCDay()
  const daysUntilMonday = day === 0 ? 1 : 8 - day
  const nextMonday = new Date(now)
  nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday)
  nextMonday.setUTCHours(0, 0, 0, 0)
  return nextMonday.getTime()
}

/**
 * Update weekly challenge progress after a game
 */
export async function updateChallengeProgress(
  playerId: string,
  gameData: {
    gameMode: string
    isWinner: boolean
    reactionsReceived: number
    currentWinStreak: number
    isPublicGame: boolean
  }
): Promise<{ completedChallenges: WeeklyChallenge[]; xpAwarded: number }> {
  const db = getDatabase()
  const progression = await getProgression(playerId)
  const completedChallenges: WeeklyChallenge[] = []
  let xpAwarded = 0

  for (const challenge of progression.weeklyChallenges) {
    if (challenge.completed || challenge.expiresAt < Date.now()) continue

    let incrementBy = 0

    switch (challenge.id) {
      case 'play_3':
      case 'play_5':
        incrementBy = 1
        break
      case 'win_2':
        if (gameData.isWinner) incrementBy = 1
        break
      case 'play_ensemble':
        if (gameData.gameMode === 'ENSEMBLE') incrementBy = 1
        break
      case 'play_h2h':
        if (gameData.gameMode === 'HEAD_TO_HEAD') incrementBy = 1
        break
      case 'get_20_reactions':
        incrementBy = gameData.reactionsReceived
        break
      case 'win_streak_2':
        if (gameData.isWinner) challenge.progress = gameData.currentWinStreak
        break
      case 'play_public':
        if (gameData.isPublicGame) incrementBy = 1
        break
    }

    if (challenge.id !== 'win_streak_2') {
      challenge.progress += incrementBy
    }

    if (challenge.progress >= challenge.target && !challenge.completed) {
      challenge.completed = true
      completedChallenges.push(challenge)
      xpAwarded += challenge.xpReward
    }
  }

  await db.set(Collections.PROGRESSION, playerId, progression)

  return { completedChallenges, xpAwarded }
}

/**
 * Claim a level reward
 */
export async function claimLevelReward(
  playerId: string,
  level: number
): Promise<LevelReward | null> {
  const db = getDatabase()
  const progression = await getProgression(playerId)

  // Check player has reached this level
  if (progression.level < level) return null

  // Check not already claimed
  if (progression.levelRewardsClaimed.includes(level)) return null

  // Find the reward
  const reward = LEVEL_REWARDS.find(r => r.level === level)
  if (!reward) return null

  progression.levelRewardsClaimed.push(level)
  await db.set(Collections.PROGRESSION, playerId, progression)

  return { ...reward, claimed: true }
}

/**
 * Get available (unclaimed) level rewards
 */
export async function getAvailableRewards(playerId: string): Promise<LevelReward[]> {
  const progression = await getProgression(playerId)

  return LEVEL_REWARDS
    .filter(r => r.level <= progression.level && !progression.levelRewardsClaimed.includes(r.level))
    .map(r => ({ ...r, claimed: false }))
}
