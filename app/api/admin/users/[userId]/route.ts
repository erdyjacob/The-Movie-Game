import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"

export async function DELETE(request: Request, { params }: { params: { userId: string } }) {
  try {
    const userId = params.userId

    // Get username to remove from leaderboard
    const username = await redis.hget(`user:${userId}`, "username")

    if (username) {
      // Remove from usernames set
      await redis.srem("usernames", username)

      // Remove from leaderboard
      await redis.zrem("leaderboard:points", username)

      // Remove from daily challenge leaderboard if exists
      const today = new Date().toISOString().split("T")[0]
      await redis.zrem(`leaderboard:daily:${today}`, username)
    }

    // Delete user data
    await redis.del(`user:${userId}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { userId: string } }) {
  try {
    const userId = params.userId
    const { username } = await request.json()

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 })
    }

    if (username.length > 10) {
      return NextResponse.json({ error: "Username must be 10 characters or less" }, { status: 400 })
    }

    // Get current username
    const currentUsername = await redis.hget(`user:${userId}`, "username")

    if (!currentUsername) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if new username already exists (and it's not the same user)
    if (currentUsername !== username) {
      const exists = await redis.sismember("usernames", username)
      if (exists) {
        return NextResponse.json({ error: "Username already taken" }, { status: 400 })
      }
    }

    // Update username in user data
    await redis.hset(`user:${userId}`, "username", username)

    // Update usernames set
    if (currentUsername !== username) {
      await redis.srem("usernames", currentUsername)
      await redis.sadd("usernames", username)
    }

    // Update leaderboard
    const points = await redis.hget(`user:${userId}`, "points")
    if (points) {
      await redis.zrem("leaderboard:points", currentUsername)
      await redis.zadd("leaderboard:points", { score: Number.parseInt(points), member: username })

      // Update daily challenge leaderboard if exists
      const today = new Date().toISOString().split("T")[0]
      const dailyScore = await redis.zscore(`leaderboard:daily:${today}`, currentUsername)
      if (dailyScore) {
        await redis.zrem(`leaderboard:daily:${today}`, currentUsername)
        await redis.zadd(`leaderboard:daily:${today}`, {
          score: Number.parseInt(dailyScore as string),
          member: username,
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating username:", error)
    return NextResponse.json({ error: "Failed to update username" }, { status: 500 })
  }
}
