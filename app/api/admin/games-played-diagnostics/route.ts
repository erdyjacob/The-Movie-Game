import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { getUserGamesPlayedCount, getUserGameStats } from "@/lib/game-tracking"
import { getLeaderboardData } from "@/lib/leaderboard"
import type { LeaderboardEntry } from "@/lib/types"

interface DiagnosticResult {
  userId: string
  username: string
  gameTrackingCount: number
  leaderboardCount: number
  userStatsCount: number
  legacyGameHistoryCount: number
  discrepancy: number
  lastGameRecorded: string | null
  lastLeaderboardUpdate: string | null
  cacheStatus: string
  issues: string[]
}

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[ADMIN] Starting games played diagnostics...")

    // Get all leaderboard entries
    const leaderboardData = await getLeaderboardData()
    const diagnosticResults: DiagnosticResult[] = []

    for (const entry of leaderboardData) {
      if (!entry.userId) continue

      const result = await diagnoseSingleUser(entry.userId, entry.playerName, entry.gamesPlayed || 0)
      diagnosticResults.push(result)
    }

    // Analyze patterns
    const analysis = analyzeDiscrepancies(diagnosticResults)

    return NextResponse.json({
      success: true,
      totalUsersAnalyzed: diagnosticResults.length,
      usersWithDiscrepancies: diagnosticResults.filter((r) => r.discrepancy !== 0).length,
      diagnosticResults,
      analysis,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[ADMIN] Error in games played diagnostics:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

async function diagnoseSingleUser(
  userId: string,
  username: string,
  leaderboardCount: number,
): Promise<DiagnosticResult> {
  const issues: string[] = []

  try {
    // 1. Get count from game tracking system (authoritative source)
    const gameTrackingCount = await getUserGamesPlayedCount(userId)

    // 2. Get count from user stats cache
    const userStats = await getUserGameStats(userId)
    const userStatsCount = userStats?.totalGames || 0

    // 3. Get count from legacy game history
    const legacyGameHistoryCount = await getLegacyGameHistoryCount(userId)

    // 4. Check cache status
    const cacheStatus = await checkCacheStatus(userId)

    // 5. Get timestamps for debugging
    const lastGameRecorded = await getLastGameTimestamp(userId)
    const lastLeaderboardUpdate = await getLastLeaderboardUpdateTimestamp(userId)

    // Calculate discrepancy (game tracking is authoritative)
    const discrepancy = gameTrackingCount - leaderboardCount

    // Identify issues
    if (gameTrackingCount !== userStatsCount) {
      issues.push(`User stats cache mismatch: ${userStatsCount} vs ${gameTrackingCount}`)
    }

    if (gameTrackingCount !== legacyGameHistoryCount) {
      issues.push(`Legacy history mismatch: ${legacyGameHistoryCount} vs ${gameTrackingCount}`)
    }

    if (Math.abs(discrepancy) > 0) {
      issues.push(`Leaderboard sync issue: ${discrepancy} games difference`)
    }

    if (cacheStatus === "stale") {
      issues.push("Stale cache detected")
    }

    if (lastGameRecorded && lastLeaderboardUpdate) {
      const gameTime = new Date(lastGameRecorded).getTime()
      const leaderboardTime = new Date(lastLeaderboardUpdate).getTime()
      if (gameTime > leaderboardTime + 60000) {
        // 1 minute tolerance
        issues.push("Leaderboard update lag detected")
      }
    }

    return {
      userId,
      username,
      gameTrackingCount,
      leaderboardCount,
      userStatsCount,
      legacyGameHistoryCount,
      discrepancy,
      lastGameRecorded,
      lastLeaderboardUpdate,
      cacheStatus,
      issues,
    }
  } catch (error) {
    issues.push(`Diagnostic error: ${error instanceof Error ? error.message : "Unknown error"}`)

    return {
      userId,
      username,
      gameTrackingCount: 0,
      leaderboardCount,
      userStatsCount: 0,
      legacyGameHistoryCount: 0,
      discrepancy: -leaderboardCount,
      lastGameRecorded: null,
      lastLeaderboardUpdate: null,
      cacheStatus: "error",
      issues,
    }
  }
}

async function getLegacyGameHistoryCount(userId: string): Promise<number> {
  try {
    const gameHistoryKey = `user:${userId}:games`
    return (await kv.llen(gameHistoryKey)) || 0
  } catch (error) {
    console.error(`Error getting legacy game history for ${userId}:`, error)
    return 0
  }
}

async function checkCacheStatus(userId: string): Promise<string> {
  try {
    const userStatsKey = `user-stats:${userId}`
    const stats = await kv.get(userStatsKey)

    if (!stats) return "missing"

    // Check if cache has TTL
    const ttl = await kv.ttl(userStatsKey)
    if (ttl === -1) return "no-expiry"
    if (ttl < 3600) return "expiring-soon" // Less than 1 hour

    return "fresh"
  } catch (error) {
    return "error"
  }
}

async function getLastGameTimestamp(userId: string): Promise<string | null> {
  try {
    const userGamesKey = `user-games:${userId}`
    const gameIds = await kv.lrange(userGamesKey, 0, 0) // Get most recent game

    if (!gameIds || gameIds.length === 0) return null

    const gameRecord = await kv.get(`game:${gameIds[0]}`)
    if (gameRecord && typeof gameRecord === "object" && "timestamp" in gameRecord) {
      return new Date(gameRecord.timestamp as number).toISOString()
    }

    return null
  } catch (error) {
    console.error(`Error getting last game timestamp for ${userId}:`, error)
    return null
  }
}

async function getLastLeaderboardUpdateTimestamp(userId: string): Promise<string | null> {
  try {
    // Get leaderboard entries and find this user
    const leaderboardData = await kv.zrange<string[]>("movie-game:leaderboard", 0, -1, { rev: true })

    for (const entryRaw of leaderboardData) {
      try {
        const entry = JSON.parse(entryRaw) as LeaderboardEntry
        if (entry.userId === userId) {
          return entry.timestamp
        }
      } catch (e) {
        continue
      }
    }

    return null
  } catch (error) {
    console.error(`Error getting leaderboard timestamp for ${userId}:`, error)
    return null
  }
}

function analyzeDiscrepancies(results: DiagnosticResult[]) {
  const totalUsers = results.length
  const usersWithIssues = results.filter((r) => r.issues.length > 0).length
  const usersWithDiscrepancies = results.filter((r) => r.discrepancy !== 0).length

  // Group issues by type
  const issueTypes: { [key: string]: number } = {}
  results.forEach((result) => {
    result.issues.forEach((issue) => {
      const issueType = issue.split(":")[0]
      issueTypes[issueType] = (issueTypes[issueType] || 0) + 1
    })
  })

  // Calculate statistics
  const discrepancies = results.map((r) => r.discrepancy).filter((d) => d !== 0)
  const avgDiscrepancy = discrepancies.length > 0 ? discrepancies.reduce((a, b) => a + b, 0) / discrepancies.length : 0

  const maxDiscrepancy = discrepancies.length > 0 ? Math.max(...discrepancies.map(Math.abs)) : 0

  return {
    summary: {
      totalUsers,
      usersWithIssues,
      usersWithDiscrepancies,
      issueRate: ((usersWithIssues / totalUsers) * 100).toFixed(2) + "%",
      discrepancyRate: ((usersWithDiscrepancies / totalUsers) * 100).toFixed(2) + "%",
    },
    statistics: {
      averageDiscrepancy: Math.round(avgDiscrepancy * 100) / 100,
      maxDiscrepancy,
      totalDiscrepancy: discrepancies.reduce((a, b) => a + b, 0),
    },
    commonIssues: Object.entries(issueTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([issue, count]) => ({ issue, count, percentage: ((count / totalUsers) * 100).toFixed(1) + "%" })),
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
