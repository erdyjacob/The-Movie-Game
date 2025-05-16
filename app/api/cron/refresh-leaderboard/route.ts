import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"

// Vercel Cron configuration
export const config = {
  runtime: "edge",
  schedule: "0 8 * * *", // Run at 8am daily (UTC)
}

export async function GET() {
  try {
    // Clean up inactive users (2 months of inactivity)
    const twoMonthsAgo = Date.now() - 60 * 24 * 60 * 60 * 1000
    const users = await redis.keys("user:*")

    for (const userKey of users) {
      const lastActive = await redis.hget(userKey, "lastActive")
      if (lastActive && Number(lastActive) < twoMonthsAgo) {
        // Get username to remove from leaderboard
        const username = await redis.hget(userKey, "username")
        if (username) {
          await redis.zrem("leaderboard:points", username)
          await redis.srem("usernames", username)

          // Remove from daily challenge leaderboards
          const dailyLeaderboards = await redis.keys("leaderboard:daily:*")
          for (const leaderboardKey of dailyLeaderboards) {
            await redis.zrem(leaderboardKey, username)
          }
        }

        // Delete user data
        await redis.del(userKey)
      }
    }

    // Clean up old daily leaderboards (older than 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const oldDate = thirtyDaysAgo.toISOString().split("T")[0]
    const oldLeaderboards = await redis.keys(`leaderboard:daily:*`)

    for (const leaderboardKey of oldLeaderboards) {
      const leaderboardDate = leaderboardKey.replace("leaderboard:daily:", "")
      if (leaderboardDate < oldDate) {
        await redis.del(leaderboardKey)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Leaderboard refresh error:", error)
    return NextResponse.json({ success: false, error: "Refresh failed" }, { status: 500 })
  }
}
