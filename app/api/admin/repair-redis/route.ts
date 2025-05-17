import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { getAuthToken } from "@/lib/admin-utils"

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
      issues: [] as string[],
      fixes: [] as string[],
      errors: [] as string[],
    }

    // 1. Check for orphaned user records (user: keys without matching username: keys)
    const userKeys = await kv.keys("user:*")
    for (const userKey of userKeys) {
      try {
        const userId = userKey.replace("user:", "")
        const userData = (await kv.get(userKey)) as any

        if (!userData || !userData.username) {
          results.issues.push(`User ${userId} has no username in data`)
          continue
        }

        const username = userData.username.toLowerCase()
        const usernameKey = `username:${username}`
        const storedUserId = await kv.get(usernameKey)

        if (!storedUserId) {
          // Fix: Create the missing username key
          await kv.set(usernameKey, userId)
          results.fixes.push(`Created missing username key for ${username} -> ${userId}`)
        } else if (storedUserId !== userId) {
          results.issues.push(`Username ${username} points to different user ID: ${storedUserId} vs ${userId}`)
        }
      } catch (error) {
        results.errors.push(`Error processing user key ${userKey}: ${error}`)
      }
    }

    // 2. Check for orphaned username records (username: keys without matching user: keys)
    const usernameKeys = await kv.keys("username:*")
    for (const usernameKey of usernameKeys) {
      try {
        const username = usernameKey.replace("username:", "")
        const userId = await kv.get(usernameKey)

        if (!userId) {
          // Remove the orphaned username key
          await kv.del(usernameKey)
          results.fixes.push(`Removed orphaned username key ${usernameKey} with no user ID`)
          continue
        }

        const userKey = `user:${userId}`
        const userData = await kv.get(userKey)

        if (!userData) {
          // Fix: Create a basic user record
          const newUserData = {
            username: username,
            createdAt: new Date().toISOString(),
            reconstructed: true,
          }
          await kv.set(userKey, newUserData)
          results.fixes.push(`Created missing user data for ${userId} with username ${username}`)
        }
      } catch (error) {
        results.errors.push(`Error processing username key ${usernameKey}: ${error}`)
      }
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error("Error in Redis repair:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
