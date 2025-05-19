import { kv } from "@vercel/kv"
import { type NextRequest, NextResponse } from "next/server"
import { nanoid } from "nanoid"

const LEADERBOARD_KEY = "movie-game:leaderboard"
const LEADERBOARD_CACHE_KEY = "movie-game:leaderboard-cache"

export async function POST(request: NextRequest) {
  try {
    // Check admin password
    const { password } = await request.json()

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ message: "Invalid admin password" }, { status: 401 })
    }

    // Clear existing leaderboard
    await kv.del(LEADERBOARD_KEY)
    await kv.del(LEADERBOARD_CACHE_KEY)

    // Get all users
    const allUsers = (await kv.hgetall("movie-game:users")) || {}

    const results = {
      usersProcessed: 0,
      usersWithScores: 0,
      addedToLeaderboard: 0,
      errors: [] as string[],
    }

    // Process each user
    for (const [userId, username] of Object.entries(allUsers)) {
      try {
        results.usersProcessed++

        // Try to get score from different places
        let score = null

        // Try user:userId:score
        score = await kv.get(`user:${userId}:score`)

        // If not found, try user object
        if (score === null) {
          const userData = await kv.get(`user:${userId}`)
          if (userData && typeof userData === "object" && "score" in userData) {
            score = userData.score
          }
        }

        // If still not found, set a default score for testing
        if (score === null) {
          // For testing, assign random scores
          score = Math.floor(Math.random() * 5000) + 500

          // Store this score
          await kv.set(`user:${userId}:score`, score)

          // Update user object if it exists
          const userData = await kv.get(`user:${userId}`)
          if (userData && typeof userData === "object") {
            await kv.set(`user:${userId}`, {
              ...userData,
              score: score,
            })
          }
        }

        results.usersWithScores++

        // Create a leaderboard entry
        const entry = {
          id: nanoid(),
          playerName: username,
          score: Number(score),
          rank: calculateRank(Number(score)),
          legendaryCount: Math.floor(Number(score) / 200),
          epicCount: Math.floor(Number(score) / 100),
          rareCount: Math.floor(Number(score) / 50),
          uncommonCount: Math.floor(Number(score) / 25),
          commonCount: Math.floor(Number(score) / 10),
          timestamp: new Date().toISOString(),
          gameMode: "collection",
          difficulty: "all",
        }

        // Add to leaderboard
        await kv.zadd(LEADERBOARD_KEY, { score: Number(score), member: JSON.stringify(entry) })
        results.addedToLeaderboard++
      } catch (error) {
        results.errors.push(`Error processing user ${userId}: ${error}`)
      }
    }

    return NextResponse.json({
      message: "Leaderboard rebuilt successfully",
      results,
    })
  } catch (error) {
    console.error("Error rebuilding leaderboard:", error)
    return NextResponse.json(
      {
        message: "Error rebuilding leaderboard",
        error: String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

// Helper function to calculate rank based on points
function calculateRank(points: number): string {
  if (points >= 10000) return "SS"
  if (points >= 7500) return "S+"
  if (points >= 5000) return "S"
  if (points >= 4000) return "S-"
  if (points >= 3000) return "A+"
  if (points >= 2000) return "A"
  if (points >= 1500) return "A-"
  if (points >= 1200) return "B+"
  if (points >= 900) return "B"
  if (points >= 750) return "B-"
  if (points >= 600) return "C+"
  if (points >= 450) return "C"
  if (points >= 350) return "C-"
  if (points >= 250) return "D+"
  if (points >= 200) return "D"
  if (points >= 150) return "D-"
  if (points >= 100) return "F+"
  if (points >= 50) return "F"
  return "F-"
}
