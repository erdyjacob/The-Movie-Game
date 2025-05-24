import { kv } from "@vercel/kv"
import type { LeaderboardEntry, AccountScore, GameMode, Difficulty } from "./types"
import { nanoid } from "nanoid"

const LEADERBOARD_KEY = "movie-game:leaderboard"
const LEADERBOARD_CACHE_KEY = "movie-game:leaderboard-cache"
const MAX_LEADERBOARD_ENTRIES = 100
const CACHE_TTL = 30 * 60 // 30 minutes in seconds

// At the top of the file, add a logging utility function:
function logLeaderboardAction(action: string, userId?: string, username?: string, details?: any) {
  console.log(
    `[LEADERBOARD ${action}]`,
    userId ? `userId: ${userId}` : "",
    username ? `username: ${username}` : "",
    details ? JSON.stringify(details) : "",
  )
}

// Helper to determine if it's peak hours (9am to 11pm)
function isPeakHours(): boolean {
  const hour = new Date().getHours()
  return hour >= 9 && hour <= 23
}

// Get the appropriate cache TTL based on time of day
function getCacheTTL(): number {
  return isPeakHours() ? 30 * 60 : 120 * 60 // 30 mins during peak, 2 hours during off-peak
}

// Helper function to safely parse JSON or return the original value if it's already an object
function safeParseJSON(data: any) {
  if (typeof data === "object") return data

  try {
    return JSON.parse(data)
  } catch (e) {
    console.error("Error parsing JSON:", e)
    return null
  }
}

export async function getLeaderboardData(): Promise<LeaderboardEntry[]> {
  try {
    // Try to get from cache first
    const cachedData = await kv.get<{ timestamp: number; data: LeaderboardEntry[] }>(LEADERBOARD_CACHE_KEY)

    // If we have valid cached data that hasn't expired, return it
    if (cachedData && Date.now() - cachedData.timestamp < getCacheTTL() * 1000) {
      console.log("Serving leaderboard from cache")
      return cachedData.data
    }

    // Cache miss or expired, fetch from the main leaderboard
    console.log("Cache miss, fetching leaderboard from Redis")
    const leaderboardData = await kv.zrange<LeaderboardEntry[]>(LEADERBOARD_KEY, 0, MAX_LEADERBOARD_ENTRIES - 1, {
      rev: true,
    })

    // Update the cache with fresh data
    await kv.set(LEADERBOARD_CACHE_KEY, { timestamp: Date.now(), data: leaderboardData || [] }, { ex: getCacheTTL() })

    return leaderboardData || []
  } catch (error) {
    console.error("Error fetching leaderboard data:", error)
    return []
  }
}

// Modify the addLeaderboardEntry function to use safeParseJSON and handle games played
export async function addLeaderboardEntry(
  playerName: string,
  score: AccountScore,
  gameMode: GameMode,
  difficulty: Difficulty,
  avatarUrl?: string,
  userId?: string,
): Promise<boolean> {
  try {
    logLeaderboardAction("ADD_ENTRY_START", userId, playerName, { score: score.points, gameMode, difficulty })

    // Normalize the player name to ensure consistency
    const normalizedPlayerName = playerName.trim()

    if (!normalizedPlayerName) {
      logLeaderboardAction("ADD_ENTRY_ERROR", userId, playerName, { error: "Empty player name after normalization" })
      return false
    }

    // Get all leaderboard entries to find existing entry from the same player
    const existingEntries = await kv.zrange<string[]>(LEADERBOARD_KEY, 0, -1, { rev: true })

    // Parse entries and find matching player
    let existingEntry: LeaderboardEntry | undefined
    let existingEntryRaw: string | undefined

    if (existingEntries && existingEntries.length > 0) {
      for (const entryRaw of existingEntries) {
        try {
          // Use safeParseJSON instead of JSON.parse directly
          const entry = safeParseJSON(entryRaw) as LeaderboardEntry

          // Skip if parsing failed
          if (!entry) continue

          // First try to match by userId if available, then fall back to playerName
          if ((userId && entry.userId === userId) || entry.playerName === normalizedPlayerName) {
            existingEntry = entry
            existingEntryRaw = entryRaw
            logLeaderboardAction("ADD_ENTRY_FOUND_EXISTING", userId, playerName, {
              existingId: entry.id,
              existingScore: entry.score,
              existingGamesPlayed: entry.gamesPlayed || 0,
            })
            break
          }
        } catch (e) {
          console.error("Error processing leaderboard entry:", e)
          // Continue to next entry
        }
      }
    }

    // Create the new entry, preserving the existing ID if found and incrementing games played
    const entry: LeaderboardEntry = {
      id: existingEntry?.id || nanoid(),
      userId, // Include userId in the entry
      playerName: normalizedPlayerName,
      score: score.points,
      rank: score.rank,
      legendaryCount: score.legendaryCount,
      epicCount: score.epicCount,
      rareCount: score.rareCount,
      uncommonCount: score.uncommonCount,
      commonCount: score.commonCount,
      gamesPlayed: (existingEntry?.gamesPlayed || 0) + 1, // Increment games played
      timestamp: new Date().toISOString(),
      avatarUrl: avatarUrl,
      gameMode: gameMode,
      difficulty: difficulty,
    }

    // If this is an update, remove the old entry first to avoid duplicates
    if (existingEntryRaw) {
      await kv.zrem(LEADERBOARD_KEY, existingEntryRaw)
      logLeaderboardAction("ADD_ENTRY_REMOVED_OLD", userId, playerName, {
        oldScore: existingEntry?.score,
        oldGamesPlayed: existingEntry?.gamesPlayed || 0,
      })
    }

    // Add to the sorted set with score as the sorting value
    await kv.zadd(LEADERBOARD_KEY, { score: entry.score, member: JSON.stringify(entry) })

    // Trim the leaderboard to keep only the top entries
    const count = await kv.zcard(LEADERBOARD_KEY)
    if (count > MAX_LEADERBOARD_ENTRIES) {
      await kv.zremrangebyrank(LEADERBOARD_KEY, 0, count - MAX_LEADERBOARD_ENTRIES - 1)
    }

    // Invalidate the cache to ensure the next read gets fresh data
    await kv.del(LEADERBOARD_CACHE_KEY)

    logLeaderboardAction("ADD_ENTRY_SUCCESS", userId, playerName, {
      score: score.points,
      gamesPlayed: entry.gamesPlayed,
    })
    return true
  } catch (error) {
    logLeaderboardAction("ADD_ENTRY_ERROR", userId, playerName, { error: String(error) })
    console.error("Error adding leaderboard entry:", error)
    return false
  }
}

// Update the updateLeaderboardWithTotalPoints function to use safeParseJSON and preserve games played
export async function updateLeaderboardWithTotalPoints(
  playerName: string,
  accountScore: AccountScore,
  userId?: string,
): Promise<boolean> {
  try {
    logLeaderboardAction("UPDATE_POINTS_START", userId, playerName, { score: accountScore.points })

    if (!playerName || !accountScore) {
      logLeaderboardAction("UPDATE_POINTS_ERROR", userId, playerName, { error: "Missing required data" })
      console.error("Missing required data for leaderboard update:", { playerName, accountScore })
      return false
    }

    // Normalize the player name to ensure consistency
    const normalizedPlayerName = playerName.trim()

    if (!normalizedPlayerName) {
      logLeaderboardAction("UPDATE_POINTS_ERROR", userId, playerName, {
        error: "Empty player name after normalization",
      })
      console.error("Empty player name after normalization")
      return false
    }

    // Get all leaderboard entries to find existing entry
    const existingEntries = await kv.zrange<string[]>(LEADERBOARD_KEY, 0, -1, { rev: true })

    // Parse entries and find matching player
    let existingEntry: LeaderboardEntry | undefined
    let existingEntryRaw: string | undefined

    if (existingEntries && existingEntries.length > 0) {
      for (const entryRaw of existingEntries) {
        try {
          // Use safeParseJSON instead of JSON.parse directly
          const entry = safeParseJSON(entryRaw) as LeaderboardEntry

          // Skip if parsing failed
          if (!entry) continue

          // First try to match by userId if available, then fall back to playerName
          if ((userId && entry.userId === userId) || entry.playerName === normalizedPlayerName) {
            existingEntry = entry
            existingEntryRaw = entryRaw
            break
          }
        } catch (e) {
          console.error("Error parsing leaderboard entry:", e)
          // Continue to next entry
        }
      }
    }

    // If the player exists and their score hasn't changed, do nothing
    if (existingEntry && existingEntry.score === accountScore.points) {
      logLeaderboardAction("UPDATE_POINTS_SKIP", userId, playerName, { reason: "Score unchanged" })
      return true
    }

    // Create or update the entry, preserving games played count
    const entry: LeaderboardEntry = {
      id: existingEntry?.id || nanoid(),
      userId: userId || existingEntry?.userId, // Use provided userId or keep existing
      playerName: normalizedPlayerName,
      score: accountScore.points,
      rank: accountScore.rank,
      legendaryCount: accountScore.legendaryCount || 0,
      epicCount: accountScore.epicCount || 0,
      rareCount: accountScore.rareCount || 0,
      uncommonCount: accountScore.uncommonCount || 0,
      commonCount: accountScore.commonCount || 0,
      gamesPlayed: existingEntry?.gamesPlayed || 0, // Preserve existing games played count
      timestamp: new Date().toISOString(),
      gameMode: "collection", // This represents the total collection score
      difficulty: "all",
    }

    // If this is an update, remove the old entry first to avoid duplicates
    if (existingEntryRaw) {
      await kv.zrem(LEADERBOARD_KEY, existingEntryRaw)
      logLeaderboardAction("UPDATE_POINTS_REMOVED_OLD", userId, playerName, { oldScore: existingEntry?.score })
    }

    // Add the new/updated entry
    await kv.zadd(LEADERBOARD_KEY, { score: entry.score, member: JSON.stringify(entry) })

    // Trim the leaderboard to keep only the top entries
    const count = await kv.zcard(LEADERBOARD_KEY)
    if (count > MAX_LEADERBOARD_ENTRIES) {
      await kv.zremrangebyrank(LEADERBOARD_KEY, 0, count - MAX_LEADERBOARD_ENTRIES - 1)
    }

    // Invalidate the cache to ensure the next read gets fresh data
    await kv.del(LEADERBOARD_CACHE_KEY)

    logLeaderboardAction("UPDATE_POINTS_SUCCESS", userId, playerName, { newScore: entry.score })
    return true
  } catch (error) {
    logLeaderboardAction("UPDATE_POINTS_ERROR", userId, playerName, { error: String(error) })
    console.error("Error updating leaderboard with total points:", error)
    return false
  }
}

// New function to get a player's rank in the leaderboard
export async function getPlayerLeaderboardRank(playerName: string): Promise<number | null> {
  try {
    if (!playerName) return null

    // Get all leaderboard entries
    const leaderboardData = await getLeaderboardData()

    // Find the player's position (0-based index)
    const playerIndex = leaderboardData.findIndex((entry) => entry.playerName === playerName)

    // Return the 1-based rank if found, null otherwise
    return playerIndex !== -1 ? playerIndex + 1 : null
  } catch (error) {
    console.error("Error getting player leaderboard rank:", error)
    return null
  }
}

// Get the timestamp of when the leaderboard was last updated
export async function getLeaderboardLastUpdated(): Promise<string> {
  try {
    const cachedData = await kv.get<{ timestamp: number }>(LEADERBOARD_CACHE_KEY)
    if (cachedData) {
      return new Date(cachedData.timestamp).toLocaleString()
    }
    return "Unknown"
  } catch (error) {
    console.error("Error getting last updated timestamp:", error)
    return "Unknown"
  }
}

// Get Redis usage statistics for monitoring
export async function getRedisStats(): Promise<Record<string, any>> {
  try {
    // This is a simplified version - actual implementation would depend on
    // what metrics Upstash Redis makes available via their API
    const leaderboardSize = await kv.zcard(LEADERBOARD_KEY)
    return {
      leaderboardEntries: leaderboardSize,
      lastUpdated: await getLeaderboardLastUpdated(),
    }
  } catch (error) {
    console.error("Error getting Redis stats:", error)
    return { error: "Failed to get stats" }
  }
}
