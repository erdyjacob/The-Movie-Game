import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"

export async function POST(request: Request) {
  try {
    const { userId, username } = await request.json()

    if (!userId || !username) {
      return NextResponse.json({ success: false, error: "Invalid request" })
    }

    // Check if user exists
    const exists = await redis.exists(`user:${userId}`)
    if (!exists) {
      return NextResponse.json({ success: false, error: "User not found" })
    }

    // Verify username matches
    const storedUsername = await redis.hget(`user:${userId}`, "username")
    if (storedUsername !== username) {
      return NextResponse.json({ success: false, error: "Username mismatch" })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("User verification error:", error)
    return NextResponse.json({ success: false, error: "Verification failed" }, { status: 500 })
  }
}
