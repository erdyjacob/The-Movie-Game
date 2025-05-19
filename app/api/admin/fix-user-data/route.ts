import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { getAuthToken } from "@/lib/admin-utils"

const USERS_KEY = "movie-game:users"

export async function POST(request: Request) {
  try {
    // Check for admin authorization
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const isAuthorized = (await getAuthToken()) === token

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const results = {
      directUserObjects: 0,
      usersAddedToHash: 0,
      errors: [] as string[],
      fixedUserIds: [] as string[],
    }

    // 1. Get all direct user objects
    const userKeys = await kv.keys("user:*")
    const directUserKeys = userKeys.filter((key) => key.split(":").length === 2)

    results.directUserObjects = directUserKeys.length

    // 2. Get current users hash
    const usersHash = (await kv.hgetall(USERS_KEY)) || {}

    // 3. Process each direct user object
    for (const userKey of directUserKeys) {
      try {
        const userId = userKey.replace("user:", "")
        const userData = (await kv.get(userKey)) as any

        if (!userData || !userData.username) {
          results.errors.push(`User ${userId} has no username in data`)
          continue
        }

        // 4. Add to users hash if not already there
        if (!usersHash[userId]) {
          await kv.hset(USERS_KEY, { [userId]: userData.username })
          results.usersAddedToHash++
          results.fixedUserIds.push(userId)
        }
      } catch (error) {
        results.errors.push(`Error processing user key ${userKey}: ${error}`)
      }
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error("Error fixing user data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
