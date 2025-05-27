import { kv } from "@vercel/kv"
import type { GameRecord } from "./game-tracking"
import type { GameMode, Difficulty } from "./types"

// Analytics data structures
export interface GameParticipationTrend {
  date: string
  totalGames: number
  uniquePlayers: number
  averageScore: number
}

export interface PlayerActivityMetrics {
  totalPlayers: number
  activePlayers: number // Players who played in the last 7 days
  averageGamesPerPlayer: number
  medianGamesPerPlayer: number
  topPlayers: Array<{
    userId: string
    username: string
    totalGames: number
    averageScore: number
    lastPlayed: number
  }>
}

export interface PeakParticipationPeriod {
  period: string
  hour: number
  dayOfWeek: number
  gamesCount: number
  playersCount: number
}

export interface GameModeAnalytics {
  mode: GameMode
  totalGames: number
  uniquePlayers: number
  averageScore: number
  percentage: number
}

export interface DifficultyAnalytics {
  difficulty: Difficulty
  totalGames: number
  uniquePlayers: number
  averageScore: number
  percentage: number
}

export interface AnalyticsFilters {
  startDate?: number
  endDate?: number
  playerIds?: string[]
  gameMode?: GameMode
  difficulty?: Difficulty
}

export interface AnalyticsDashboardData {
  overview: {
    totalGames: number
    totalPlayers: number
    averageGamesPerPlayer: number
    totalScore: number
  }
  trends: GameParticipationTrend[]
  playerActivity: PlayerActivityMetrics
  peakPeriods: PeakParticipationPeriod[]
  gameModeBreakdown: GameModeAnalytics[]
  difficultyBreakdown: DifficultyAnalytics[]
  recentActivity: GameRecord[]
}

// Logging utility
function logAnalytics(action: string, details?: any) {
  console.log(`[ANALYTICS ${action}]`, details ? JSON.stringify(details) : "")
}

// Get all game records with optional filtering
export async function getFilteredGameRecords(filters: AnalyticsFilters = {}): Promise<GameRecord[]> {
  try {
    logAnalytics("GET_FILTERED_RECORDS_START", filters)

    // Get all game IDs from global list
    const allGameIds = await kv.lrange("movie-game:all-games", 0, -1)
    const gameRecords: GameRecord[] = []

    // Fetch game records in batches for efficiency
    const batchSize = 100
    for (let i = 0; i < allGameIds.length; i += batchSize) {
      const batch = allGameIds.slice(i, i + batchSize)
      const batchPromises = batch.map(async (gameId) => {
        try {
          const record = await kv.get<GameRecord>(`game:${gameId}`)
          return record
        } catch (error) {
          console.error(`Error fetching game record ${gameId}:`, error)
          return null
        }
      })

      const batchResults = await Promise.all(batchPromises)
      gameRecords.push(...batchResults.filter((record): record is GameRecord => record !== null))
    }

    // Apply filters
    let filteredRecords = gameRecords

    if (filters.startDate) {
      filteredRecords = filteredRecords.filter((record) => record.timestamp >= filters.startDate!)
    }

    if (filters.endDate) {
      filteredRecords = filteredRecords.filter((record) => record.timestamp <= filters.endDate!)
    }

    if (filters.playerIds && filters.playerIds.length > 0) {
      filteredRecords = filteredRecords.filter((record) => filters.playerIds!.includes(record.userId))
    }

    if (filters.gameMode) {
      filteredRecords = filteredRecords.filter((record) => record.gameMode === filters.gameMode)
    }

    if (filters.difficulty) {
      filteredRecords = filteredRecords.filter((record) => record.difficulty === filters.difficulty)
    }

    logAnalytics("GET_FILTERED_RECORDS_SUCCESS", {
      totalRecords: gameRecords.length,
      filteredRecords: filteredRecords.length,
    })

    return filteredRecords
  } catch (error) {
    logAnalytics("GET_FILTERED_RECORDS_ERROR", { error: String(error) })
    console.error("Error getting filtered game records:", error)
    return []
  }
}

// Calculate game participation trends over time
export async function calculateParticipationTrends(
  records: GameRecord[],
  intervalDays = 1,
): Promise<GameParticipationTrend[]> {
  try {
    logAnalytics("CALCULATE_TRENDS_START", { recordCount: records.length, intervalDays })

    if (records.length === 0) return []

    // Group records by date
    const dateGroups = new Map<string, GameRecord[]>()

    records.forEach((record) => {
      const date = new Date(record.timestamp)
      const dateKey = date.toISOString().split("T")[0] // YYYY-MM-DD format

      if (!dateGroups.has(dateKey)) {
        dateGroups.set(dateKey, [])
      }
      dateGroups.get(dateKey)!.push(record)
    })

    // Calculate trends for each date
    const trends: GameParticipationTrend[] = []

    for (const [date, dayRecords] of dateGroups.entries()) {
      const uniquePlayers = new Set(dayRecords.map((r) => r.userId)).size
      const totalGames = dayRecords.length
      const averageScore = dayRecords.reduce((sum, r) => sum + r.score, 0) / totalGames

      trends.push({
        date,
        totalGames,
        uniquePlayers,
        averageScore: Math.round(averageScore),
      })
    }

    // Sort by date
    trends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    logAnalytics("CALCULATE_TRENDS_SUCCESS", { trendsCount: trends.length })
    return trends
  } catch (error) {
    logAnalytics("CALCULATE_TRENDS_ERROR", { error: String(error) })
    console.error("Error calculating participation trends:", error)
    return []
  }
}

// Calculate player activity metrics
export async function calculatePlayerActivityMetrics(records: GameRecord[]): Promise<PlayerActivityMetrics> {
  try {
    logAnalytics("CALCULATE_PLAYER_ACTIVITY_START", { recordCount: records.length })

    if (records.length === 0) {
      return {
        totalPlayers: 0,
        activePlayers: 0,
        averageGamesPerPlayer: 0,
        medianGamesPerPlayer: 0,
        topPlayers: [],
      }
    }

    // Group by player
    const playerStats = new Map<string, { games: GameRecord[]; totalScore: number }>()

    records.forEach((record) => {
      if (!playerStats.has(record.userId)) {
        playerStats.set(record.userId, { games: [], totalScore: 0 })
      }
      const stats = playerStats.get(record.userId)!
      stats.games.push(record)
      stats.totalScore += record.score
    })

    // Calculate metrics
    const totalPlayers = playerStats.size
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

    let activePlayers = 0
    const gamesPerPlayer: number[] = []
    const topPlayersData: Array<{
      userId: string
      username: string
      totalGames: number
      averageScore: number
      lastPlayed: number
    }> = []

    for (const [userId, stats] of playerStats.entries()) {
      const totalGames = stats.games.length
      const lastPlayed = Math.max(...stats.games.map((g) => g.timestamp))
      const averageScore = Math.round(stats.totalScore / totalGames)

      gamesPerPlayer.push(totalGames)

      if (lastPlayed >= sevenDaysAgo) {
        activePlayers++
      }

      topPlayersData.push({
        userId,
        username: stats.games[0].username,
        totalGames,
        averageScore,
        lastPlayed,
      })
    }

    // Sort and get top players
    topPlayersData.sort((a, b) => b.totalGames - a.totalGames)
    const topPlayers = topPlayersData.slice(0, 10)

    // Calculate averages
    const averageGamesPerPlayer = gamesPerPlayer.reduce((sum, count) => sum + count, 0) / totalPlayers

    // Calculate median
    gamesPerPlayer.sort((a, b) => a - b)
    const medianGamesPerPlayer =
      gamesPerPlayer.length % 2 === 0
        ? (gamesPerPlayer[gamesPerPlayer.length / 2 - 1] + gamesPerPlayer[gamesPerPlayer.length / 2]) / 2
        : gamesPerPlayer[Math.floor(gamesPerPlayer.length / 2)]

    const metrics: PlayerActivityMetrics = {
      totalPlayers,
      activePlayers,
      averageGamesPerPlayer: Math.round(averageGamesPerPlayer * 100) / 100,
      medianGamesPerPlayer: Math.round(medianGamesPerPlayer * 100) / 100,
      topPlayers,
    }

    logAnalytics("CALCULATE_PLAYER_ACTIVITY_SUCCESS", metrics)
    return metrics
  } catch (error) {
    logAnalytics("CALCULATE_PLAYER_ACTIVITY_ERROR", { error: String(error) })
    console.error("Error calculating player activity metrics:", error)
    return {
      totalPlayers: 0,
      activePlayers: 0,
      averageGamesPerPlayer: 0,
      medianGamesPerPlayer: 0,
      topPlayers: [],
    }
  }
}

// Identify peak participation periods
export async function identifyPeakParticipationPeriods(records: GameRecord[]): Promise<PeakParticipationPeriod[]> {
  try {
    logAnalytics("IDENTIFY_PEAK_PERIODS_START", { recordCount: records.length })

    if (records.length === 0) return []

    // Group by hour of day and day of week
    const hourlyStats = new Map<number, { games: number; players: Set<string> }>()
    const dailyStats = new Map<number, { games: number; players: Set<string> }>()

    records.forEach((record) => {
      const date = new Date(record.timestamp)
      const hour = date.getHours()
      const dayOfWeek = date.getDay()

      // Hour stats
      if (!hourlyStats.has(hour)) {
        hourlyStats.set(hour, { games: 0, players: new Set() })
      }
      const hourStats = hourlyStats.get(hour)!
      hourStats.games++
      hourStats.players.add(record.userId)

      // Day stats
      if (!dailyStats.has(dayOfWeek)) {
        dailyStats.set(dayOfWeek, { games: 0, players: new Set() })
      }
      const dayStats = dailyStats.get(dayOfWeek)!
      dayStats.games++
      dayStats.players.add(record.userId)
    })

    const peakPeriods: PeakParticipationPeriod[] = []

    // Add hourly peaks
    for (const [hour, stats] of hourlyStats.entries()) {
      peakPeriods.push({
        period: `${hour}:00 - ${hour + 1}:00`,
        hour,
        dayOfWeek: -1,
        gamesCount: stats.games,
        playersCount: stats.players.size,
      })
    }

    // Add daily peaks
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    for (const [dayOfWeek, stats] of dailyStats.entries()) {
      peakPeriods.push({
        period: dayNames[dayOfWeek],
        hour: -1,
        dayOfWeek,
        gamesCount: stats.games,
        playersCount: stats.players.size,
      })
    }

    // Sort by games count
    peakPeriods.sort((a, b) => b.gamesCount - a.gamesCount)

    logAnalytics("IDENTIFY_PEAK_PERIODS_SUCCESS", { peakPeriodsCount: peakPeriods.length })
    return peakPeriods
  } catch (error) {
    logAnalytics("IDENTIFY_PEAK_PERIODS_ERROR", { error: String(error) })
    console.error("Error identifying peak participation periods:", error)
    return []
  }
}

// Calculate game mode analytics
export async function calculateGameModeAnalytics(records: GameRecord[]): Promise<GameModeAnalytics[]> {
  try {
    logAnalytics("CALCULATE_GAME_MODE_ANALYTICS_START", { recordCount: records.length })

    if (records.length === 0) return []

    const modeStats = new Map<GameMode, { games: number; players: Set<string>; totalScore: number }>()

    records.forEach((record) => {
      if (!modeStats.has(record.gameMode)) {
        modeStats.set(record.gameMode, { games: 0, players: new Set(), totalScore: 0 })
      }
      const stats = modeStats.get(record.gameMode)!
      stats.games++
      stats.players.add(record.userId)
      stats.totalScore += record.score
    })

    const analytics: GameModeAnalytics[] = []
    const totalGames = records.length

    for (const [mode, stats] of modeStats.entries()) {
      analytics.push({
        mode,
        totalGames: stats.games,
        uniquePlayers: stats.players.size,
        averageScore: Math.round(stats.totalScore / stats.games),
        percentage: Math.round((stats.games / totalGames) * 100 * 100) / 100,
      })
    }

    analytics.sort((a, b) => b.totalGames - a.totalGames)

    logAnalytics("CALCULATE_GAME_MODE_ANALYTICS_SUCCESS", { analyticsCount: analytics.length })
    return analytics
  } catch (error) {
    logAnalytics("CALCULATE_GAME_MODE_ANALYTICS_ERROR", { error: String(error) })
    console.error("Error calculating game mode analytics:", error)
    return []
  }
}

// Calculate difficulty analytics
export async function calculateDifficultyAnalytics(records: GameRecord[]): Promise<DifficultyAnalytics[]> {
  try {
    logAnalytics("CALCULATE_DIFFICULTY_ANALYTICS_START", { recordCount: records.length })

    if (records.length === 0) return []

    const difficultyStats = new Map<Difficulty, { games: number; players: Set<string>; totalScore: number }>()

    records.forEach((record) => {
      if (!difficultyStats.has(record.difficulty)) {
        difficultyStats.set(record.difficulty, { games: 0, players: new Set(), totalScore: 0 })
      }
      const stats = difficultyStats.get(record.difficulty)!
      stats.games++
      stats.players.add(record.userId)
      stats.totalScore += record.score
    })

    const analytics: DifficultyAnalytics[] = []
    const totalGames = records.length

    for (const [difficulty, stats] of difficultyStats.entries()) {
      analytics.push({
        difficulty,
        totalGames: stats.games,
        uniquePlayers: stats.players.size,
        averageScore: Math.round(stats.totalScore / stats.games),
        percentage: Math.round((stats.games / totalGames) * 100 * 100) / 100,
      })
    }

    analytics.sort((a, b) => b.totalGames - a.totalGames)

    logAnalytics("CALCULATE_DIFFICULTY_ANALYTICS_SUCCESS", { analyticsCount: analytics.length })
    return analytics
  } catch (error) {
    logAnalytics("CALCULATE_DIFFICULTY_ANALYTICS_ERROR", { error: String(error) })
    console.error("Error calculating difficulty analytics:", error)
    return []
  }
}

// Generate comprehensive analytics dashboard data
export async function generateAnalyticsDashboardData(filters: AnalyticsFilters = {}): Promise<AnalyticsDashboardData> {
  try {
    logAnalytics("GENERATE_DASHBOARD_DATA_START", filters)

    // Get filtered game records
    const records = await getFilteredGameRecords(filters)

    if (records.length === 0) {
      return {
        overview: {
          totalGames: 0,
          totalPlayers: 0,
          averageGamesPerPlayer: 0,
          totalScore: 0,
        },
        trends: [],
        playerActivity: {
          totalPlayers: 0,
          activePlayers: 0,
          averageGamesPerPlayer: 0,
          medianGamesPerPlayer: 0,
          topPlayers: [],
        },
        peakPeriods: [],
        gameModeBreakdown: [],
        difficultyBreakdown: [],
        recentActivity: [],
      }
    }

    // Calculate all analytics in parallel
    const [trends, playerActivity, peakPeriods, gameModeBreakdown, difficultyBreakdown] = await Promise.all([
      calculateParticipationTrends(records),
      calculatePlayerActivityMetrics(records),
      identifyPeakParticipationPeriods(records),
      calculateGameModeAnalytics(records),
      calculateDifficultyAnalytics(records),
    ])

    // Calculate overview metrics
    const uniquePlayers = new Set(records.map((r) => r.userId)).size
    const totalScore = records.reduce((sum, r) => sum + r.score, 0)

    // Get recent activity (last 20 games)
    const recentActivity = records.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20)

    const dashboardData: AnalyticsDashboardData = {
      overview: {
        totalGames: records.length,
        totalPlayers: uniquePlayers,
        averageGamesPerPlayer: uniquePlayers > 0 ? Math.round((records.length / uniquePlayers) * 100) / 100 : 0,
        totalScore,
      },
      trends,
      playerActivity,
      peakPeriods,
      gameModeBreakdown,
      difficultyBreakdown,
      recentActivity,
    }

    logAnalytics("GENERATE_DASHBOARD_DATA_SUCCESS", {
      totalGames: records.length,
      totalPlayers: uniquePlayers,
    })

    return dashboardData
  } catch (error) {
    logAnalytics("GENERATE_DASHBOARD_DATA_ERROR", { error: String(error) })
    console.error("Error generating analytics dashboard data:", error)
    throw error
  }
}
