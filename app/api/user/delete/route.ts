import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

// Add a logging utility function
function logDeleteAction(action: string, userId?: string, username?: string, details?: any) {
  console.log(
    `[DELETE_ACCOUNT ${action}]`,
    userId ? `userId: ${userId}` : "",
    username ? `username: ${username}` : "",
    details ? JSON.stringify(details) : "",
  )
}

export async function POST(request: Request) {
  try {
    const { userId, username } = await request.json()
    logDeleteAction("REQUEST", userId, username)

    // Validate inputs
    if (!userId || !username) {
      logDeleteAction("ERROR", userId, username, { error: "Missing required fields" })
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    // Verify user exists and matches userId
    try {
      const storedUserId = await kv.get(`username:${username.toLowerCase()}`)
      logDeleteAction("VERIFICATION", userId, username, { storedUserId })

      if (!storedUserId) {
        logDeleteAction("ERROR", userId, username, { error: "User not found" })
        return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
      }

      if (storedUserId !== userId) {
        logDeleteAction("ERROR", userId, username, { error: "User verification failed", storedUserId })
        return NextResponse.json({ success: false, message: "User verification failed" }, { status: 403 })
      }
    } catch (error) {
      logDeleteAction("ERROR", userId, username, { error: `Verification error: ${error}` })
      return NextResponse.json(
        { success: false, message: "Error verifying user", error: String(error) },
        { status: 500 },
      )
    }

    // Delete all user data
    try {
      await deleteUserData(userId, username)
      logDeleteAction("SUCCESS", userId, username, { message: "Account deleted successfully" })

      return NextResponse.json({
        success: true,
        message: "Account deleted successfully",
      })
    } catch (error) {
      logDeleteAction("ERROR", userId, username, { error: `Deletion error: ${error}` })
      return NextResponse.json(
        { success: false, message: "Error deleting user data", error: String(error) },
        { status: 500 },
      )
    }
  } catch (error) {
    logDeleteAction("ERROR", undefined, undefined, { error: `Request error: ${error}` })
    return NextResponse.json(
      { success: false, message: "An error occurred while processing request", error: String(error) },
      { status: 500 },
    )
  }
}

async function deleteUserData(userId: string, username: string): Promise<void> {
  const lowercaseUsername = username.toLowerCase()
  logDeleteAction("DELETE_START", userId, username)

  // Break down the deletion into smaller operations with individual error handling

  // Step 1: Remove from user mappings
  try {
    const mappingPipeline = kv.pipeline()
    mappingPipeline.hdel("movie-game:users", userId)
    mappingPipeline.srem("movie-game:usernames", lowercaseUsername)
    await mappingPipeline.exec()
    logDeleteAction("MAPPINGS_DELETED", userId, username)
  } catch (error) {
    logDeleteAction("ERROR", userId, username, { error: `Error deleting user mappings: ${error}` })
    throw new Error(`Failed to delete user mappings: ${error}`)
  }

  // Step 2: Delete individual user keys
  try {
    const keysPipeline = kv.pipeline()
    keysPipeline.del(`username:${lowercaseUsername}`)
    keysPipeline.del(`user:${userId}`)
    keysPipeline.del(`user:${userId}:score`)
    keysPipeline.del(`user:${userId}:accountScore`)
    keysPipeline.del(`player:${userId}:history`)
    keysPipeline.del(`user:${userId}:games`)
    keysPipeline.del(`user:${userId}:daily-challenges`)
    await keysPipeline.exec()
    logDeleteAction("USER_KEYS_DELETED", userId, username)
  } catch (error) {
    logDeleteAction("ERROR", userId, username, { error: `Error deleting user keys: ${error}` })
    throw new Error(`Failed to delete user keys: ${error}`)
  }

  // Step 3: Handle leaderboard separately with improved cleanup
  try {
    await cleanupLeaderboard(userId, username)
    logDeleteAction("LEADERBOARD_CLEANED", userId, username)
  } catch (error) {
    logDeleteAction("ERROR", userId, username, { error: `Error cleaning leaderboard: ${error}` })
    throw new Error(`Failed to clean leaderboard: ${error}`)
  }
}

async function cleanupLeaderboard(userId: string, username: string): Promise<void> {
  logDeleteAction("LEADERBOARD_CLEANUP_START", userId, username)

  // 1. Normalize the username for consistent comparison
  const normalizedUsername = username.toLowerCase().trim()

  try {
    // 2. Get all leaderboard entries
    const entries = await kv.zrange("movie-game:leaderboard", 0, -1, { rev: true })
    logDeleteAction("LEADERBOARD_ENTRIES_FETCHED", userId, username, {
      entriesCount: entries?.length || 0,
    })

    if (!entries || entries.length === 0) {
      logDeleteAction("LEADERBOARD_EMPTY", userId, username)
      return
    }

    // 3. Find and remove matching entries
    let removedCount = 0
    for (const entryRaw of entries) {
      try {
        const entry = JSON.parse(entryRaw)

        // Match by userId or normalized username (case-insensitive)
        const entryUsername = entry.playerName ? entry.playerName.toLowerCase().trim() : ""

        if ((entry.userId && entry.userId === userId) || entryUsername === normalizedUsername) {
          await kv.zrem("movie-game:leaderboard", entryRaw)
          removedCount++

          logDeleteAction("LEADERBOARD_ENTRY_REMOVED", userId, username, {
            entryId: entry.id,
            entryUserId: entry.userId,
            entryPlayerName: entry.playerName,
            score: entry.score,
          })
        }
      } catch (e) {
        logDeleteAction("ENTRY_PARSE_ERROR", userId, username, {
          error: String(e),
          rawEntry: typeof entryRaw === "string" ? entryRaw.substring(0, 100) + "..." : typeof entryRaw,
        })
        // Continue processing other entries
      }
    }

    // 4. Force clear all leaderboard caches unconditionally
    await kv.del("movie-game:leaderboard-cache")
    logDeleteAction("LEADERBOARD_CACHE_CLEARED", userId, username)

    // 5. Verification step - check if any entries remain
    const remainingEntries = await kv.zrange("movie-game:leaderboard", 0, -1, { rev: true })
    let secondPassRemovals = 0

    for (const entryRaw of remainingEntries) {
      try {
        const entry = JSON.parse(entryRaw)
        const entryUsername = entry.playerName ? entry.playerName.toLowerCase().trim() : ""

        if ((entry.userId && entry.userId === userId) || entryUsername === normalizedUsername) {
          logDeleteAction("ENTRY_STILL_EXISTS", userId, username, {
            entryId: entry.id,
            entryUserId: entry.userId,
            entryPlayerName: entry.playerName,
          })

          // Force remove this entry in a second pass
          await kv.zrem("movie-game:leaderboard", entryRaw)
          secondPassRemovals++
        }
      } catch (e) {
        // Skip invalid entries
      }
    }

    if (secondPassRemovals > 0) {
      logDeleteAction("SECOND_PASS_REMOVAL", userId, username, {
        removedCount: secondPassRemovals,
      })
      // Clear cache again after second pass
      await kv.del("movie-game:leaderboard-cache")
    }

    logDeleteAction("LEADERBOARD_CLEANUP_COMPLETE", userId, username, {
      firstPassRemovals: removedCount,
      secondPassRemovals,
      totalRemoved: removedCount + secondPassRemovals,
    })
  } catch (error) {
    logDeleteAction("LEADERBOARD_CLEANUP_ERROR", userId, username, { error: String(error) })
    throw new Error(`Leaderboard cleanup failed: ${error}`)
  }
}
