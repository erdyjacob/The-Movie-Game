import { kv } from "@vercel/kv"
import { type NextRequest, NextResponse } from "next/server"

const USERS_KEY = "movie-game:users"
const BANNED_USERNAMES_KEY = "movie-game:banned-usernames"
const USERNAMES_KEY = "movie-game:usernames"

export async function POST(request: NextRequest) {
  try {
    const { userId, username, password, banUsername = false } = await request.json()

    // Validate admin password
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ message: "Invalid admin password" }, { status: 401 })
    }

    if (!userId || !username) {
      return NextResponse.json({ message: "User ID and username are required" }, { status: 400 })
    }

    const lowercaseUsername = username.toLowerCase()

    // Use a transaction to ensure all operations succeed or fail together
    const pipeline = kv.pipeline()

    // Delete from the users hash
    pipeline.hdel(USERS_KEY, userId)

    // Delete from the usernames set
    pipeline.srem(USERNAMES_KEY, lowercaseUsername)

    // Delete the individual keys
    pipeline.del(`username:${lowercaseUsername}`)
    pipeline.del(`user:${userId}`)

    // If banUsername is true, add to banned usernames set
    if (banUsername) {
      pipeline.sadd(BANNED_USERNAMES_KEY, lowercaseUsername)
    }

    // Execute all commands atomically
    await pipeline.exec()

    return NextResponse.json({
      message: `User ${username} deleted successfully${banUsername ? " and username banned" : ""}`,
    })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ message: "Failed to delete user" }, { status: 500 })
  }
}
