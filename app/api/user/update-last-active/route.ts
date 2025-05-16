import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ success: false, error: "Invalid request" })
    }

    // Update last active timestamp
    await redis.hset(`user:${userId}`, "lastActive", Date.now())

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update last active error:", error)
    return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 })
  }
}
