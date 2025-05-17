import { type NextRequest, NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { generateRandomLeaderboardEntries } from "@/lib/fake-data-generator"

const LEADERBOARD_KEY = "movie-game:leaderboard"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"

export async function POST(request: NextRequest) {
  try {
    // Check admin password
    const { password, count = 20 } = await request.json()

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    // Clear existing leaderboard
    await kv.del(LEADERBOARD_KEY)

    // Generate random entries
    const entries = generateRandomLeaderboardEntries(count)

    // Add entries to leaderboard
    const pipeline = kv.pipeline()

    for (const entry of entries) {
      pipeline.zadd(LEADERBOARD_KEY, { score: entry.score, member: JSON.stringify(entry) })
    }

    await pipeline.exec()

    return NextResponse.json({
      success: true,
      message: `Successfully populated leaderboard with ${count} entries`,
      count,
    })
  } catch (error) {
    console.error("Error populating leaderboard:", error)
    return NextResponse.json({ success: false, message: "Failed to populate leaderboard" }, { status: 500 })
  }
}
