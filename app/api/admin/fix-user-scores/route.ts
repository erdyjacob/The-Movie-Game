import { kv } from "@vercel/kv"
import { type NextRequest, NextResponse } from "next/server"
import { updateLeaderboardWithTotalPoints } from "@/lib/leaderboard"
import { calculateAccountScore } from "@/lib/rank-calculator"

export async function POST(request: NextRequest) {
  try {
    // Check admin password
    const { password } = await request.json()
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ message: "Invalid admin password" }, { status: 401 })
    }

    const results = {
      usersProcessed: 0,
      scoresFixed: 0,
      leaderboardUpdates: 0,
      errors: [] as string[],
    }

    // 1. Get all users from the hash
    const allUsers = (await kv.hgetall("movie-game:users")) || {}
    const userEntries = Object.entries(allUsers)
    results.usersProcessed = userEntries.length

    // 2. Process each user
    for (const [userId, username] of userEntries) {
      try {
        // Get user data
        const userData = await kv.get(`user:${userId}`)

        // Get player history to calculate score
        const playerHistory = await kv.get(`player:${userId}:history`)

        // Calculate score from history if available
        let score = null
        if (playerHistory && typeof playerHistory === "object") {
          const movies = Array.isArray(playerHistory.movies) ? playerHistory.movies : []
          const actors = Array.isArray(playerHistory.actors) ? playerHistory.actors : []

          // Count items by rarity
          let legendaryCount = 0
          let epicCount = 0
          let rareCount = 0
          let uncommonCount = 0
          let commonCount = 0

          // Count movies by rarity
          movies.forEach((movie: any) => {
            if (!movie.rarity) return
            switch (movie.rarity) {
              case "legendary":
                legendaryCount++
                break
              case "epic":
                epicCount++
                break
              case "rare":
                rareCount++
                break
              case "uncommon":
                uncommonCount++
                break
              case "common":
                commonCount++
                break
            }
          })

          // Count actors by rarity
          actors.forEach((actor: any) => {
            if (!actor.rarity) return
            switch (actor.rarity) {
              case "legendary":
                legendaryCount++
                break
              case "epic":
                epicCount++
                break
              case "rare":
                rareCount++
                break
              case "uncommon":
                uncommonCount++
                break
              case "common":
                commonCount++
                break
            }
          })

          // Use the standardized calculation function
          const accountScore = calculateAccountScore(
            legendaryCount,
            epicCount,
            rareCount,
            uncommonCount,
            commonCount,
            0, // dailyChallengesCompleted - default to 0
            movies.length,
            actors.length,
          )

          // Store the score
          await kv.set(`user:${userId}:score`, accountScore.points)

          // Store the full account score
          await kv.set(`user:${userId}:accountScore`, accountScore)

          // Update user object if it exists
          if (userData && typeof userData === "object") {
            await kv.set(`user:${userId}`, {
              ...userData,
              score: accountScore.points,
              accountScore,
            })
          }

          // Update leaderboard WITH userId parameter
          await updateLeaderboardWithTotalPoints(username as string, accountScore, userId)

          score = accountScore.points
          results.scoresFixed++
          results.leaderboardUpdates++
        } else if (userData && typeof userData === "object" && "score" in userData) {
          // User already has a score in their object, make sure it's in all the right places
          score = userData.score

          // Ensure score is stored in dedicated key
          await kv.set(`user:${userId}:score`, score)

          // Update leaderboard if account score exists WITH userId parameter
          if ("accountScore" in userData && typeof userData.accountScore === "object") {
            await updateLeaderboardWithTotalPoints(username as string, userData.accountScore, userId)
            results.leaderboardUpdates++
          }

          results.scoresFixed++
        }
      } catch (error) {
        results.errors.push(`Error processing user ${userId}: ${error}`)
      }
    }

    return NextResponse.json({
      message: "User score fix completed",
      results,
    })
  } catch (error) {
    console.error("Error fixing user scores:", error)
    return NextResponse.json({ message: "Error fixing user scores", error: String(error) }, { status: 500 })
  }
}
