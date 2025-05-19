import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

export async function DELETE(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 })
    }

    // Get the username associated with this userId
    const username = await kv.get(`user:${userId}:username`)

    if (!username) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // Delete user data from Redis
    const deletePromises = [
      // Delete user mapping
      kv.del(`user:${userId}:username`),
      kv.del(`username:${username}`),

      // Delete user scores and history
      kv.del(`user:${userId}:scores`),
      kv.del(`user:${userId}:history`),
      kv.del(`user:${userId}:collection`),
      kv.del(`user:${userId}:dailyChallenges`),

      // Remove from leaderboard
      kv.zrem("leaderboard", userId),
    ]

    await Promise.all(deletePromises)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user account:", error)
    return NextResponse.json({ success: false, message: "Failed to delete account" }, { status: 500 })
  }
}
