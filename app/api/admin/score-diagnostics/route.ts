import { kv } from "@vercel/kv"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Check admin password
    const { password } = await request.json()
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ message: "Invalid admin password" }, { status: 401 })
    }

    // Scan for all keys that might contain scores
    const results: Record<string, any> = {}

    // 1. Check leaderboard entries
    const leaderboardEntries = await kv.zrange("movie-game:leaderboard", 0, -1, { withScores: true })
    results.leaderboard = {
      count: leaderboardEntries.length / 2,
      entries: leaderboardEntries,
    }

    // 2. Check user:*:score keys
    const userScoreKeys = await kv.keys("user:*:score")
    const userScores = userScoreKeys.length > 0 ? await kv.mget(...userScoreKeys) : []
    results.userScoreKeys = {
      count: userScoreKeys.length,
      keys: userScoreKeys,
      values: userScores,
    }

    // 3. Check user objects for embedded scores
    const userKeys = await kv.keys("user:*")
    const filteredUserKeys = userKeys.filter((key) => !key.endsWith(":score"))
    const userObjects = filteredUserKeys.length > 0 ? await kv.mget(...filteredUserKeys) : []

    const usersWithScores = []
    for (let i = 0; i < filteredUserKeys.length; i++) {
      const user = userObjects[i]
      if (user && typeof user === "object" && "score" in user) {
        usersWithScores.push({
          key: filteredUserKeys[i],
          score: user.score,
          user,
        })
      }
    }

    results.userObjects = {
      count: filteredUserKeys.length,
      usersWithScores: {
        count: usersWithScores.length,
        entries: usersWithScores,
      },
    }

    // 4. Check player history for scores
    const playerHistoryKeys = await kv.keys("player:*:history")
    results.playerHistory = {
      count: playerHistoryKeys.length,
      keys: playerHistoryKeys,
    }

    // 5. Check if there are any other score-related keys
    const allScoreKeys = await kv.keys("*score*")
    const otherScoreKeys = allScoreKeys.filter((key) => !userScoreKeys.includes(key) && !key.includes("leaderboard"))
    results.otherScoreKeys = {
      count: otherScoreKeys.length,
      keys: otherScoreKeys,
    }

    return NextResponse.json({
      message: "Score diagnostics completed",
      results,
    })
  } catch (error) {
    console.error("Error in score diagnostics:", error)
    return NextResponse.json({ message: "Error running diagnostics", error: String(error) }, { status: 500 })
  }
}
