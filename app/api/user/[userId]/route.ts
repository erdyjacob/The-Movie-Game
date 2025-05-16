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
