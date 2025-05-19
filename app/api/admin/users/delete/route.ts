import { kv } from "@vercel/kv"
import { type NextRequest, NextResponse } from "next/server"

const USERS_KEY = "movie-game:users"
const BANNED_USERNAMES_KEY = "movie-game:banned-usernames"
const USERNAMES_KEY = "movie-game:usernames"
const LEADERBOARD_KEY = "movie-game:leaderboard"
const LEADERBOARD_CACHE_KEY = "movie-game:leaderboard-cache"

export async function POST(request: NextRequest) {
  try {
    const { userId, username, password, banUsername = false } = await request.json()

    // Validate admin password
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ message: "Invalid admin password" }, { status: 401 })
    }

    if (!userId) {
      return NextResponse.json({ message: "User ID is required" }, { status: 400 })
    }

    console.log(`[ADMIN] Deleting user: ${userId}, username: ${username || "unknown"}`)

    // Use a transaction to ensure all operations succeed or fail together
    const pipeline = kv.pipeline()

    // 1. Delete from the users hash (if it exists)
    if (username) {
      pipeline.hdel(USERS_KEY, userId)

      const lowercaseUsername = username.toLowerCase()
      // Delete from the usernames set
      pipeline.srem(USERNAMES_KEY, lowercaseUsername)
      // Delete the username mapping
      pipeline.del(`username:${lowercaseUsername}`)

      // If banUsername is true, add to banned usernames set
      if (banUsername) {
        pipeline.sadd(BANNED_USERNAMES_KEY, lowercaseUsername)
      }
    }

    // 2. Delete all user-related keys
    // These are the keys we saw in the diagnostics
    pipeline.del(`user:${userId}`)
    pipeline.del(`user:${userId}:score`)
    pipeline.del(`user:${userId}:accountScore`)
    pipeline.del(`user:${userId}:games`)
    pipeline.del(`player:${userId}:history`)
    pipeline.del(`user:${userId}:daily-challenges`)

    // 3. Remove from leaderboard
    // Get all leaderboard entries
    const leaderboardEntries = await kv.zrange(LEADERBOARD_KEY, 0, -1, { rev: true })

    if (leaderboardEntries && leaderboardEntries.length > 0) {
      for (const entryRaw of leaderboardEntries) {
        try {
          const entry = typeof entryRaw === "string" ? JSON.parse(entryRaw) : entryRaw

          // If this entry belongs to the user we're deleting
          if ((entry.userId && entry.userId === userId) || (username && entry.playerName === username)) {
            // Remove this entry from the leaderboard
            pipeline.zrem(LEADERBOARD_KEY, entryRaw)
            console.log(`[ADMIN] Removing leaderboard entry for user: ${userId}`)
          }
        } catch (e) {
          console.error("Error processing leaderboard entry:", e)
        }
      }
    }

    // Invalidate leaderboard cache
    pipeline.del(LEADERBOARD_CACHE_KEY)

    // Execute all Redis operations
    await pipeline.exec()

    return NextResponse.json({
      message: `User ${username || userId} deleted successfully${banUsername ? " and username banned" : ""}`,
    })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ message: "Failed to delete user" }, { status: 500 })
  }
}
