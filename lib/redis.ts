import { Redis } from "@upstash/redis"

// Initialize Redis client
export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

// Check if username exists
export async function usernameExists(username: string): Promise<boolean> {
  try {
    return await redis.sismember("usernames", username)
  } catch (error) {
    console.error("Error checking username:", error)
    return false
  }
}

// Check if username contains offensive words
export async function isOffensive(username: string): Promise<boolean> {
  try {
    const normalized = username.toLowerCase()
    const offensiveWords = await redis.smembers("offensive_words")

    for (const word of offensiveWords) {
      // Direct match
      if (normalized.includes(word)) return true

      // Pattern matching for variations (l33t speak, etc)
      const pattern = word
        .replace(/a/g, "[a@4]")
        .replace(/e/g, "[e3]")
        .replace(/i/g, "[i1!]")
        .replace(/o/g, "[o0]")
        .replace(/s/g, "[s$5]")

      if (new RegExp(pattern, "i").test(normalized)) return true
    }

    return false
  } catch (error) {
    console.error("Error checking offensive words:", error)
    return false
  }
}

// Get user rank
export async function getUserRank(username: string): Promise<number | null> {
  try {
    const rank = await redis.zrevrank("leaderboard:points", username)
    return rank !== null ? rank + 1 : null
  } catch (error) {
    console.error("Error getting user rank:", error)
    return null
  }
}

// Get user score
export async function getUserScore(username: string): Promise<number> {
  try {
    const score = await redis.zscore("leaderboard:points", username)
    return score ? Number(score) : 0
  } catch (error) {
    console.error("Error getting user score:", error)
    return 0
  }
}

// Calculate points using the same formula as PlayerStats
export function calculatePoints(stats: any): number {
  return (
    (stats.legendaryCount || 0) * 100 +
    (stats.epicCount || 0) * 50 +
    (stats.rareCount || 0) * 25 +
    (stats.uncommonCount || 0) * 10 +
    (stats.commonCount || 0) * 1
  )
}
