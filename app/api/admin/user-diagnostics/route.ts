import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"
import { getAuthToken } from "@/lib/admin-utils"

export async function GET(request: Request) {
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

    // Get all keys that might be related to users
    const allUserRelatedKeys = await kv.keys("*user*")
    const userKeys = await kv.keys("user:*")
    const usersHashKeys = await kv.keys("*users*")

    // Get the contents of the users hash
    const usersHashContent = (await kv.hgetall("movie-game:users")) || {}

    // Get direct user objects
    const directUserObjects = []
    for (const key of userKeys) {
      if (key.split(":").length === 2) {
        // Only direct user objects like user:123
        const userData = await kv.get(key)
        directUserObjects.push({
          key,
          data: userData,
        })
      }
    }

    // Get user score objects
    const userScoreObjects = []
    for (const key of userKeys) {
      if (key.includes(":score")) {
        const scoreData = await kv.get(key)
        userScoreObjects.push({
          key,
          data: scoreData,
        })
      }
    }

    return NextResponse.json({
      allUserRelatedKeys,
      userKeys,
      usersHashKeys,
      usersHashContent,
      directUserObjects,
      userScoreObjects,
      counts: {
        allUserRelatedKeys: allUserRelatedKeys.length,
        userKeys: userKeys.length,
        usersHashKeys: usersHashKeys.length,
        usersHashEntries: Object.keys(usersHashContent).length,
        directUserObjects: directUserObjects.length,
        userScoreObjects: userScoreObjects.length,
      },
    })
  } catch (error) {
    console.error("Error in user diagnostics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
