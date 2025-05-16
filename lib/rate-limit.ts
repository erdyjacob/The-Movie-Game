import { redis } from "./redis"

export async function rateLimit(
  identifier: string,
  limit: number,
  window: number,
): Promise<{ success: boolean; limit: number; remaining: number }> {
  const key = `ratelimit:${identifier}`

  try {
    // Get current count
    const current = (await redis.get(key)) as number | null
    const count = current ? current : 0

    // Check if over limit
    if (count >= limit) {
      return { success: false, limit, remaining: 0 }
    }

    // Increment count
    await redis.incr(key)

    // Set expiry if not already set
    if (count === 0) {
      await redis.expire(key, window)
    }

    return { success: true, limit, remaining: limit - count - 1 }
  } catch (error) {
    console.error("Rate limit error:", error)
    // Default to allowing the request if there's an error
    return { success: true, limit, remaining: 1 }
  }
}
