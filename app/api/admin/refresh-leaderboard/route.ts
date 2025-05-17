import { kv } from "@vercel/kv"
import { type NextRequest, NextResponse } from "next/server"

const LEADERBOARD_CACHE_KEY = "movie-game:leaderboard-cache"

export async function POST(request: NextRequest) {
  try {
    // Check admin password
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    if (token !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ message: "Invalid admin password" }, { status: 401 })
    }

    // Delete the leaderboard cache to force a refresh on next fetch
    await kv.del(LEADERBOARD_CACHE_KEY)

    return NextResponse.json({
      message: "Leaderboard cache cleared. The leaderboard will refresh on next view.",
      success: true,
    })
  } catch (error) {
    console.error("Error refreshing leaderboard:", error)
    return NextResponse.json({ message: "Failed to refresh leaderboard" }, { status: 500 })
  }
}
