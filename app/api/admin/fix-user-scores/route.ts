import { kv } from "@vercel/kv"
import { type NextRequest, NextResponse } from "next/server"
import { updateLeaderboardWithTotalPoints } from "@/lib/leaderboard"

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

          // Calculate rarity counts
          const rarityPoints = {
            legendary: 1000,
            epic: 500,
            rare: 250,
            uncommon: 100,
            common: 50,
          }

          let totalPoints = 0
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
                totalPoints += rarityPoints.legendary
                break
              case "epic":
                epicCount++
                totalPoints += rarityPoints.epic
                break
              case "rare":
                rareCount++
                totalPoints += rarityPoints.rare
                break
              case "uncommon":
                uncommonCount++
                totalPoints += rarityPoints.uncommon
                break
              case "common":
                commonCount++
                totalPoints += rarityPoints.common
                break
            }
          })

          // Count actors by rarity
          actors.forEach((actor: any) => {
            if (!actor.rarity) return

            switch (actor.rarity) {
              case "legendary":
                legendaryCount++
                totalPoints += rarityPoints.legendary
                break
              case "epic":
                epicCount++
                totalPoints += rarityPoints.epic
                break
              case "rare":
                rareCount++
                totalPoints += rarityPoints.rare
                break
              case "uncommon":
                uncommonCount++
                totalPoints += rarityPoints.uncommon
                break
              case "common":
                commonCount++
                totalPoints += rarityPoints.common
                break
            }
          })

          // Create account score object
          const accountScore = {
            points: totalPoints,
            rank: calculateRank(totalPoints),
            legendaryCount,
            epicCount,
            rareCount,
            uncommonCount,
            commonCount,
            totalItems: movies.length + actors.length,
            dailyChallengesCompleted: 0, // Default value
          }

          // Store the score
          await kv.set(`user:${userId}:score`, totalPoints)

          // Store the full account score
          await kv.set(`user:${userId}:accountScore`, accountScore)

          // Update user object if it exists
          if (userData && typeof userData === "object") {
            await kv.set(`user:${userId}`, {
              ...userData,
              score: totalPoints,
              accountScore,
            })
          }

          // Update leaderboard
          await updateLeaderboardWithTotalPoints(username as string, accountScore)

          score = totalPoints
          results.scoresFixed++
          results.leaderboardUpdates++
        } else if (userData && typeof userData === "object" && "score" in userData) {
          // User already has a score in their object, make sure it's in all the right places
          score = userData.score

          // Ensure score is stored in dedicated key
          await kv.set(`user:${userId}:score`, score)

          // Update leaderboard if account score exists
          if ("accountScore" in userData && typeof userData.accountScore === "object") {
            await updateLeaderboardWithTotalPoints(username as string, userData.accountScore)
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

// Helper function to calculate rank based on points
function calculateRank(points: number): string {
  if (points >= 50000) return "SS"
  if (points >= 40000) return "S+"
  if (points >= 30000) return "S"
  if (points >= 25000) return "S-"
  if (points >= 20000) return "A+"
  if (points >= 15000) return "A"
  if (points >= 12000) return "A-"
  if (points >= 10000) return "B+"
  if (points >= 8000) return "B"
  if (points >= 6000) return "B-"
  if (points >= 5000) return "C+"
  if (points >= 4000) return "C"
  if (points >= 3000) return "C-"
  if (points >= 2000) return "D+"
  if (points >= 1000) return "D"
  if (points >= 500) return "D-"
  if (points >= 250) return "F+"
  if (points >= 100) return "F"
  return "F-"
}
