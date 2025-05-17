import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { getAuthToken } from "@/lib/admin-utils"
import type { AccountScore } from "@/lib/types"
import { updateLeaderboardWithTotalPoints } from "@/lib/leaderboard"

// Constants
const LEADERBOARD_KEY = "movie-game:leaderboard"
const LEADERBOARD_CACHE_KEY = "movie-game:leaderboard-cache"

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
      scannedUsers: 0,
      updatedEntries: 0,
      skippedUsers: 0,
      errors: [] as string[],
      fixedUserIds: [] as string[],
    }

    // 1. Get all user keys
    const userKeys = await kv.keys("user:*")
    results.scannedUsers = userKeys.length

    // Filter out keys that aren't direct user records (like user:123:score)
    const directUserKeys = userKeys.filter((key) => {
      const parts = key.split(":")
      return parts.length === 2 && parts[0] === "user"
    })

    // 2. Process each user
    for (const userKey of directUserKeys) {
      try {
        const userId = userKey.replace("user:", "")
        const userData = (await kv.get(userKey)) as any

        if (!userData || !userData.username) {
          results.skippedUsers++
          results.errors.push(`User ${userId} has no username in data`)
          continue
        }

        // 3. Get user's score data
        const scoreKey = `user:${userId}:score`
        const scoreData = (await kv.get(scoreKey)) as AccountScore | null

        if (!scoreData || !scoreData.points) {
          results.skippedUsers++
          continue // Skip users with no score
        }

        // 4. Update the leaderboard with this user's data
        const success = await updateLeaderboardWithTotalPoints(userData.username, scoreData)

        if (success) {
          results.updatedEntries++
          results.fixedUserIds.push(userId)
        } else {
          results.errors.push(`Failed to update leaderboard for user ${userId} (${userData.username})`)
        }
      } catch (error) {
        results.errors.push(`Error processing user key ${userKey}: ${error}`)
      }
    }

    // 5. Invalidate the leaderboard cache to ensure fresh data
    await kv.del(LEADERBOARD_CACHE_KEY)

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error("Error in leaderboard repair:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
