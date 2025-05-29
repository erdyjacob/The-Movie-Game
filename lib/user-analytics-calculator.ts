import { kv } from "@vercel/kv"
import type { EnhancedGameRecord, UserAnalytics, GameSession, Rarity } from "./enhanced-game-tracking"

// Calculate comprehensive user analytics
export async function calculateUserAnalytics(userId: string): Promise<UserAnalytics | null> {
  try {
    console.log(`[ANALYTICS] Calculating analytics for user ${userId}`)

    // Get all enhanced game records for user
    const userGamesKey = `user-enhanced-games:${userId}`
    const gameIds = await kv.lrange(userGamesKey, 0, -1)

    if (!gameIds || gameIds.length === 0) {
      return getDefaultAnalytics()
    }

    // Fetch all game records
    const gameRecords: EnhancedGameRecord[] = []
    for (const gameId of gameIds) {
      try {
        const record = await kv.get<EnhancedGameRecord>(`enhanced-game:${gameId}`)
        if (record) {
          gameRecords.push(record)
        }
      } catch (error) {
        console.error(`Error fetching game record ${gameId}:`, error)
      }
    }

    if (gameRecords.length === 0) {
      return getDefaultAnalytics()
    }

    // Calculate analytics from game records
    const analytics = await computeAnalyticsFromRecords(userId, gameRecords)

    // Cache the calculated analytics
    const analyticsKey = `user-analytics:${userId}`
    await kv.set(analyticsKey, analytics, { ex: 60 * 60 * 24 }) // Cache for 24 hours

    console.log(`[ANALYTICS] Calculated analytics for ${gameRecords.length} games`)
    return analytics
  } catch (error) {
    console.error("Error calculating user analytics:", error)
    return null
  }
}

// Compute analytics from game records
async function computeAnalyticsFromRecords(userId: string, records: EnhancedGameRecord[]): Promise<UserAnalytics> {
  const now = Date.now()
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000
  const recentRecords = records.filter((r) => r.timestamp > oneWeekAgo)

  // Collection & Discovery
  const collectionVelocity = calculateCollectionVelocity(recentRecords)
  const rarityLuck = calculateRarityLuck(records)
  const completionRate = calculateCompletionRate(records)
  const rediscoveryRate = calculateRediscoveryRate(records)
  const favoriteDecades = calculateFavoriteDecades(records)
  const favoriteGenres = calculateFavoriteGenres(records)
  const connectionStyle = calculateConnectionStyle(records)

  // Engagement & Behavior
  const sessionAnalytics = await calculateSessionAnalytics(userId)

  // Speed & Efficiency
  const speedAnalytics = calculateSpeedAnalytics(records)

  // Skill & Progression
  const skillAnalytics = calculateSkillAnalytics(records)

  return {
    // Collection & Discovery
    collectionVelocity,
    rarityLuck,
    completionRate,
    rediscoveryRate,
    favoriteDecades,
    favoriteGenres,
    connectionStyle,

    // Engagement & Behavior
    ...sessionAnalytics,

    // Speed & Efficiency
    ...speedAnalytics,

    // Skill & Progression
    ...skillAnalytics,

    // Metadata
    lastCalculated: new Date().toISOString(),
    totalGamesAnalyzed: records.length,
  }
}

// Collection & Discovery calculations
function calculateCollectionVelocity(recentRecords: EnhancedGameRecord[]): number {
  const totalNewItems = recentRecords.reduce((sum, record) => sum + record.newItemsDiscovered, 0)
  return totalNewItems // New items per week
}

function calculateRarityLuck(records: EnhancedGameRecord[]): number {
  const totalLegendaries = records.reduce((sum, record) => sum + (record.rarityBreakdown?.legendary || 0), 0)
  const totalItems = records.reduce((sum, record) => sum + record.itemCount, 0)

  const actualLegendaryRate = totalItems > 0 ? totalLegendaries / totalItems : 0
  const expectedLegendaryRate = 0.01 // 1% expected legendary rate

  return actualLegendaryRate / expectedLegendaryRate // >1 = lucky, <1 = unlucky
}

function calculateCompletionRate(records: EnhancedGameRecord[]): number {
  const completedGames = records.filter((r) => r.gameEndReason === "completed").length
  return records.length > 0 ? completedGames / records.length : 0
}

function calculateRediscoveryRate(records: EnhancedGameRecord[]): number {
  const totalRediscovered = records.reduce((sum, record) => sum + record.rediscoveredItems, 0)
  const totalItems = records.reduce((sum, record) => sum + record.itemCount, 0)

  return totalItems > 0 ? totalRediscovered / totalItems : 0
}

function calculateFavoriteDecades(records: EnhancedGameRecord[]): string[] {
  const decadeCounts: Record<string, number> = {}

  records.forEach((record) => {
    record.decadesUsed?.forEach((decade) => {
      decadeCounts[decade] = (decadeCounts[decade] || 0) + 1
    })
  })

  return Object.entries(decadeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([decade]) => decade)
}

function calculateFavoriteGenres(records: EnhancedGameRecord[]): string[] {
  const genreCounts: Record<string, number> = {}

  records.forEach((record) => {
    record.genresUsed?.forEach((genre) => {
      genreCounts[genre] = (genreCounts[genre] || 0) + 1
    })
  })

  return Object.entries(genreCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([genre]) => genre)
}

function calculateConnectionStyle(records: EnhancedGameRecord[]): "broad" | "deep" {
  // Broad: Many different items used once
  // Deep: Fewer items used multiple times

  const totalUniqueItems = new Set(records.flatMap((r) => r.genresUsed || [])).size

  const totalItemUsages = records.reduce((sum, r) => sum + r.itemCount, 0)
  const averageUsagePerItem = totalUniqueItems > 0 ? totalItemUsages / totalUniqueItems : 0

  return averageUsagePerItem > 2 ? "deep" : "broad"
}

// Session analytics
async function calculateSessionAnalytics(userId: string): Promise<Partial<UserAnalytics>> {
  try {
    // Get all sessions for user
    const sessionKeys = await kv.keys(`session:session_${userId}_*`)
    const sessions: GameSession[] = []

    for (const key of sessionKeys) {
      const session = await kv.get<GameSession>(key)
      if (session) {
        sessions.push(session)
      }
    }

    if (sessions.length === 0) {
      return {
        averageSessionLength: 0,
        peakPlayTime: "12",
        weekendWarrior: false,
        bingeSessions: 0,
        totalSessions: 0,
      }
    }

    // Calculate session metrics
    const totalSessionTime = sessions.reduce((sum, s) => sum + s.totalDuration, 0)
    const averageSessionLength = totalSessionTime / sessions.length / 60 // Convert to minutes

    const bingeSessions = sessions.filter((s) => s.totalGames >= 3).length

    // Peak play time calculation would need game records with timestamps
    const peakPlayTime = "12" // Placeholder

    const weekendWarrior = false // Placeholder - would need to analyze play patterns

    return {
      averageSessionLength,
      peakPlayTime,
      weekendWarrior,
      bingeSessions,
      totalSessions: sessions.length,
    }
  } catch (error) {
    console.error("Error calculating session analytics:", error)
    return {
      averageSessionLength: 0,
      peakPlayTime: "12",
      weekendWarrior: false,
      bingeSessions: 0,
      totalSessions: 0,
    }
  }
}

// Speed analytics
function calculateSpeedAnalytics(records: EnhancedGameRecord[]): Partial<UserAnalytics> {
  const timedGames = records.filter((r) => r.gameMode === "timed" && r.itemsPerMinute)

  const bestItemsPerMinute = timedGames.length > 0 ? Math.max(...timedGames.map((r) => r.itemsPerMinute || 0)) : 0

  const averageTimeUtilization =
    timedGames.length > 0 ? timedGames.reduce((sum, r) => sum + (r.timeUtilization || 0), 0) / timedGames.length : 0

  const fastestGameDuration = records
    .filter((r) => r.duration && r.gameEndReason === "completed")
    .reduce((min, r) => Math.min(min, r.duration || Number.POSITIVE_INFINITY), Number.POSITIVE_INFINITY)

  const longestGameItems = Math.max(...records.map((r) => r.itemCount))

  const averageConnectionTime = records
    .filter((r) => r.averageTimePerConnection)
    .reduce((sum, r, _, arr) => sum + (r.averageTimePerConnection || 0) / arr.length, 0)

  return {
    bestItemsPerMinute,
    averageTimeUtilization,
    fastestGameDuration: fastestGameDuration === Number.POSITIVE_INFINITY ? 0 : fastestGameDuration,
    longestGameItems,
    averageConnectionTime,
  }
}

// Skill analytics
function calculateSkillAnalytics(records: EnhancedGameRecord[]): Partial<UserAnalytics> {
  // Improvement rate (last 10 games vs previous 10)
  const recentGames = records.slice(0, 10)
  const previousGames = records.slice(10, 20)

  const recentAverage =
    recentGames.length > 0 ? recentGames.reduce((sum, r) => sum + r.score, 0) / recentGames.length : 0

  const previousAverage =
    previousGames.length > 0 ? previousGames.reduce((sum, r) => sum + r.score, 0) / previousGames.length : recentAverage

  const improvementRate = previousAverage > 0 ? (recentAverage - previousAverage) / previousAverage : 0

  // Consistency score (standard deviation of recent scores)
  const scores = recentGames.map((r) => r.score)
  const mean = recentAverage
  const variance =
    scores.length > 1 ? scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length : 0
  const consistencyScore = Math.sqrt(variance)

  // Other metrics
  const perfectGames = records.filter((r) => r.perfectGame).length
  const comebackGames = records.filter((r) => r.comebackGame).length

  // Personal best streak
  let personalBestStreak = 0
  let currentBest = 0
  for (const record of records) {
    if (record.score > currentBest) {
      currentBest = record.score
      personalBestStreak = 0
    } else {
      personalBestStreak++
    }
  }

  // Rarity discovery rate
  const rarityDiscoveryRate: Record<Rarity, number> = {
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
  }

  const totalGames = records.length
  if (totalGames > 0) {
    Object.keys(rarityDiscoveryRate).forEach((rarity) => {
      const totalFound = records.reduce((sum, r) => sum + (r.rarityBreakdown?.[rarity as Rarity] || 0), 0)
      rarityDiscoveryRate[rarity as Rarity] = totalFound / totalGames
    })
  }

  return {
    improvementRate,
    consistencyScore,
    personalBestStreak,
    difficultyProgression: [], // Would need to track difficulty changes over time
    rarityDiscoveryRate,
    perfectGames,
    comebackGames,
  }
}

// Default analytics for new users
function getDefaultAnalytics(): UserAnalytics {
  return {
    collectionVelocity: 0,
    rarityLuck: 1,
    completionRate: 0,
    rediscoveryRate: 0,
    favoriteDecades: [],
    favoriteGenres: [],
    connectionStyle: "broad",
    averageSessionLength: 0,
    peakPlayTime: "12",
    weekendWarrior: false,
    bingeSessions: 0,
    totalSessions: 0,
    bestItemsPerMinute: 0,
    averageTimeUtilization: 0,
    fastestGameDuration: 0,
    longestGameItems: 0,
    averageConnectionTime: 0,
    improvementRate: 0,
    consistencyScore: 0,
    personalBestStreak: 0,
    difficultyProgression: [],
    rarityDiscoveryRate: {
      common: 0,
      uncommon: 0,
      rare: 0,
      epic: 0,
      legendary: 0,
    },
    perfectGames: 0,
    comebackGames: 0,
    lastCalculated: new Date().toISOString(),
    totalGamesAnalyzed: 0,
  }
}

// Get cached analytics or calculate if needed
export async function getUserAnalytics(userId: string): Promise<UserAnalytics | null> {
  try {
    // Try to get cached analytics first
    const analyticsKey = `user-analytics:${userId}`
    const cachedAnalytics = await kv.get<UserAnalytics>(analyticsKey)

    if (cachedAnalytics) {
      // Check if cache is still fresh (less than 24 hours old)
      const cacheAge = Date.now() - new Date(cachedAnalytics.lastCalculated).getTime()
      const maxCacheAge = 24 * 60 * 60 * 1000 // 24 hours

      if (cacheAge < maxCacheAge) {
        return cachedAnalytics
      }
    }

    // Calculate fresh analytics
    return await calculateUserAnalytics(userId)
  } catch (error) {
    console.error("Error getting user analytics:", error)
    return null
  }
}
