import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@vercel/kv"

export async function POST(request: NextRequest) {
  try {
    const { userId, username, achievements } = await request.json()

    if (!userId || !username || !achievements) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    console.log(`[API] Syncing achievements for ${username} (${userId})`)

    // Store achievements in Redis
    const achievementKey = `user:${userId}:achievements`
    await kv.hset(achievementKey, { achievements: JSON.stringify(achievements) })

    console.log(`[API] Successfully synced ${achievements.length} achievements for ${username}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error syncing achievements:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const username = searchParams.get("username")

    if (!userId || !username) {
      return NextResponse.json({ success: false, message: "Missing userId or username" }, { status: 400 })
    }

    console.log(`[API] Loading achievements for ${username} (${userId})`)

    // Load achievements from Redis
    const achievementKey = `user:${userId}:achievements`
    const data = await kv.hget(achievementKey, "achievements")

    let achievements = null
    if (data) {
      try {
        achievements = JSON.parse(data as string)
      } catch (error) {
        console.error("Error parsing achievements data:", error)
      }
    }

    return NextResponse.json({ success: true, achievements })
  } catch (error) {
    console.error("Error loading achievements:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
