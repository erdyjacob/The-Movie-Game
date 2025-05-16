import { NextResponse } from "next/server"
import { redis, getUserRank, getUserScore } from "@/lib/redis"

export async function GET(request: Request) {
  try {
    // Get top 10 from leaderboard
    const leaderboardData = await redis.zrevrange("leaderboard:points", 0, 9, { withScores: true })

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
    const url = new URL(request.url)
    const username = url.searchParams.get("username")

    if (username) {
      const rank = await getUserRank(username)
      if (rank !== null) {
        const points = await getUserScore(username)
        userRank = {
          rank,
          username,
          points,
        }
      }
    }

    return NextResponse.json({ leaderboard, userRank })
  } catch (error) {
    console.error("Leaderboard error:", error)
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
  }
}
