import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)

    // Get date parameter or use today's date
    const date = url.searchParams.get("date") || new Date().toISOString().split("T")[0]

    // Get top 10 from daily leaderboard
    const leaderboardData = await redis.zrevrange(`leaderboard:daily:${date}`, 0, 9, { withScores: true })

    // Format the response
    const leaderboard = leaderboardData.map((entry, index) => {
      const [username, points] = entry
      return {
        rank: index + 1,
        username,
        points: Number(points as string),
      }
    })

    // Get user rank if username is provided
    let userRank = null
    const username = url.searchParams.get("username")

    if (username) {
      const rank = await redis.zrevrank(`leaderboard:daily:${date}`, username)
      if (rank !== null) {
        const points = await redis.zscore(`leaderboard:daily:${date}`, username)
        userRank = {
          rank: rank + 1,
          username,
          points: Number(points as string),
        }
      }
    }

    return NextResponse.json({ leaderboard, userRank, date })
  } catch (error) {
    console.error("Daily leaderboard error:", error)
    return NextResponse.json({ error: "Failed to fetch daily leaderboard" }, { status: 500 })
  }
}
