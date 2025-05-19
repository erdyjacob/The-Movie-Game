import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { adminAuth } from "@/middleware/admin-auth"

export async function POST(request: Request) {
  // Check if the request is from an admin
  const authResult = await adminAuth(request)
  if (authResult) {
    return authResult
  }

  try {
    // Get all users with scores
    const userScoreKeys = await kv.keys("user:*:score")
    const userAccountScoreKeys = await kv.keys("user:*:accountScore")

    // Get all game history entries
    const gameHistoryKeys = await kv.keys("user:*:games")

    // Get leaderboard entries
    const leaderboardEntries = await kv.zrevrange("leaderboard", 0, -1, "WITHSCORES")

    // Sample recent games (up to 10)
    let recentGames: any[] = []

    if (gameHistoryKeys.length > 0) {
      const sampleKey = gameHistoryKeys[0]
      const games = await kv.lrange(sampleKey, 0, 9)
      recentGames = games.map((g) => JSON.parse(g))
    }

    return NextResponse.json({
      status: "success",
      stats: {
        userScoreKeysCount: userScoreKeys.length,
        userAccountScoreKeysCount: userAccountScoreKeys.length,
        gameHistoryKeysCount: gameHistoryKeys.length,
        leaderboardEntriesCount: leaderboardEntries.length / 2, // Each entry has a score
        recentGames: recentGames,
      },
    })
  } catch (error) {
    console.error("Error getting score sync status:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
