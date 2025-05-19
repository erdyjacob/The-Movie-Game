import { type NextRequest, NextResponse } from "next/server"
import { adminAuth } from "@/middleware/admin-auth"
import { kv } from "@vercel/kv"

// Update keys to match those in lib/leaderboard.ts
const LEADERBOARD_KEY = "movie-game:leaderboard"
const LEADERBOARD_CACHE_KEY = "movie-game:leaderboard-cache"

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResponse = await adminAuth(request)
    if (authResponse) {
      return authResponse
    }

    // Clear the leaderboard
    await kv.del(LEADERBOARD_KEY)

    // Also clear the leaderboard cache
    await kv.del(LEADERBOARD_CACHE_KEY)

    console.log(`[Admin] Leaderboard cleared: ${LEADERBOARD_KEY} and ${LEADERBOARD_CACHE_KEY}`)
    return NextResponse.json({ success: true, message: "Leaderboard cleared successfully" })
  } catch (error) {
    console.error("Error clearing leaderboard:", error)
    return NextResponse.json({ error: "Failed to clear leaderboard" }, { status: 500 })
  }
}
