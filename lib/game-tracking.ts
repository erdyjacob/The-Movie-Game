import { kv } from "@vercel/kv"
import type { GameMode, Difficulty } from "./types"

// Keys for game tracking
const GAME_COUNTER_KEY = "movie-game:game-counter"
const USER_GAMES_KEY_PREFIX = "user-games:"
const GLOBAL_GAMES_KEY = "movie-game:all-games"

// Game participation record
export interface GameRecord {
  gameId: string
  userId: string
  username: string
  timestamp: number
  score: number
  itemCount: number
  gameMode: GameMode
  difficulty: Difficulty
  duration?: number // Game duration in seconds
}

// Game statistics for a user
export interface UserGameStats {
  totalGames: number
  totalScore: number
  averageScore: number
  bestScore: number
  lastPlayed: number
  gamesByMode: Record<GameMode, number>
  gamesByDifficulty: Record<Difficulty, number>
}

// Logging utility
function logGameTracking(action: string, userId?: string, username?: string, details?: any) {
  console.log(
    `[GAME_TRACKING ${action}]`,
    userId ? `userId: ${userId}` : "",
    username ? `username: ${username}` : "",
    details ? JSON.stringify(details) : "",
  )
}

// Generate a unique game ID
export async function generateGameId(): Promise<string> {
  try {
    const counter = await kv.incr(GAME_COUNTER_KEY)
    const timestamp = Date.now()
    return `game_${timestamp}_${counter}`
  } catch (error) {
    console.error("Error generating game ID:", error)
    // Fallback to timestamp-based ID
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// Record a game participation
export async function recordGameParticipation(
  userId: string,
  username: string,
  score: number,
  itemCount: number,
  gameMode: GameMode,
  difficulty: Difficulty,
  duration?: number,
): Promise<string | null> {
  try {
    logGameTracking("RECORD_START", userId, username, { score, gameMode, difficulty })

    if (!userId || !username) {
      logGameTracking("RECORD_ERROR", userId, username, { error: "Missing user information" })
      return null
    }

    // Generate unique game ID
    const gameId = await generateGameId()
    const timestamp = Date.now()

    // Create game record
    const gameRecord: GameRecord = {
      gameId,
      userId,
      username,
      timestamp,
      score,
      itemCount,
      gameMode,
      difficulty,
      duration,
    }

    // Use pipeline for atomic operations
    const pipeline = kv.pipeline()

    // Store individual game record
    pipeline.set(`game:${gameId}`, gameRecord, { ex: 60 * 60 * 24 * 365 }) // Keep for 1 year

    // Add to user's game list
    const userGamesKey = `${USER_GAMES_KEY_PREFIX}${userId}`
    pipeline.lpush(userGamesKey, gameId)
    pipeline.expire(userGamesKey, 60 * 60 * 24 * 365) // Keep for 1 year

    // Add to global games list (for analytics)
    pipeline.lpush(GLOBAL_GAMES_KEY, gameId)
    pipeline.ltrim(GLOBAL_GAMES_KEY, 0, 9999) // Keep last 10k games

    // Update user's game count cache
    const userStatsKey = `user-stats:${userId}`
    const existingStats = await kv.get<UserGameStats>(userStatsKey)

    const newStats: UserGameStats = {
      totalGames: (existingStats?.totalGames || 0) + 1,
      totalScore: (existingStats?.totalScore || 0) + score,
      averageScore: 0, // Will be calculated below
      bestScore: Math.max(existingStats?.bestScore || 0, score),
      lastPlayed: timestamp,
      gamesByMode: {
        ...existingStats?.gamesByMode,
        [gameMode]: (existingStats?.gamesByMode?.[gameMode] || 0) + 1,
      } as Record<GameMode, number>,
      gamesByDifficulty: {
        ...existingStats?.gamesByDifficulty,
        [difficulty]: (existingStats?.gamesByDifficulty?.[difficulty] || 0) + 1,
      } as Record<Difficulty, number>,
    }

    // Calculate average score
    newStats.averageScore = Math.round(newStats.totalScore / newStats.totalGames)

    pipeline.set(userStatsKey, newStats, { ex: 60 * 60 * 24 * 30 }) // Keep for 30 days

    // Execute all operations
    await pipeline.exec()

    logGameTracking("RECORD_SUCCESS", userId, username, { gameId, totalGames: newStats.totalGames })
    return gameId
  } catch (error) {
    logGameTracking("RECORD_ERROR", userId, username, { error: String(error) })
    console.error("Error recording game participation:", error)
    return null
  }
}

// Get user's game statistics
export async function getUserGameStats(userId: string): Promise<UserGameStats | null> {
  try {
    if (!userId) return null

    const userStatsKey = `user-stats:${userId}`
    const cachedStats = await kv.get<UserGameStats>(userStatsKey)

    if (cachedStats) {
      return cachedStats
    }

    // If no cached stats, rebuild from game records
    return await rebuildUserGameStats(userId)
  } catch (error) {
    console.error("Error getting user game stats:", error)
    return null
  }
}

// Rebuild user game statistics from historical data
export async function rebuildUserGameStats(userId: string): Promise<UserGameStats | null> {
  try {
    logGameTracking("REBUILD_STATS_START", userId)

    const userGamesKey = `${USER_GAMES_KEY_PREFIX}${userId}`
    const gameIds = await kv.lrange(userGamesKey, 0, -1)

    if (!gameIds || gameIds.length === 0) {
      logGameTracking("REBUILD_STATS_NO_GAMES", userId)
      return {
        totalGames: 0,
        totalScore: 0,
        averageScore: 0,
        bestScore: 0,
        lastPlayed: 0,
        gamesByMode: {} as Record<GameMode, number>,
        gamesByDifficulty: {} as Record<Difficulty, number>,
      }
    }

    // Fetch all game records
    const gameRecords: GameRecord[] = []
    for (const gameId of gameIds) {
      try {
        const record = await kv.get<GameRecord>(`game:${gameId}`)
        if (record) {
          gameRecords.push(record)
        }
      } catch (error) {
        console.error(`Error fetching game record ${gameId}:`, error)
      }
    }

    // Calculate statistics
    const stats: UserGameStats = {
      totalGames: gameRecords.length,
      totalScore: gameRecords.reduce((sum, game) => sum + game.score, 0),
      averageScore: 0,
      bestScore: gameRecords.reduce((max, game) => Math.max(max, game.score), 0),
      lastPlayed: gameRecords.reduce((latest, game) => Math.max(latest, game.timestamp), 0),
      gamesByMode: {} as Record<GameMode, number>,
      gamesByDifficulty: {} as Record<Difficulty, number>,
    }

    // Calculate average
    stats.averageScore = stats.totalGames > 0 ? Math.round(stats.totalScore / stats.totalGames) : 0

    // Count by mode and difficulty
    gameRecords.forEach((game) => {
      stats.gamesByMode[game.gameMode] = (stats.gamesByMode[game.gameMode] || 0) + 1
      stats.gamesByDifficulty[game.difficulty] = (stats.gamesByDifficulty[game.difficulty] || 0) + 1
    })

    // Cache the rebuilt stats
    const userStatsKey = `user-stats:${userId}`
    await kv.set(userStatsKey, stats, { ex: 60 * 60 * 24 * 30 })

    logGameTracking("REBUILD_STATS_SUCCESS", userId, undefined, { totalGames: stats.totalGames })
    return stats
  } catch (error) {
    logGameTracking("REBUILD_STATS_ERROR", userId, undefined, { error: String(error) })
    console.error("Error rebuilding user game stats:", error)
    return null
  }
}

// Get games played count for a user (optimized for leaderboard)
export async function getUserGamesPlayedCount(userId: string): Promise<number> {
  try {
    if (!userId) return 0

    // Try to get from cached stats first
    const stats = await getUserGameStats(userId)
    if (stats) {
      return stats.totalGames
    }

    // Fallback: count games directly
    const userGamesKey = `${USER_GAMES_KEY_PREFIX}${userId}`
    const gameCount = await kv.llen(userGamesKey)
    return gameCount || 0
  } catch (error) {
    console.error("Error getting user games played count:", error)
    return 0
  }
}

// Synchronize games played count for all users (for data migration/repair)
export async function synchronizeAllGamesPlayedCounts(): Promise<{
  processed: number
  updated: number
  errors: number
}> {
  try {
    logGameTracking("SYNC_ALL_START")

    let processed = 0
    let updated = 0
    let errors = 0

    // Get all user game keys
    const pattern = `${USER_GAMES_KEY_PREFIX}*`
    const keys = await kv.keys(pattern)

    for (const key of keys) {
      try {
        processed++
        const userId = key.replace(USER_GAMES_KEY_PREFIX, "")

        // Rebuild stats for this user
        const stats = await rebuildUserGameStats(userId)
        if (stats) {
          updated++
          logGameTracking("SYNC_USER_SUCCESS", userId, undefined, { gamesPlayed: stats.totalGames })
        }
      } catch (error) {
        errors++
        console.error(`Error syncing user ${key}:`, error)
      }
    }

    logGameTracking("SYNC_ALL_COMPLETE", undefined, undefined, { processed, updated, errors })
    return { processed, updated, errors }
  } catch (error) {
    logGameTracking("SYNC_ALL_ERROR", undefined, undefined, { error: String(error) })
    console.error("Error synchronizing all games played counts:", error)
    return { processed: 0, updated: 0, errors: 1 }
  }
}

// Clean up old game records (maintenance function)
export async function cleanupOldGameRecords(daysToKeep = 365): Promise<number> {
  try {
    logGameTracking("CLEANUP_START", undefined, undefined, { daysToKeep })

    const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000
    let deletedCount = 0

    // Get recent game IDs from global list
    const recentGameIds = await kv.lrange(GLOBAL_GAMES_KEY, 0, -1)

    for (const gameId of recentGameIds) {
      try {
        const gameRecord = await kv.get<GameRecord>(`game:${gameId}`)
        if (gameRecord && gameRecord.timestamp < cutoffTime) {
          await kv.del(`game:${gameId}`)
          deletedCount++
        }
      } catch (error) {
        console.error(`Error processing game record ${gameId}:`, error)
      }
    }

    logGameTracking("CLEANUP_COMPLETE", undefined, undefined, { deletedCount })
    return deletedCount
  } catch (error) {
    logGameTracking("CLEANUP_ERROR", undefined, undefined, { error: String(error) })
    console.error("Error cleaning up old game records:", error)
    return 0
  }
}
