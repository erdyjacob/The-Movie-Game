import { kv } from "@vercel/kv"
import { type NextRequest, NextResponse } from "next/server"
import { adminAuth } from "@/middleware/admin-auth"

// Keys to be deleted
const KEY_PATTERNS = [
  // User data
  "movie-game:users",
  "movie-game:usernames",
  "movie-game:banned-usernames",
  "username:*",
  "user:*",

  // Leaderboard
  "movie-game:leaderboard",
  "movie-game:leaderboard-cache",

  // Game tracking
  "user-games:*",
  "game:*",
  "player:*:history",
  "user-stats:*",

  // Enhanced tracking
  "enhanced-game:*",
  "user-enhanced-games:*",
  "user-analytics:*",
  "session:*",

  // Daily challenges
  "user:*:daily-challenges",

  // Achievements
  "user:*:achievements",
]

// Keys to reset (not delete)
const RESET_COUNTERS = ["movie-game:game-counter"]

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authResponse = await adminAuth(request)
    if (authResponse) {
      return authResponse
    }

    const { password, confirmText } = await request.json()

    // Double-check password and confirmation text
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, message: "Invalid admin password" }, { status: 401 })
    }

    if (confirmText !== "CONFIRM CLEAN SLATE") {
      return NextResponse.json(
        { success: false, message: "Confirmation text does not match 'CONFIRM CLEAN SLATE'" },
        { status: 400 },
      )
    }

    console.log("🚨 INITIATING CLEAN SLATE OPERATION 🚨")
    const results: Record<string, any> = {}
    let totalKeysDeleted = 0

    // Process each key pattern
    for (const pattern of KEY_PATTERNS) {
      try {
        console.log(`Scanning for keys matching pattern: ${pattern}`)

        // If pattern has a wildcard, use scan
        if (pattern.includes("*")) {
          const keys = await kv.keys(pattern)
          console.log(`Found ${keys.length} keys matching ${pattern}`)

          if (keys.length > 0) {
            // Delete in batches to avoid timeouts
            const batchSize = 100
            for (let i = 0; i < keys.length; i += batchSize) {
              const batch = keys.slice(i, i + batchSize)
              const pipeline = kv.pipeline()

              batch.forEach((key) => {
                pipeline.del(key)
              })

              await pipeline.exec()
              totalKeysDeleted += batch.length
              console.log(`Deleted batch of ${batch.length} keys (${i + batch.length}/${keys.length})`)
            }

            results[pattern] = keys.length
          } else {
            results[pattern] = 0
          }
        } else {
          // Direct key deletion
          const deleted = await kv.del(pattern)
          results[pattern] = deleted
          totalKeysDeleted += deleted
          console.log(`Deleted key: ${pattern} (${deleted} keys affected)`)
        }
      } catch (error) {
        console.error(`Error processing pattern ${pattern}:`, error)
        results[pattern] = { error: String(error) }
      }
    }

    // Reset counters to 0
    for (const counter of RESET_COUNTERS) {
      try {
        await kv.set(counter, 0)
        results[`reset_${counter}`] = true
        console.log(`Reset counter: ${counter} to 0`)
      } catch (error) {
        console.error(`Error resetting counter ${counter}:`, error)
        results[`reset_${counter}`] = { error: String(error) }
      }
    }

    console.log(`🧹 CLEAN SLATE OPERATION COMPLETE - ${totalKeysDeleted} keys deleted`)

    return NextResponse.json({
      success: true,
      message: `Clean slate operation completed successfully. ${totalKeysDeleted} keys deleted.`,
      details: results,
    })
  } catch (error) {
    console.error("Error during clean slate operation:", error)
    return NextResponse.json(
      { success: false, message: "Clean slate operation failed", error: String(error) },
      { status: 500 },
    )
  }
}
