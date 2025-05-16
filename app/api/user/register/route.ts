import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { redis, usernameExists, isOffensive } from "@/lib/redis"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown"

    // Apply rate limit: 5 attempts per hour
    const { success: rateCheckSuccess, limit, remaining } = await rateLimit(ip, 5, 60 * 60)

    if (!rateCheckSuccess) {
      return NextResponse.json(
        {
          success: false,
          error: `Rate limit exceeded. Try again later.`,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
          },
        },
      )
    }

    const { username } = await request.json()

    // Validate username
    if (!username || typeof username !== "string") {
      return NextResponse.json({ success: false, error: "Invalid username" })
    }

    if (username.length > 10) {
      return NextResponse.json({ success: false, error: "Username must be 10 characters or less" })
    }

    // Check for offensive content
    if (await isOffensive(username)) {
      return NextResponse.json({ success: false, error: "Username contains inappropriate language" })
    }

    // Check if username exists
    if (await usernameExists(username)) {
      return NextResponse.json({ success: false, error: "Username already taken" })
    }

    // Create user
    const userId = uuidv4()
    await redis.sadd("usernames", username)
    await redis.hset(`user:${userId}`, {
      username,
      points: 0,
      created: Date.now(),
      lastActive: Date.now(),
      gameStats: JSON.stringify({
        gamesPlayed: 0,
        highScore: 0,
        legendaryCount: 0,
        epicCount: 0,
        rareCount: 0,
        uncommonCount: 0,
        commonCount: 0,
      }),
    })

    return NextResponse.json({ success: true, userId, username })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ success: false, error: "Registration failed" }, { status: 500 })
  }
}
