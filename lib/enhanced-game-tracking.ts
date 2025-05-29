import { kv } from "@vercel/kv"
import type { GameMode, Difficulty, Rarity, GameItem } from "./types"

// Enhanced game record with new tracking data
export interface EnhancedGameRecord {
  // Existing fields
  gameId: string
  userId: string
  username: string
  timestamp: number
  score: number
  itemCount: number
  gameMode: GameMode
  difficulty: Difficulty
  duration?: number

  // Speed & Efficiency
  itemsPerMinute?: number
  timeUtilization?: number // % of available time used (for timed games)
  finalMinuteItems?: number // Items found in last 60 seconds
  averageTimePerConnection?: number

  // Collection & Discovery
  newItemsDiscovered: number
  rediscoveredItems: number
  rarityBreakdown: Record<Rarity, number>
  genresUsed: string[]
  decadesUsed: string[]

  // Skill & Progression
  gameEndReason: "completed" | "strikes" | "timeout" | "quit"
  strikes?: number // Only for non-timed modes
  perfectGame: boolean // No failed attempts
  comebackGame: boolean // Recovered from 2+ strikes
  personalBest: boolean // New high score

  // Engagement & Behavior
  sessionId: string
  gameNumberInSession: number
  timeSinceLastGame?: number // Minutes since previous game
  playTimeHour: number // Hour of day (0-23)
  isWeekend: boolean
}

// User analytics aggregated over time
export interface UserAnalytics {
  // Collection & Discovery
  collectionVelocity: number // New items per week
  rarityLuck: number // Actual vs expected legendary rate
  completionRate: number // % of started games finished
  rediscoveryRate: number // % of items that are reused
  favoriteDecades: string[]
  favoriteGenres: string[]
  connectionStyle: "broad" | "deep" // Many items once vs few items often

  // Engagement & Behavior
  averageSessionLength: number // Minutes per session
  peakPlayTime: string // Most active hour
  weekendWarrior: boolean // Plays more on weekends
  bingeSessions: number // Sessions with 3+ games
  totalSessions: number

  // Speed & Efficiency
  bestItemsPerMinute: number
  averageTimeUtilization: number
  fastestGameDuration: number
  longestGameItems: number
  averageConnectionTime: number

  // Skill & Progression
  improvementRate: number // Score change over last 10 games
  consistencyScore: number // Standard deviation of recent scores
  personalBestStreak: number // Games since last PB
  difficultyProgression: Difficulty[]
  rarityDiscoveryRate: Record<Rarity, number>
  perfectGames: number
  comebackGames: number

  // Metadata
  lastCalculated: string
  totalGamesAnalyzed: number
}

// Session tracking
export interface GameSession {
  sessionId: string
  userId: string
  startTime: number
  endTime?: number
  gameIds: string[]
  totalGames: number
  totalDuration: number
  averageScore: number
}

// Generate session ID based on time gaps
export function generateSessionId(userId: string, lastGameTime?: number): string {
  const now = Date.now()
  const sessionGapMinutes = 30 // 30 minutes gap = new session

  if (!lastGameTime || now - lastGameTime > sessionGapMinutes * 60 * 1000) {
    return `session_${userId}_${now}`
  }

  // Continue existing session - we'll need to look up the current session ID
  return `session_${userId}_${Math.floor(lastGameTime / (sessionGapMinutes * 60 * 1000)) * (sessionGapMinutes * 60 * 1000)}`
}

// Enhanced game recording with analytics data
export async function recordEnhancedGameParticipation(
  userId: string,
  username: string,
  gameData: {
    score: number
    itemCount: number
    gameMode: GameMode
    difficulty: Difficulty
    duration?: number
    gameItems: GameItem[]
    gameEndReason: "completed" | "strikes" | "timeout" | "quit"
    strikes?: number
    timingData?: {
      connectionTimes: number[] // Time between each connection
      finalMinuteItems?: number
    }
  },
): Promise<string | null> {
  try {
    console.log(`[ENHANCED_TRACKING] Recording game for ${username}`)

    // Generate game ID and session info
    const gameId = await generateGameId()
    const timestamp = Date.now()

    // Get last game time for session tracking
    const userStatsKey = `user-stats:${userId}`
    const existingStats = await kv.get<any>(userStatsKey)
    const lastGameTime = existingStats?.lastPlayed

    // Generate session ID
    const sessionId = generateSessionId(userId, lastGameTime)
    const gameNumberInSession = await getGameNumberInSession(sessionId)

    // Calculate analytics data
    const analytics = calculateGameAnalytics(gameData, timestamp, sessionId, gameNumberInSession, lastGameTime)

    // Create enhanced game record
    const enhancedRecord: EnhancedGameRecord = {
      gameId,
      userId,
      username,
      timestamp,
      score: gameData.score,
      itemCount: gameData.itemCount,
      gameMode: gameData.gameMode,
      difficulty: gameData.difficulty,
      duration: gameData.duration,
      ...analytics,
    }

    // Store the enhanced record
    await kv.set(`enhanced-game:${gameId}`, enhancedRecord, { ex: 60 * 60 * 24 * 365 })

    // Update session tracking
    await updateSessionTracking(sessionId, userId, gameId, timestamp, gameData.duration || 0)

    // Update user's enhanced game list
    const userEnhancedGamesKey = `user-enhanced-games:${userId}`
    await kv.lpush(userEnhancedGamesKey, gameId)
    await kv.ltrim(userEnhancedGamesKey, 0, 999) // Keep last 1000 games

    console.log(`[ENHANCED_TRACKING] Successfully recorded enhanced game ${gameId}`)
    return gameId
  } catch (error) {
    console.error("Error recording enhanced game participation:", error)
    return null
  }
}

// Calculate analytics data for a single game
function calculateGameAnalytics(
  gameData: any,
  timestamp: number,
  sessionId: string,
  gameNumberInSession: number,
  lastGameTime?: number,
): Partial<EnhancedGameRecord> {
  const date = new Date(timestamp)
  const playTimeHour = date.getHours()
  const isWeekend = date.getDay() === 0 || date.getDay() === 6

  // Speed & Efficiency calculations
  let itemsPerMinute = 0
  let timeUtilization = 0
  let averageTimePerConnection = 0

  if (gameData.duration && gameData.duration > 0) {
    itemsPerMinute = (gameData.itemCount / gameData.duration) * 60

    if (gameData.gameMode === "timed") {
      timeUtilization = Math.min(gameData.duration / 120, 1) // 2 minutes = 120 seconds
    }

    if (gameData.timingData?.connectionTimes?.length) {
      averageTimePerConnection =
        gameData.timingData.connectionTimes.reduce((a, b) => a + b, 0) / gameData.timingData.connectionTimes.length
    }
  }

  // Collection & Discovery calculations
  const newItemsDiscovered = gameData.gameItems?.filter((item: GameItem) => item.isNewUnlock).length || 0
  const rediscoveredItems = gameData.itemCount - newItemsDiscovered

  const rarityBreakdown: Record<Rarity, number> = {
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  }

  const genresUsed: string[] = []
  const decadesUsed: string[] = []

  gameData.gameItems?.forEach((item: GameItem) => {
    if (item.rarity) {
      rarityBreakdown[item.rarity]++
    }

    // Extract genres and decades from item details
    if (item.type === "movie" && item.details) {
      if (item.details.genre_ids) {
        // Map genre IDs to genre names (you'd need a genre mapping)
        genresUsed.push(...item.details.genre_ids.map((id: number) => `genre_${id}`))
      }

      if (item.details.release_date) {
        const year = new Date(item.details.release_date).getFullYear()
        const decade = `${Math.floor(year / 10) * 10}s`
        decadesUsed.push(decade)
      }
    }
  })

  // Skill & Progression calculations
  const perfectGame = (gameData.strikes || 0) === 0 && gameData.gameEndReason === "completed"
  const comebackGame = (gameData.strikes || 0) >= 2 && gameData.gameEndReason === "completed"

  return {
    // Speed & Efficiency
    itemsPerMinute,
    timeUtilization,
    finalMinuteItems: gameData.timingData?.finalMinuteItems || 0,
    averageTimePerConnection,

    // Collection & Discovery
    newItemsDiscovered,
    rediscoveredItems,
    rarityBreakdown,
    genresUsed: [...new Set(genresUsed)], // Remove duplicates
    decadesUsed: [...new Set(decadesUsed)], // Remove duplicates

    // Skill & Progression
    gameEndReason: gameData.gameEndReason,
    strikes: gameData.strikes,
    perfectGame,
    comebackGame,
    personalBest: false, // Will be calculated when comparing to history

    // Engagement & Behavior
    sessionId,
    gameNumberInSession,
    timeSinceLastGame: lastGameTime ? Math.round((timestamp - lastGameTime) / (1000 * 60)) : undefined,
    playTimeHour,
    isWeekend,
  }
}

// Get game number in current session
async function getGameNumberInSession(sessionId: string): Promise<number> {
  try {
    const session = await kv.get<GameSession>(`session:${sessionId}`)
    return (session?.totalGames || 0) + 1
  } catch (error) {
    return 1
  }
}

// Update session tracking
async function updateSessionTracking(
  sessionId: string,
  userId: string,
  gameId: string,
  timestamp: number,
  duration: number,
): Promise<void> {
  try {
    const sessionKey = `session:${sessionId}`
    const existingSession = await kv.get<GameSession>(sessionKey)

    if (existingSession) {
      // Update existing session
      const updatedSession: GameSession = {
        ...existingSession,
        endTime: timestamp,
        gameIds: [...existingSession.gameIds, gameId],
        totalGames: existingSession.totalGames + 1,
        totalDuration: existingSession.totalDuration + duration,
      }
      await kv.set(sessionKey, updatedSession, { ex: 60 * 60 * 24 * 30 }) // Keep for 30 days
    } else {
      // Create new session
      const newSession: GameSession = {
        sessionId,
        userId,
        startTime: timestamp,
        endTime: timestamp,
        gameIds: [gameId],
        totalGames: 1,
        totalDuration: duration,
        averageScore: 0, // Will be calculated later
      }
      await kv.set(sessionKey, newSession, { ex: 60 * 60 * 24 * 30 })
    }
  } catch (error) {
    console.error("Error updating session tracking:", error)
  }
}

// Generate game ID (reuse from existing system)
async function generateGameId(): Promise<string> {
  try {
    const counter = await kv.incr("movie-game:game-counter")
    const timestamp = Date.now()
    return `game_${timestamp}_${counter}`
  } catch (error) {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
