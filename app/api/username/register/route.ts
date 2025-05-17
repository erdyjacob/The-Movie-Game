import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { isValidUsername } from "@/lib/username-validation"
import { nanoid } from "nanoid"

// Consistent key naming
const USERS_KEY = "movie-game:users"
const USERNAMES_KEY = "movie-game:usernames"
const BANNED_USERNAMES_KEY = "movie-game:banned-usernames"

export async function POST(request: Request) {
  try {
    const { username } = await request.json()

    // First validate the username format and check for profanity
    const validation = isValidUsername(username)
    if (!validation.valid) {
      return NextResponse.json({ success: false, message: validation.message }, { status: 400 })
    }

    const lowercaseUsername = username.toLowerCase()

    // Check if username is banned
    const isBanned = await kv.sismember(BANNED_USERNAMES_KEY, lowercaseUsername)
    if (isBanned) {
      return NextResponse.json({
        success: false,
        message: "This username is not available",
      })
    }

    // Check if username exists in the usernames set
    const exists = await kv.sismember(USERNAMES_KEY, lowercaseUsername)
    if (exists) {
      return NextResponse.json({
        success: false,
        message: "This username is already taken",
      })
    }

    // Generate a unique user ID
    const userId = nanoid()

    // Use a transaction to ensure all operations succeed or fail together
    const pipeline = kv.pipeline()

    // Store in the users hash
    pipeline.hset(USERS_KEY, { [userId]: username })

    // Store in the usernames set
    pipeline.sadd(USERNAMES_KEY, lowercaseUsername)

    // Also keep the individual keys for backward compatibility and quick lookups
    pipeline.set(`username:${lowercaseUsername}`, userId)
    pipeline.set(`user:${userId}`, {
      username,
      createdAt: new Date().toISOString(),
    })

    // Execute all commands atomically
    await pipeline.exec()

    // Verify the data was stored correctly
    const storedUserId = await kv.hget(USERS_KEY, userId)
    if (!storedUserId) {
      throw new Error("Failed to verify user creation")
    }

    return NextResponse.json({
      success: true,
      userId,
      username,
    })
  } catch (error) {
    console.error("Error registering username:", error)
    return NextResponse.json(
      { success: false, message: "An error occurred while registering the username" },
      { status: 500 },
    )
  }
}
