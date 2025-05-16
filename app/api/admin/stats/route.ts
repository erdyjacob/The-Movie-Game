import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"

export async function GET() {
  try {
    // Get all user keys
    const userKeys = await redis.keys("user:*")

    // Calculate stats
    const totalUsers = userKeys.length
    let activeUsers = 0
    let totalGamesPlayed = 0
    let totalPoints = 0

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000

    for (const key of userKeys) {
      const userData = await redis.hgetall(key)

      if (userData) {
        // Count active users (active in last 30 days)
        if (Number.parseInt(userData.lastActive || "0") > thirtyDaysAgo) {
          activeUsers++
        }

        // Add to total points
        totalPoints += Number.parseInt(userData.points || "0")

        // Parse gameStats for games played
        try {
          if (userData.gameStats) {
            const gameStats = JSON.parse(userData.gameStats)
            totalGamesPlayed += gameStats.gamesPlayed || 0
          }
        } catch (e) {
          console.error("Error parsing gameStats:", e)
        }
      }
    }

    // Calculate average score
    const averageScore = totalUsers > 0 ? totalPoints / totalUsers : 0

    return NextResponse.json({
      totalUsers,
      activeUsers,
      totalGamesPlayed,
      averageScore,
    })
  } catch (error) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
