import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { getAuthToken } from "@/lib/admin-utils"
import { synchronizeAllGamesPlayedCounts } from "@/lib/game-tracking"
import { synchronizeLeaderboardGamesPlayed } from "@/lib/leaderboard"

// Sync operation types
type SyncOperation =
  | "user_data_validation"
  | "score_recalculation"
  | "games_played_sync"
  | "leaderboard_refresh"
  | "achievement_sync"
  | "cache_cleanup"
  | "data_integrity_check"

interface SyncProgress {
  operation: SyncOperation
  status: "pending" | "running" | "completed" | "failed"
  progress: number
  message: string
  details?: any
  startTime?: number
  endTime?: number
  error?: string
}

interface SyncResult {
  success: boolean
  totalOperations: number
  completedOperations: number
  failedOperations: number
  operations: SyncProgress[]
  totalDuration: number
  summary: {
    usersProcessed: number
    scoresUpdated: number
    gamesPlayedSynced: number
    leaderboardUpdated: number
    achievementsSynced: number
    cachesCleaned: number
    errorsFound: number
    errorsFixed: number
  }
}

// Safe data retrieval helper
async function safeKvGet<T>(key: string): Promise<T | null> {
  try {
    const result = await kv.get<T>(key)
    return result
  } catch (error) {
    console.error(`Error getting key ${key}:`, error)
    return null
  }
}

// Safe data storage helper
async function safeKvSet(key: string, value: any, options?: any): Promise<boolean> {
  try {
    await kv.set(key, value, options)
    return true
  } catch (error) {
    console.error(`Error setting key ${key}:`, error)
    return false
  }
}

// Safe list range helper
async function safeKvLrange(key: string, start: number, stop: number): Promise<any[]> {
  try {
    const result = await kv.lrange(key, start, stop)
    return Array.isArray(result) ? result : []
  } catch (error) {
    console.error(`Error getting list range for key ${key}:`, error)
    return []
  }
}

// Safe hash get all helper
async function safeKvHgetall(key: string): Promise<Record<string, any>> {
  try {
    const result = await kv.hgetall(key)
    return result && typeof result === "object" ? result : {}
  } catch (error) {
    console.error(`Error getting hash for key ${key}:`, error)
    return {}
  }
}

// Logging utility for sync operations
function logSyncOperation(operation: string, details?: any) {
  const timestamp = new Date().toISOString()
  console.log(`[SYNC_REFRESH ${timestamp}] ${operation}`, details ? JSON.stringify(details) : "")
}

// Progress tracking utility
class SyncProgressTracker {
  private operations: Map<SyncOperation, SyncProgress> = new Map()
  private sessionId: string

  constructor(sessionId: string) {
    this.sessionId = sessionId
  }

  initializeOperation(operation: SyncOperation, message: string) {
    this.operations.set(operation, {
      operation,
      status: "pending",
      progress: 0,
      message,
      startTime: Date.now(),
    })
    this.saveProgress()
  }

  updateProgress(operation: SyncOperation, progress: number, message?: string, details?: any) {
    const op = this.operations.get(operation)
    if (op) {
      op.progress = progress
      op.status = "running"
      if (message) op.message = message
      if (details) op.details = details
      this.saveProgress()
    }
  }

  completeOperation(operation: SyncOperation, message?: string, details?: any) {
    const op = this.operations.get(operation)
    if (op) {
      op.status = "completed"
      op.progress = 100
      op.endTime = Date.now()
      if (message) op.message = message
      if (details) op.details = details
      this.saveProgress()
    }
  }

  failOperation(operation: SyncOperation, error: string, details?: any) {
    const op = this.operations.get(operation)
    if (op) {
      op.status = "failed"
      op.error = error
      op.endTime = Date.now()
      if (details) op.details = details
      this.saveProgress()
    }
  }

  private async saveProgress() {
    try {
      const progressArray = Array.from(this.operations.values())
      await safeKvSet(`sync-progress:${this.sessionId}`, progressArray, { ex: 3600 })
    } catch (error) {
      console.error("Failed to save sync progress:", error)
    }
  }

  getOperations(): SyncProgress[] {
    return Array.from(this.operations.values())
  }
}

// Main sync and refresh function
async function performSyncRefresh(sessionId: string): Promise<SyncResult> {
  const startTime = Date.now()
  const tracker = new SyncProgressTracker(sessionId)
  const summary = {
    usersProcessed: 0,
    scoresUpdated: 0,
    gamesPlayedSynced: 0,
    leaderboardUpdated: 0,
    achievementsSynced: 0,
    cachesCleaned: 0,
    errorsFound: 0,
    errorsFixed: 0,
  }

  logSyncOperation("SYNC_REFRESH_START", { sessionId })

  // Initialize all operations
  const operations: SyncOperation[] = [
    "user_data_validation",
    "score_recalculation",
    "games_played_sync",
    "leaderboard_refresh",
    "achievement_sync",
    "cache_cleanup",
    "data_integrity_check",
  ]

  operations.forEach((op) => {
    tracker.initializeOperation(op, `Preparing ${op.replace(/_/g, " ")}...`)
  })

  let completedOperations = 0
  let failedOperations = 0

  // Operation 1: User Data Validation
  try {
    tracker.updateProgress("user_data_validation", 10, "Validating user data structure...")

    const allUsers = await safeKvHgetall("movie-game:users")
    const userEntries = Object.entries(allUsers)
    summary.usersProcessed = userEntries.length

    let validationErrors = 0
    let validationFixes = 0

    for (let i = 0; i < userEntries.length; i++) {
      const [userId, username] = userEntries[i]
      const progress = 10 + (i / userEntries.length) * 20

      tracker.updateProgress("user_data_validation", progress, `Validating user ${i + 1}/${userEntries.length}`)

      try {
        // Check if user object exists
        const userData = await safeKvGet(`user:${userId}`)
        if (!userData) {
          // Create basic user object
          const success = await safeKvSet(`user:${userId}`, {
            userId,
            username,
            createdAt: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
          })
          if (success) validationFixes++
        }

        // Validate username consistency
        if (typeof username === "string" && userData && typeof userData === "object" && "username" in userData) {
          if (userData.username !== username) {
            try {
              await kv.hset("movie-game:users", { [userId]: userData.username })
              validationFixes++
            } catch (error) {
              validationErrors++
            }
          }
        }
      } catch (error) {
        validationErrors++
        logSyncOperation("USER_VALIDATION_ERROR", { userId, error: String(error) })
      }
    }

    summary.errorsFound += validationErrors
    summary.errorsFixed += validationFixes

    tracker.completeOperation(
      "user_data_validation",
      `Validated ${userEntries.length} users, fixed ${validationFixes} issues`,
    )
    completedOperations++
  } catch (error) {
    tracker.failOperation("user_data_validation", String(error))
    failedOperations++
    logSyncOperation("USER_VALIDATION_FAILED", { error: String(error) })
  }

  // Operation 2: Score Recalculation
  try {
    tracker.updateProgress("score_recalculation", 10, "Recalculating user scores...")

    const allUsers = await safeKvHgetall("movie-game:users")
    const userEntries = Object.entries(allUsers)
    let scoresUpdated = 0

    for (let i = 0; i < userEntries.length; i++) {
      const [userId, username] = userEntries[i]
      const progress = 10 + (i / userEntries.length) * 20

      tracker.updateProgress(
        "score_recalculation",
        progress,
        `Recalculating score for user ${i + 1}/${userEntries.length}`,
      )

      try {
        // Get player history
        const playerHistory = await safeKvGet(`player:${userId}:history`)
        if (playerHistory && typeof playerHistory === "object") {
          // Recalculate score from history
          const movies = Array.isArray(playerHistory.movies) ? playerHistory.movies : []
          const actors = Array.isArray(playerHistory.actors) ? playerHistory.actors : []

          const rarityPoints = { legendary: 1000, epic: 500, rare: 250, uncommon: 100, common: 50 }
          let totalPoints = 0
          let legendaryCount = 0,
            epicCount = 0,
            rareCount = 0,
            uncommonCount = 0,
            commonCount = 0

          // Calculate from movies
          movies.forEach((movie: any) => {
            if (movie && movie.rarity) {
              switch (movie.rarity) {
                case "legendary":
                  legendaryCount++
                  totalPoints += rarityPoints.legendary
                  break
                case "epic":
                  epicCount++
                  totalPoints += rarityPoints.epic
                  break
                case "rare":
                  rareCount++
                  totalPoints += rarityPoints.rare
                  break
                case "uncommon":
                  uncommonCount++
                  totalPoints += rarityPoints.uncommon
                  break
                case "common":
                  commonCount++
                  totalPoints += rarityPoints.common
                  break
              }
            }
          })

          // Calculate from actors
          actors.forEach((actor: any) => {
            if (actor && actor.rarity) {
              switch (actor.rarity) {
                case "legendary":
                  legendaryCount++
                  totalPoints += rarityPoints.legendary
                  break
                case "epic":
                  epicCount++
                  totalPoints += rarityPoints.epic
                  break
                case "rare":
                  rareCount++
                  totalPoints += rarityPoints.rare
                  break
                case "uncommon":
                  uncommonCount++
                  totalPoints += rarityPoints.uncommon
                  break
                case "common":
                  commonCount++
                  totalPoints += rarityPoints.common
                  break
              }
            }
          })

          // Create account score
          const accountScore = {
            points: totalPoints,
            rank: calculateRank(totalPoints),
            legendaryCount,
            epicCount,
            rareCount,
            uncommonCount,
            commonCount,
            totalItems: movies.length + actors.length,
            dailyChallengesCompleted: 0,
          }

          // Update all score locations
          await safeKvSet(`user:${userId}:score`, totalPoints)
          await safeKvSet(`user:${userId}:accountScore`, accountScore)

          // Update user object
          const userData = await safeKvGet(`user:${userId}`)
          if (userData && typeof userData === "object") {
            await safeKvSet(`user:${userId}`, { ...userData, score: totalPoints, accountScore })
          }

          scoresUpdated++
        }
      } catch (error) {
        logSyncOperation("SCORE_RECALC_ERROR", { userId, error: String(error) })
      }
    }

    summary.scoresUpdated = scoresUpdated
    tracker.completeOperation("score_recalculation", `Recalculated ${scoresUpdated} user scores`)
    completedOperations++
  } catch (error) {
    tracker.failOperation("score_recalculation", String(error))
    failedOperations++
    logSyncOperation("SCORE_RECALC_FAILED", { error: String(error) })
  }

  // Operation 3: Games Played Synchronization
  try {
    tracker.updateProgress("games_played_sync", 10, "Synchronizing games played counts...")

    const gamesSyncResult = await synchronizeAllGamesPlayedCounts()
    summary.gamesPlayedSynced = gamesSyncResult.updated

    tracker.completeOperation(
      "games_played_sync",
      `Synchronized ${gamesSyncResult.updated} users, ${gamesSyncResult.errors} errors`,
    )
    completedOperations++
  } catch (error) {
    tracker.failOperation("games_played_sync", String(error))
    failedOperations++
    logSyncOperation("GAMES_SYNC_FAILED", { error: String(error) })
  }

  // Operation 4: Leaderboard Refresh
  try {
    tracker.updateProgress("leaderboard_refresh", 10, "Refreshing leaderboard...")

    const leaderboardSyncResult = await synchronizeLeaderboardGamesPlayed()
    summary.leaderboardUpdated = leaderboardSyncResult.updated

    // Clear leaderboard cache
    try {
      await kv.del("movie-game:leaderboard-cache")
    } catch (error) {
      console.error("Error clearing leaderboard cache:", error)
    }

    tracker.completeOperation("leaderboard_refresh", `Updated ${leaderboardSyncResult.updated} leaderboard entries`)
    completedOperations++
  } catch (error) {
    tracker.failOperation("leaderboard_refresh", String(error))
    failedOperations++
    logSyncOperation("LEADERBOARD_REFRESH_FAILED", { error: String(error) })
  }

  // Operation 5: Achievement Synchronization
  try {
    tracker.updateProgress("achievement_sync", 10, "Synchronizing achievements...")

    // This would integrate with achievement system when available
    // For now, just mark as completed
    summary.achievementsSynced = 0

    tracker.completeOperation("achievement_sync", "Achievement sync completed (placeholder)")
    completedOperations++
  } catch (error) {
    tracker.failOperation("achievement_sync", String(error))
    failedOperations++
  }

  // Operation 6: Cache Cleanup
  try {
    tracker.updateProgress("cache_cleanup", 10, "Cleaning up stale caches...")

    const cachePatterns = ["user-stats:*", "player:*:cache", "connection-cache:*"]
    const specificCaches = ["movie-game:leaderboard-cache"]

    let cachesCleaned = 0

    // Clean pattern-based caches
    for (const pattern of cachePatterns) {
      try {
        const keys = await kv.keys(pattern)
        if (Array.isArray(keys) && keys.length > 0) {
          await kv.del(...keys)
          cachesCleaned += keys.length
        }
      } catch (error) {
        console.error(`Error cleaning cache pattern ${pattern}:`, error)
      }
    }

    // Clean specific caches
    for (const cacheKey of specificCaches) {
      try {
        await kv.del(cacheKey)
        cachesCleaned++
      } catch (error) {
        console.error(`Error cleaning cache ${cacheKey}:`, error)
      }
    }

    summary.cachesCleaned = cachesCleaned
    tracker.completeOperation("cache_cleanup", `Cleaned ${cachesCleaned} cache entries`)
    completedOperations++
  } catch (error) {
    tracker.failOperation("cache_cleanup", String(error))
    failedOperations++
    logSyncOperation("CACHE_CLEANUP_FAILED", { error: String(error) })
  }

  // Operation 7: Data Integrity Check
  try {
    tracker.updateProgress("data_integrity_check", 10, "Performing data integrity check...")

    const allUsers = await safeKvHgetall("movie-game:users")
    let integrityIssues = 0

    for (const [userId, username] of Object.entries(allUsers)) {
      try {
        // Check if all required user data exists
        const userData = await safeKvGet(`user:${userId}`)
        const userScore = await safeKvGet(`user:${userId}:score`)
        const accountScore = await safeKvGet(`user:${userId}:accountScore`)

        if (!userData) integrityIssues++
        if (userData && typeof userData === "object" && "score" in userData && !userScore) integrityIssues++
        if (userScore && !accountScore) integrityIssues++
      } catch (error) {
        integrityIssues++
        console.error(`Error checking integrity for user ${userId}:`, error)
      }
    }

    tracker.completeOperation("data_integrity_check", `Integrity check completed, found ${integrityIssues} issues`)
    completedOperations++
  } catch (error) {
    tracker.failOperation("data_integrity_check", String(error))
    failedOperations++
    logSyncOperation("INTEGRITY_CHECK_FAILED", { error: String(error) })
  }

  const endTime = Date.now()
  const totalDuration = endTime - startTime

  const result: SyncResult = {
    success: failedOperations === 0,
    totalOperations: operations.length,
    completedOperations,
    failedOperations,
    operations: tracker.getOperations(),
    totalDuration,
    summary,
  }

  logSyncOperation("SYNC_REFRESH_COMPLETE", {
    sessionId,
    duration: totalDuration,
    completed: completedOperations,
    failed: failedOperations,
  })

  return result
}

// Helper function to calculate rank
function calculateRank(points: number): string {
  if (points >= 50000) return "SS"
  if (points >= 40000) return "S+"
  if (points >= 30000) return "S"
  if (points >= 25000) return "S-"
  if (points >= 20000) return "A+"
  if (points >= 15000) return "A"
  if (points >= 12000) return "A-"
  if (points >= 10000) return "B+"
  if (points >= 8000) return "B"
  if (points >= 6000) return "B-"
  if (points >= 5000) return "C+"
  if (points >= 4000) return "C"
  if (points >= 3000) return "C-"
  if (points >= 2000) return "D+"
  if (points >= 1000) return "D"
  if (points >= 500) return "D-"
  if (points >= 250) return "F+"
  if (points >= 100) return "F"
  return "F-"
}

export async function POST(request: NextRequest) {
  try {
    // Check for admin authorization
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const isAuthorized = (await getAuthToken()) === token

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { sessionId } = await request.json()
    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    // Perform the sync and refresh operation
    const result = await performSyncRefresh(sessionId)

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in sync refresh:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// GET endpoint to check progress
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    const progress = await safeKvGet(`sync-progress:${sessionId}`)
    return NextResponse.json({ progress: progress || [] })
  } catch (error) {
    console.error("Error getting sync progress:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
