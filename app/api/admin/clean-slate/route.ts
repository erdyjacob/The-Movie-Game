import { kv } from "@vercel/kv"
import { type NextRequest, NextResponse } from "next/server"

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
  console.log("🚨 Clean slate operation requested")

  try {
    const body = await request.json()
    console.log("Request body received:", { hasPassword: !!body.password, confirmText: body.confirmText })

    const { password, confirmText } = body

    // Check if admin password is configured
    if (!process.env.ADMIN_PASSWORD) {
      console.error("ADMIN_PASSWORD environment variable not set")
      return NextResponse.json({ success: false, message: "Admin password not configured on server" }, { status: 500 })
    }

    // Verify password
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      console.log("Invalid admin password provided")
      return NextResponse.json({ success: false, message: "Invalid admin password" }, { status: 401 })
    }

    // Verify confirmation text
    if (confirmText !== "CONFIRM CLEAN SLATE") {
      console.log("Invalid confirmation text:", confirmText)
      return NextResponse.json(
        { success: false, message: "Confirmation text does not match 'CONFIRM CLEAN SLATE'" },
        { status: 400 },
      )
    }

    console.log("🚨 INITIATING CLEAN SLATE OPERATION 🚨")
    const results: Record<string, any> = {}
    let totalKeysDeleted = 0

    // Test Redis connection first
    try {
      await kv.ping()
      console.log("✅ Redis connection successful")
    } catch (error) {
      console.error("❌ Redis connection failed:", error)
      return NextResponse.json(
        { success: false, message: "Redis connection failed", error: String(error) },
        { status: 500 },
      )
    }

    // Process each key pattern
    for (const pattern of KEY_PATTERNS) {
      try {
        console.log(`🔍 Scanning for keys matching pattern: ${pattern}`)

        // If pattern has a wildcard, use scan
        if (pattern.includes("*")) {
          const keys = await kv.keys(pattern)
          console.log(`📋 Found ${keys.length} keys matching ${pattern}`)

          if (keys.length > 0) {
            // Delete keys individually to avoid pipeline issues
            let deletedCount = 0
            for (const key of keys) {
              try {
                const deleted = await kv.del(key)
                deletedCount += deleted
                if (deletedCount % 10 === 0) {
                  console.log(`🗑️ Deleted ${deletedCount}/${keys.length} keys for pattern ${pattern}`)
                }
              } catch (keyError) {
                console.error(`Error deleting key ${key}:`, keyError)
              }
            }

            totalKeysDeleted += deletedCount
            results[pattern] = deletedCount
            console.log(`✅ Completed deletion for pattern ${pattern}: ${deletedCount} keys deleted`)
          } else {
            results[pattern] = 0
          }
        } else {
          // Direct key deletion
          const deleted = await kv.del(pattern)
          results[pattern] = deleted
          totalKeysDeleted += deleted
          console.log(`✅ Deleted key: ${pattern} (${deleted} keys affected)`)
        }
      } catch (error) {
        console.error(`❌ Error processing pattern ${pattern}:`, error)
        results[pattern] = { error: String(error) }
      }
    }

    // Reset counters to 0
    for (const counter of RESET_COUNTERS) {
      try {
        await kv.set(counter, 0)
        results[`reset_${counter}`] = true
        console.log(`🔄 Reset counter: ${counter} to 0`)
      } catch (error) {
        console.error(`❌ Error resetting counter ${counter}:`, error)
        results[`reset_${counter}`] = { error: String(error) }
      }
    }

    console.log(`🎉 CLEAN SLATE OPERATION COMPLETE - ${totalKeysDeleted} keys deleted`)

    return NextResponse.json({
      success: true,
      message: `Clean slate operation completed successfully. ${totalKeysDeleted} keys deleted.`,
      details: results,
      totalKeysDeleted,
    })
  } catch (error) {
    console.error("💥 Critical error during clean slate operation:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Clean slate operation failed",
        error: String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
