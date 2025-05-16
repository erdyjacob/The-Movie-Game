import { NextResponse } from "next/server"
import { redis, calculatePoints } from "@/lib/redis"

export async function POST(request: Request) {
  try {
    const { userId, stats } = await request.json()

    if (!userId || !stats) {
      return NextResponse.json({ success: false, error: "Invalid request" })
    }

    // Calculate points using the same formula as PlayerStats
    const points = calculatePoints(stats)

    // Get username
    const username = await redis.hget(`user:${userId}`, "username")
    if (!username) {
      return NextResponse.json({ success: false, error: "User not found" })
    }

    // Update user data
    await redis.hset(`user:${userId}`, {
      points,
      lastActive: Date.now(),
      gameStats: JSON.stringify(stats),
    })

    // Update leaderboard
    await redis.zadd("leaderboard:points", { score: points, member: username })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update score error:", error)
    return NextResponse.json({ success: false, error: "Failed to update score" }, { status: 500 })
  }
}
