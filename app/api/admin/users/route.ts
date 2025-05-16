import { NextResponse } from "next/server"
import { redis } from "@/lib/redis"

export async function GET() {
  try {
    // Get all user keys
    const userKeys = await redis.keys("user:*")

    // Get user data for each key
    const users = []
    for (const key of userKeys) {
      const userData = await redis.hgetall(key)
      if (userData) {
        const userId = key.replace("user:", "")

        // Parse gameStats JSON
        let gameStats = {
          gamesPlayed: 0,
          highScore: 0,
          legendaryCount: 0,
          epicCount: 0,
          rareCount: 0,
          uncommonCount: 0,
          commonCount: 0,
        }

        try {
          if (userData.gameStats) {
            gameStats = JSON.parse(userData.gameStats)
          }
        } catch (e) {
          console.error("Error parsing gameStats:", e)
        }

        users.push({
          id: userId,
          username: userData.username,
          points: Number.parseInt(userData.points || "0"),
          lastActive: Number.parseInt(userData.lastActive || "0"),
          created: Number.parseInt(userData.created || "0"),
          gameStats,
        })
      }
    }

    // Sort users by points (descending)
    users.sort((a, b) => b.points - a.points)

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
