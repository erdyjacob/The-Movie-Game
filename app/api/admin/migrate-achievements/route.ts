import { kv } from "@vercel/kv"
import { type NextRequest, NextResponse } from "next/server"
import { checkAchievements, initializeAchievements } from "@/lib/achievements"
import { getPlayerLeaderboardRank } from "@/lib/leaderboard"
import type { AccountScore } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    // Check admin password
    const { password } = await request.json()
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ message: "Invalid admin password" }, { status: 401 })
    }

    console.log("Starting achievement migration...")

    // Get all user keys
    const userKeys = await kv.keys("user:*")
    console.log(`Found ${userKeys.length} users to migrate`)

    let migratedCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Process each user
    for (const userKey of userKeys) {
      try {
        const userId = userKey.replace("user:", "")

        // Skip if this doesn't look like a valid user ID
        if (userId.includes(":") || userId.length < 10) {
          continue
        }

        // Get user data
        const userData = await kv.get(userKey)
        if (!userData || typeof userData !== "object") {
          continue
        }

        const username = userData.username
        if (!username) {
          continue
        }

        // Get user's account score
        let accountScore: AccountScore | null = null

        // Try to get from dedicated score key first
        const scoreData = await kv.get(`user:${userId}:accountScore`)
        if (scoreData && typeof scoreData === "object") {
          accountScore = scoreData as AccountScore
        } else if (userData.accountScore) {
          accountScore = userData.accountScore as AccountScore
        }

        if (!accountScore) {
          console.log(`No account score found for user ${username} (${userId})`)
          continue
        }

        // Get user's leaderboard rank
        const leaderboardRank = await getPlayerLeaderboardRank(username)

        // Initialize fresh achievements
        const achievements = initializeAchievements()

        // Check which achievements should be unlocked based on current stats
        const { achievements: updatedAchievements } = checkAchievements(achievements, accountScore, leaderboardRank)

        // Save achievements to user profile
        await kv.set(`user:${userId}:achievements`, updatedAchievements)

        // Update user object with achievements
        await kv.set(userKey, {
          ...userData,
          achievements: updatedAchievements,
          achievementsMigrated: true,
          achievementsMigratedAt: new Date().toISOString(),
        })

        migratedCount++

        // Log progress every 10 users
        if (migratedCount % 10 === 0) {
          console.log(`Migrated ${migratedCount} users...`)
        }
      } catch (err) {
        errorCount++
        const errorMsg = `Error processing ${userKey}: ${err instanceof Error ? err.message : String(err)}`
        errors.push(errorMsg)
        console.error(errorMsg)
      }
    }

    console.log(`Achievement migration completed. Migrated: ${migratedCount}, Errors: ${errorCount}`)

    return NextResponse.json({
      success: true,
      message: `Migration completed successfully. Migrated ${migratedCount} users.`,
      migratedCount,
      errorCount,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Limit errors shown
    })
  } catch (error) {
    console.error("Error during achievement migration:", error)
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred during migration",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
