import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

export async function POST(request: Request) {
  try {
    const { userId, username } = await request.json()

    // Validate inputs
    if (!userId || !username) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    // Verify user exists and matches userId
    const storedUserId = await kv.get(`username:${username.toLowerCase()}`)
    if (!storedUserId || storedUserId !== userId) {
      return NextResponse.json({ success: false, message: "User verification failed" }, { status: 403 })
    }

    // Delete all user data
    await deleteUserData(userId, username)

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting account:", error)
    return NextResponse.json({ success: false, message: "An error occurred while deleting account" }, { status: 500 })
  }
}

async function deleteUserData(userId: string, username: string): Promise<void> {
  const lowercaseUsername = username.toLowerCase()
  const pipeline = kv.pipeline()

  // Remove from user mappings
  pipeline.hdel("movie-game:users", userId)
  pipeline.srem("movie-game:usernames", lowercaseUsername)

  // Delete individual keys
  pipeline.del(`username:${lowercaseUsername}`)
  pipeline.del(`user:${userId}`)
  pipeline.del(`user:${userId}:score`)
  pipeline.del(`user:${userId}:accountScore`)
  pipeline.del(`player:${userId}:history`)
  pipeline.del(`user:${userId}:games`)
  pipeline.del(`user:${userId}:daily-challenges`)

  // Execute Redis operations
  await pipeline.exec()

  // Handle leaderboard separately
  await removeFromLeaderboard(userId, username)
}

async function removeFromLeaderboard(userId: string, username: string): Promise<void> {
  // Get all leaderboard entries
  const leaderboardEntries = await kv.zrange("movie-game:leaderboard", 0, -1, { rev: true })

  if (!leaderboardEntries || leaderboardEntries.length === 0) return

  const pipeline = kv.pipeline()
  let updated = false

  for (const entryRaw of leaderboardEntries) {
    try {
      const entry = JSON.parse(entryRaw)

      // If this entry belongs to the user we're deleting
      if ((entry.userId && entry.userId === userId) || entry.playerName === username) {
        // Remove entry
        pipeline.zrem("movie-game:leaderboard", entryRaw)
        updated = true
      }
    } catch (e) {
      console.error("Error processing leaderboard entry:", e)
    }
  }

  if (updated) {
    // Clear leaderboard cache
    pipeline.del("movie-game:leaderboard-cache")
    await pipeline.exec()
  }
}
