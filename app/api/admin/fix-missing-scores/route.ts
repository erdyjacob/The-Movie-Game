import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { getAuthToken } from "@/lib/admin-utils"
import { calculateScoreFromHistory } from "@/lib/score-tracking"
import type { PlayerHistory } from "@/lib/types"

export async function POST(request: Request) {
  try {
    // Check for admin authorization
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const isAuthorized = (await getAuthToken()) === token

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const results = {
      usersProcessed: 0,
      missingScores: 0,
      scoresCreated: 0,
      errors: [] as string[],
      fixedUserIds: [] as string[],
    }

    // 1. Get all users from the hash
    const allUsers = (await kv.hgetall("movie-game:users")) || {}
    const userEntries = Object.entries(allUsers)
    results.usersProcessed = userEntries.length

    // 2. Process each user
    for (const [userId, username] of userEntries) {
      try {
        // Check if user has a score object
        const scoreExists = await kv.exists(`user:${userId}:score`)

        if (!scoreExists) {
          results.missingScores++

          // Get user data
          const userData = await kv.get(`user:${userId}`)

          // Check if user already has a score in their user object
          if (userData && typeof userData === "object" && "score" in userData) {
            // User has a score in their object, create the dedicated score key
            await kv.set(`user:${userId}:score`, userData.score)

            // If they have an account score, store that too
            if ("accountScore" in userData && typeof userData.accountScore === "object") {
              await kv.set(`user:${userId}:accountScore`, userData.accountScore)
            }

            results.scoresCreated++
            results.fixedUserIds.push(userId)
            continue
          }

          // No score in user object, try to calculate from history
          const playerHistory = (await kv.get(`player:${userId}:history`)) as PlayerHistory

          if (playerHistory) {
            // Calculate score from history
            const accountScore = await calculateScoreFromHistory(userId, username as string, playerHistory)

            if (accountScore) {
              // Store the score in dedicated key
              await kv.set(`user:${userId}:score`, accountScore.points)

              // Store the full account score
              await kv.set(`user:${userId}:accountScore`, accountScore)

              // Update the user object
              if (userData && typeof userData === "object") {
                await kv.set(`user:${userId}`, {
                  ...userData,
                  score: accountScore.points,
                  accountScore,
                  lastScoreUpdate: new Date().toISOString(),
                })
              }

              results.scoresCreated++
              results.fixedUserIds.push(userId)
            } else {
              results.errors.push(`Failed to calculate score for user ${userId}`)
            }
          } else {
            results.errors.push(`No history found for user ${userId}`)
          }
        }
      } catch (error) {
        results.errors.push(`Error processing user ${userId}: ${error}`)
      }
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error("Error fixing missing scores:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
