import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { getUserGamesPlayedCount, rebuildUserGameStats } from "@/lib/game-tracking"
import { synchronizeLeaderboardGamesPlayed } from "@/lib/leaderboard"

interface FixResult {
  userId: string
  username: string
  beforeCount: number
  afterCount: number
  fixed: boolean
  error?: string
}

export async function POST(request: NextRequest) {
  try {
    const { password, userIds, fixType } = await request.json()

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`[ADMIN] Starting games played sync fix: ${fixType}`)

    let results: FixResult[] = []

    switch (fixType) {
      case "rebuild-all-stats":
        results = await rebuildAllUserStats()
        break
      case "sync-leaderboard":
        await synchronizeLeaderboardGamesPlayed()
        results = [{ userId: "all", username: "all", beforeCount: 0, afterCount: 0, fixed: true }]
        break
      case "fix-specific-users":
        results = await fixSpecificUsers(userIds || [])
        break
      case "rebuild-caches":
        results = await rebuildUserCaches()
        break
      default:
        return NextResponse.json({ error: "Invalid fix type" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      fixType,
      results,
      summary: {
        totalProcessed: results.length,
        successfulFixes: results.filter((r) => r.fixed).length,
        errors: results.filter((r) => !r.fixed).length,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[ADMIN] Error in games played sync fix:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function rebuildAllUserStats(): Promise<FixResult[]> {
  const results: FixResult[] = []

  try {
    // Get all user game keys
    const pattern = "user-games:*"
    const keys = await kv.keys(pattern)

    for (const key of keys) {
      const userId = key.replace("user-games:", "")

      try {
        // Get username
        const userData = await kv.get(`user:${userId}`)
        const username =
          userData && typeof userData === "object" && "username" in userData
            ? (userData.username as string)
            : `user-${userId}`

        // Get current count
        const beforeCount = await getUserGamesPlayedCount(userId)

        // Rebuild stats
        await rebuildUserGameStats(userId)

        // Get new count
        const afterCount = await getUserGamesPlayedCount(userId)

        results.push({
          userId,
          username,
          beforeCount,
          afterCount,
          fixed: true,
        })

        console.log(`[FIX] Rebuilt stats for ${username}: ${beforeCount} → ${afterCount}`)
      } catch (error) {
        results.push({
          userId,
          username: `user-${userId}`,
          beforeCount: 0,
          afterCount: 0,
          fixed: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }
  } catch (error) {
    console.error("Error rebuilding all user stats:", error)
  }

  return results
}

async function fixSpecificUsers(userIds: string[]): Promise<FixResult[]> {
  const results: FixResult[] = []

  for (const userId of userIds) {
    try {
      // Get username
      const userData = await kv.get(`user:${userId}`)
      const username =
        userData && typeof userData === "object" && "username" in userData
          ? (userData.username as string)
          : `user-${userId}`

      // Get current count
      const beforeCount = await getUserGamesPlayedCount(userId)

      // Rebuild stats
      await rebuildUserGameStats(userId)

      // Get new count
      const afterCount = await getUserGamesPlayedCount(userId)

      results.push({
        userId,
        username,
        beforeCount,
        afterCount,
        fixed: true,
      })
    } catch (error) {
      results.push({
        userId,
        username: `user-${userId}`,
        beforeCount: 0,
        afterCount: 0,
        fixed: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  return results
}

async function rebuildUserCaches(): Promise<FixResult[]> {
  const results: FixResult[] = []

  try {
    // Get all user stats cache keys
    const pattern = "user-stats:*"
    const keys = await kv.keys(pattern)

    for (const key of keys) {
      const userId = key.replace("user-stats:", "")

      try {
        // Get username
        const userData = await kv.get(`user:${userId}`)
        const username =
          userData && typeof userData === "object" && "username" in userData
            ? (userData.username as string)
            : `user-${userId}`

        // Get current cached count
        const cachedStats = await kv.get(key)
        const beforeCount =
          cachedStats && typeof cachedStats === "object" && "totalGames" in cachedStats
            ? (cachedStats.totalGames as number)
            : 0

        // Delete cache to force rebuild
        await kv.del(key)

        // Rebuild by calling getUserGamesPlayedCount
        const afterCount = await getUserGamesPlayedCount(userId)

        results.push({
          userId,
          username,
          beforeCount,
          afterCount,
          fixed: true,
        })
      } catch (error) {
        results.push({
          userId,
          username: `user-${userId}`,
          beforeCount: 0,
          afterCount: 0,
          fixed: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }
  } catch (error) {
    console.error("Error rebuilding user caches:", error)
  }

  return results
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
