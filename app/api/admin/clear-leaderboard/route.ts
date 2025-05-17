import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@vercel/kv"

const LEADERBOARD_KEY = "movie-game:leaderboard"
const LEADERBOARD_CACHE_KEY = "movie-game:leaderboard-cache"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"

export async function POST(request: NextRequest) {
  try {
    // Check admin password
    const { password } = await request.json()

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Clear the leaderboard
    await kv.del(LEADERBOARD_KEY)

    // Also clear the cache
    await kv.del(LEADERBOARD_CACHE_KEY)

    return NextResponse.json({
      success: true,
      message: "Leaderboard cleared successfully",
    })
  } catch (error) {
    console.error("Error clearing leaderboard:", error)
    return NextResponse.json({ success: false, message: "Failed to clear leaderboard" }, { status: 500 })
  }
}
