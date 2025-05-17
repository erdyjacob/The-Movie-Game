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

    // Delete user from users hash
    await kv.hdel(USERS_KEY, userId)

    // Delete username from usernames set
    await kv.srem(USERNAMES_KEY, username.toLowerCase())

    // If banUsername is true, add to banned usernames set
    if (banUsername) {
      await kv.sadd(BANNED_USERNAMES_KEY, username.toLowerCase())
    }

    return NextResponse.json({
      message: `User ${username} deleted successfully${banUsername ? " and username banned" : ""}`,
    })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ message: "Failed to delete user" }, { status: 500 })
  }
}
