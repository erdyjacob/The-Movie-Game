import { kv } from "@vercel/kv"
import type { LeaderboardEntry, AccountScore, GameMode, Difficulty } from "./types"
import { nanoid } from "nanoid"

const LEADERBOARD_KEY = "movie-game:leaderboard"
const LEADERBOARD_CACHE_KEY = "movie-game:leaderboard-cache"
const MAX_LEADERBOARD_ENTRIES = 100
const CACHE_TTL = 30 * 60 // 30 minutes in seconds

// Helper to determine if it's peak hours (9am to 11pm)
function isPeakHours(): boolean {
  const hour = new Date().getHours()
  return hour >= 9 && hour <= 23
}

// Get the appropriate cache TTL based on time of day
function getCacheTTL(): number {
  return isPeakHours() ? 30 * 60 : 120 * 60 // 30 mins during peak, 2 hours during off-peak
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

// Add a new entry to the leaderboard
export async function addLeaderboardEntry(
  playerName: string,
  score: AccountScore,
  gameMode: GameMode,
  difficulty: Difficulty,
  avatarUrl?: string,
): Promise<boolean> {
  try {
    const entry: LeaderboardEntry = {
      id: nanoid(),
      playerName,
      score: score.points,
      rank: score.rank,
      legendaryCount: score.legendaryCount,
      epicCount: score.epicCount,
      rareCount: score.rareCount,
      uncommonCount: score.uncommonCount,
      commonCount: score.commonCount,
      timestamp: new Date().toISOString(),
      avatarUrl: avatarUrl,
      gameMode: gameMode,
      difficulty: difficulty,
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

    return true
  } catch (error) {
    console.error("Error adding leaderboard entry:", error)
    return false
  }
}

// New function to update the leaderboard with a player's total points
export async function updateLeaderboardWithTotalPoints(
  playerName: string,
  accountScore: AccountScore,
): Promise<boolean> {
  try {
    // Check if the player already exists in the leaderboard
    const existingEntries = await kv.zrange<LeaderboardEntry[]>(LEADERBOARD_KEY, 0, -1, { rev: true })

    const existingEntry = existingEntries?.find((entry) => entry.playerName === playerName)

    // If the player exists and their score hasn't changed, do nothing
    if (existingEntry && existingEntry.score === accountScore.points) {
      return true
    }

    // Create or update the entry
    const entry: LeaderboardEntry = {
      id: existingEntry?.id || nanoid(),
      playerName,
      score: accountScore.points,
      rank: accountScore.rank,
      legendaryCount: accountScore.legendaryCount,
      epicCount: accountScore.epicCount,
      rareCount: accountScore.rareCount,
      uncommonCount: accountScore.uncommonCount,
      commonCount: accountScore.commonCount,
      timestamp: new Date().toISOString(),
      gameMode: "collection", // This represents the total collection score
      difficulty: "all",
    }

    // Add or update in the sorted set with score as the sorting value
    await kv.zadd(LEADERBOARD_KEY, { score: entry.score, member: JSON.stringify(entry) })

    // If this is an update, remove the old entry
    if (existingEntry && existingEntry.score !== accountScore.points) {
      await kv.zrem(LEADERBOARD_KEY, JSON.stringify(existingEntry))
    }

    // Trim the leaderboard to keep only the top entries
    const count = await kv.zcard(LEADERBOARD_KEY)
    if (count > MAX_LEADERBOARD_ENTRIES) {
      await kv.zremrangebyrank(LEADERBOARD_KEY, 0, count - MAX_LEADERBOARD_ENTRIES - 1)
    }

    // Invalidate the cache to ensure the next read gets fresh data
    await kv.del(LEADERBOARD_CACHE_KEY)

    return true
  } catch (error) {
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
