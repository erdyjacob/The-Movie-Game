import { kv } from "@vercel/kv"
import type { AccountScore, PlayerHistory, GameMode } from "./types"
import { updateLeaderboardWithTotalPoints } from "./leaderboard"
import { recordGameParticipation, getUserGamesPlayedCount } from "./game-tracking"
import { calculateRank } from "./rank-calculator"

// At the top of the file, add a logging utility function:
function logScoreAction(action: string, userId?: string, username?: string, details?: any) {
  console.log(
    `[SCORE ${action}]`,
    userId ? `userId: ${userId}` : "",
    username ? `username: ${username}` : "",
    details ? JSON.stringify(details) : "",
  )
}

// Calculate score from player history
export async function calculateScoreFromHistory(
  userId: string,
  username: string,
  playerHistory: PlayerHistory,
): Promise<AccountScore | null> {
  try {
    if (!playerHistory || !userId || !username) {
      console.error("Missing required data for score calculation")
      return null
    }

    const movies = Array.isArray(playerHistory.movies) ? playerHistory.movies : []
    const actors = Array.isArray(playerHistory.actors) ? playerHistory.actors : []

    // Count items by rarity
    let legendaryCount = 0
    let epicCount = 0
    let rareCount = 0
    let uncommonCount = 0
    let commonCount = 0

    // Process movies
    movies.forEach((movie) => {
      if (!movie.rarity) return

      switch (movie.rarity) {
        case "legendary":
          legendaryCount++
          break
        case "epic":
          epicCount++
          break
        case "rare":
          rareCount++
          break
        case "uncommon":
          uncommonCount++
          break
        case "common":
          commonCount++
          break
      }
    })

    // Process actors
    actors.forEach((actor) => {
      if (!actor.rarity) return

      switch (actor.rarity) {
        case "legendary":
          legendaryCount++
          break
        case "epic":
          epicCount++
          break
        case "rare":
          rareCount++
          break
        case "uncommon":
          uncommonCount++
          break
        case "common":
          commonCount++
          break
      }
    })

    // Calculate points
    const points = legendaryCount * 100 + epicCount * 50 + rareCount * 25 + uncommonCount * 10 + commonCount * 1

    // Get daily challenges completed
    const dailyChallengesKey = `user:${userId}:daily-challenges`
    const dailyChallenges = (await kv.get(dailyChallengesKey)) || {}
    const dailyChallengesCompleted = Object.keys(dailyChallenges).length

    // Add bonus points for daily challenges
    const totalPoints = points + dailyChallengesCompleted * 50

    // Determine rank using the centralized rank calculator
    const rank = calculateRank(totalPoints)

    // Calculate percentages
    const TOTAL_COLLECTIBLE_MOVIES = 10000
    const TOTAL_COLLECTIBLE_ACTORS = 5000

    const moviesPercentage = (movies.length / TOTAL_COLLECTIBLE_MOVIES) * 100
    const actorsPercentage = (actors.length / TOTAL_COLLECTIBLE_ACTORS) * 100
    const totalPercentage =
      ((movies.length + actors.length) / (TOTAL_COLLECTIBLE_MOVIES + TOTAL_COLLECTIBLE_ACTORS)) * 100

    // Create account score object
    const accountScore: AccountScore = {
      rank,
      points: totalPoints,
      legendaryCount,
      epicCount,
      rareCount,
      uncommonCount,
      commonCount,
      totalItems: movies.length + actors.length,
      dailyChallengesCompleted,
      moviesPercentage,
      actorsPercentage,
      totalPercentage,
      moviesCount: movies.length,
      actorsCount: actors.length,
    }

    return accountScore
  } catch (error) {
    console.error("Error calculating score from history:", error)
    return null
  }
}

// Update the updateUserScore function to include logging:
export async function updateUserScore(userId: string, username: string, accountScore: AccountScore): Promise<boolean> {
  try {
    logScoreAction("UPDATE_START", userId, username, { score: accountScore.points })

    if (!userId || !username || !accountScore) {
      logScoreAction("UPDATE_ERROR", userId, username, { error: "Missing required data" })
      console.error("Missing required data for score update")
      return false
    }

    // Use a transaction to ensure all operations succeed or fail together
    const pipeline = kv.pipeline()

    // Store the score in dedicated key
    pipeline.set(`user:${userId}:score`, accountScore.points)

    // Store the full account score
    pipeline.set(`user:${userId}:accountScore`, accountScore)

    // Update the user object
    const userData = await kv.get(`user:${userId}`)
    if (userData && typeof userData === "object") {
      pipeline.set(`user:${userId}`, {
        ...userData,
        score: accountScore.points,
        accountScore,
        lastScoreUpdate: new Date().toISOString(),
      })
    }

    // Execute all Redis operations
    await pipeline.exec()

    // Update the leaderboard - pass userId to ensure proper identification
    await updateLeaderboardWithTotalPoints(username, accountScore, userId)

    logScoreAction("UPDATE_SUCCESS", userId, username, { score: accountScore.points })
    return true
  } catch (error) {
    logScoreAction("UPDATE_ERROR", userId, username, { error: String(error) })
    console.error("Error updating user score:", error)
    return false
  }
}

// Enhanced game completion recording with game tracking
export async function recordGameCompletion(
  userId: string,
  username: string,
  score: number,
  itemCount: number,
  gameMode: GameMode,
  difficulty: string,
  duration?: number,
): Promise<boolean> {
  try {
    logScoreAction("RECORD_GAME", userId, username, { score, itemCount, gameMode, difficulty })

    if (!userId || !username) {
      logScoreAction("RECORD_GAME_ERROR", userId, username, { error: "Missing user information" })
      return false
    }

    // Record in the new game tracking system
    const gameId = await recordGameParticipation(
      userId,
      username,
      score,
      itemCount,
      gameMode as GameMode,
      difficulty as any, // Type assertion for difficulty
      duration,
    )

    if (!gameId) {
      logScoreAction("RECORD_GAME_ERROR", userId, username, { error: "Failed to record game participation" })
      return false
    }

    // Also store in the legacy system for backward compatibility
    const gameHistoryKey = `user:${userId}:games`
    const existingGames = (await kv.lrange(gameHistoryKey, 0, -1)) || []

    const gameRecord = {
      gameId,
      timestamp: Date.now(),
      score,
      itemCount,
      gameMode,
      difficulty,
      duration,
    }

    await kv.lpush(gameHistoryKey, JSON.stringify(gameRecord))

    // Trim the list to keep only the most recent 100 games
    if (existingGames.length >= 100) {
      await kv.ltrim(gameHistoryKey, 0, 99)
    }

    logScoreAction("RECORD_GAME_SUCCESS", userId, username, { score, gameId })
    return true
  } catch (error) {
    logScoreAction("RECORD_GAME_ERROR", userId, username, { error: String(error) })
    console.error("Error recording game completion:", error)
    return false
  }
}

// Update the syncPlayerHistoryAndUpdateScore function to use enhanced game tracking
export async function syncPlayerHistoryAndUpdateScore(
  userId: string,
  username: string,
  playerHistory: PlayerHistory,
  gameScore?: number,
  gameMode?: GameMode,
  difficulty?: string,
  itemCount?: number,
  duration?: number,
): Promise<boolean> {
  try {
    logScoreAction("SYNC_HISTORY_START", userId, username)

    if (!userId || !username || !playerHistory) {
      logScoreAction("SYNC_HISTORY_ERROR", userId, username, { error: "Missing required data" })
      console.error("Missing required data for history sync")
      return false
    }

    // Store player history on server
    await kv.set(`player:${userId}:history`, playerHistory)
    logScoreAction("HISTORY_STORED", userId, username, {
      moviesCount: playerHistory.movies?.length,
      actorsCount: playerHistory.actors?.length,
    })

    // If a game score was provided, record the completed game
    if (gameScore !== undefined && gameMode && difficulty) {
      await recordGameCompletion(userId, username, gameScore, itemCount || 0, gameMode, difficulty, duration)
    }

    // Calculate score from history
    const accountScore = await calculateScoreFromHistory(userId, username, playerHistory)
    if (!accountScore) {
      logScoreAction("SYNC_HISTORY_ERROR", userId, username, { error: "Failed to calculate score" })
      return false
    }

    logScoreAction("SCORE_CALCULATED", userId, username, { score: accountScore.points, rank: accountScore.rank })

    // Update user score in all places
    return await updateUserScore(userId, username, accountScore)
  } catch (error) {
    logScoreAction("SYNC_HISTORY_ERROR", userId, username, { error: String(error) })
    console.error("Error syncing player history and updating score:", error)
    return false
  }
}

// Get comprehensive user statistics including games played
export async function getUserComprehensiveStats(userId: string): Promise<{
  accountScore: AccountScore | null
  gamesPlayed: number
  gameStats: any
} | null> {
  try {
    if (!userId) return null

    // Get account score
    const accountScore = await kv.get<AccountScore>(`user:${userId}:accountScore`)

    // Get games played count
    const gamesPlayed = await getUserGamesPlayedCount(userId)

    // Get detailed game stats
    const gameStats = await kv.get(`user-stats:${userId}`)

    return {
      accountScore,
      gamesPlayed,
      gameStats,
    }
  } catch (error) {
    console.error("Error getting comprehensive user stats:", error)
    return null
  }
}
