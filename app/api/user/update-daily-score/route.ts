import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"

export async function POST(request: Request) {
  try {
    const { userId, score, date } = await request.json()

    if (!userId || typeof score !== "number") {
      return NextResponse.json({ success: false, error: "Invalid request" })
    }

    // Use provided date or today's date
    const challengeDate = date || new Date().toISOString().split("T")[0]

    // Get username
    const username = await redis.hget(`user:${userId}`, "username")
    if (!username) {
      return NextResponse.json({ success: false, error: "User not found" })
    }

    // Update user's last active timestamp
    await redis.hset(`user:${userId}`, "lastActive", Date.now())

    // Update daily challenge leaderboard
    await redis.zadd(`leaderboard:daily:${challengeDate}`, { score, member: username })

    // Set expiry for daily leaderboard (keep for 30 days)
    await redis.expire(`leaderboard:daily:${challengeDate}`, 30 * 24 * 60 * 60)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update daily score error:", error)
    return NextResponse.json({ success: false, error: "Failed to update daily score" }, { status: 500 })
  }
}
