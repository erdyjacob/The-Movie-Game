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

  // Step 3: Handle leaderboard separately
  try {
    await removeFromLeaderboard(userId, username)
    logDeleteAction("LEADERBOARD_UPDATED", userId, username)
  } catch (error) {
    logDeleteAction("ERROR", userId, username, { error: `Error updating leaderboard: ${error}` })
    throw new Error(`Failed to update leaderboard: ${error}`)
  }
}

async function removeFromLeaderboard(userId: string, username: string): Promise<void> {
  // Get all leaderboard entries
  try {
    const leaderboardEntries = await kv.zrange("movie-game:leaderboard", 0, -1, { rev: true })
    logDeleteAction("LEADERBOARD_FETCH", userId, username, { entriesCount: leaderboardEntries?.length || 0 })

    if (!leaderboardEntries || leaderboardEntries.length === 0) {
      logDeleteAction("LEADERBOARD_EMPTY", userId, username)
      return
    }

    const pipeline = kv.pipeline()
    let updated = false
    let matchedEntries = 0

    for (const entryRaw of leaderboardEntries) {
      try {
        // Safely parse JSON with error handling
        let entry
        try {
          entry = JSON.parse(entryRaw)
        } catch (parseError) {
          logDeleteAction("PARSE_ERROR", userId, username, {
            error: `Error parsing leaderboard entry: ${parseError}`,
            entry: entryRaw.substring(0, 100), // Log only the beginning of the entry to avoid huge logs
          })
          continue // Skip this entry and continue with the next one
        }

        // If this entry belongs to the user we're deleting
        if ((entry.userId && entry.userId === userId) || entry.playerName === username) {
          // Remove entry
          pipeline.zrem("movie-game:leaderboard", entryRaw)
          updated = true
          matchedEntries++
          logDeleteAction("ENTRY_MATCHED", userId, username, {
            entryId: entry.id,
            entryUserId: entry.userId,
            entryPlayerName: entry.playerName,
          })
        }
      } catch (e) {
        logDeleteAction("ENTRY_ERROR", userId, username, { error: `Error processing leaderboard entry: ${e}` })
        // Continue with next entry instead of failing the whole operation
      }
    }

    if (updated) {
      // Clear leaderboard cache
      pipeline.del("movie-game:leaderboard-cache")
      await pipeline.exec()
      logDeleteAction("LEADERBOARD_UPDATED", userId, username, { entriesRemoved: matchedEntries })
    } else {
      logDeleteAction("NO_LEADERBOARD_ENTRIES", userId, username, { message: "No matching entries found" })
    }
  } catch (error) {
    logDeleteAction("LEADERBOARD_ERROR", userId, username, { error: `Error removing from leaderboard: ${error}` })
    throw new Error(`Failed to remove from leaderboard: ${error}`)
  }
}
