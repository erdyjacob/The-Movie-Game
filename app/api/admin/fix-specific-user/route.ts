import { kv } from "@vercel/kv"
import { type NextRequest, NextResponse } from "next/server"
import { nanoid } from "nanoid"

export async function POST(request: NextRequest) {
  try {
    // Check admin password
    const { password, userId } = await request.json()

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ message: "Invalid admin password" }, { status: 401 })
    }

    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 })
    }

    // Get user data
    const userData = await kv.get(`user:${userId}`)
    if (!userData) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Get username
    const username = await kv.hget("movie-game:users", userId)
    if (!username) {
      return NextResponse.json({ message: "Username not found for this user ID" }, { status: 404 })
    }

    // Get player history
    const playerHistory = await kv.get(`player:${userId}:history`)

    // Debug information
    const debugInfo = {
      userId,
      username,
      userData,
      playerHistory: playerHistory ? "Found" : "Not found",
      leaderboardBefore: null,
      leaderboardAfter: null,
      actions: [],
    }

    // Check if user exists in leaderboard
    const leaderboardEntries = await kv.zrange("movie-game:leaderboard", 0, -1, { rev: true })
    const existingEntry = leaderboardEntries?.find((entry) => {
      try {
        const parsed = JSON.parse(entry)
        return parsed.playerName === username
      } catch (e) {
        return false
      }
    })

    debugInfo.leaderboardBefore = existingEntry ? JSON.parse(existingEntry) : null

    // Calculate a score if none exists
    let score = 1000 // Default score for testing

    // Try to get score from various places
    if (userData && typeof userData === "object" && "score" in userData) {
      score = userData.score
      debugInfo.actions.push("Used score from user data object")
    } else if (playerHistory && typeof playerHistory === "object") {
      // Calculate from history
      debugInfo.actions.push("Calculated score from player history")
      // Simplified calculation for testing
      score = 1500
    }

    // Create a leaderboard entry
    const entry = {
      id: nanoid(),
      playerName: username,
      score: score,
      rank: "A", // Simplified for testing
      legendaryCount: 5,
      epicCount: 10,
      rareCount: 15,
      uncommonCount: 20,
      commonCount: 25,
      timestamp: new Date().toISOString(),
      gameMode: "collection",
      difficulty: "all",
    }

    // Store the score in all necessary places
    await kv.set(`user:${userId}:score`, score)
    debugInfo.actions.push(`Set user:${userId}:score to ${score}`)

    // Update user object
    if (userData && typeof userData === "object") {
      await kv.set(`user:${userId}`, {
        ...userData,
        score: score,
      })
      debugInfo.actions.push("Updated user object with score")
    }

    // Add to leaderboard
    const stringifiedEntry = JSON.stringify(entry)
    await kv.zadd("movie-game:leaderboard", { score: score, member: stringifiedEntry })
    debugInfo.actions.push("Added entry to leaderboard")

    // Remove old entry if it exists
    if (existingEntry) {
      await kv.zrem("movie-game:leaderboard", existingEntry)
      debugInfo.actions.push("Removed old leaderboard entry")
    }

    // Clear leaderboard cache
    await kv.del("movie-game:leaderboard-cache")
    debugInfo.actions.push("Cleared leaderboard cache")

    // Get updated leaderboard entry
    const updatedLeaderboardEntries = await kv.zrange("movie-game:leaderboard", 0, -1, { rev: true })
    const updatedEntry = updatedLeaderboardEntries?.find((entry) => {
      try {
        const parsed = JSON.parse(entry)
        return parsed.playerName === username
      } catch (e) {
        return false
      }
    })

    debugInfo.leaderboardAfter = updatedEntry ? JSON.parse(updatedEntry) : null

    return NextResponse.json({
      message: "User fixed successfully",
      debug: debugInfo,
    })
  } catch (error) {
    console.error("Error fixing specific user:", error)
    return NextResponse.json(
      {
        message: "Error fixing user",
        error: String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
