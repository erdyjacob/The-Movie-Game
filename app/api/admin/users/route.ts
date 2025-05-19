import { kv } from "@vercel/kv"
import { type NextRequest, NextResponse } from "next/server"

const USERS_KEY = "movie-game:users"
const BANNED_USERNAMES_KEY = "movie-game:banned-usernames"

export async function GET(request: NextRequest) {
  try {
    // Check admin password
    const authHeader = request.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    if (token !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ message: "Invalid admin password" }, { status: 401 })
    }

    // Get search query
    const searchQuery = request.nextUrl.searchParams.get("search")?.toLowerCase() || ""

    // Get pagination parameters
    const page = Number.parseInt(request.nextUrl.searchParams.get("page") || "1")
    const limit = Number.parseInt(request.nextUrl.searchParams.get("limit") || "20")

    // Let's fix the problem by updating how users are fetched for the admin panel
    // The current implementation only looks at the movie-game:users hash, but we need
    // to also consider users that only have score objects

    // Update the GET function by modifying the code that fetches users
    // Replace the existing allUsers fetch block with this code:

    // Get all users from the hash
    const allUsersFromHash = (await kv.hgetall(USERS_KEY)) || {}

    // Get all user score keys
    const userScoreKeys = (await kv.keys("user:*:score")) || []

    // Extract user IDs from score keys
    const scoreUserIds = userScoreKeys
      .map((key) => {
        const match = key.match(/user:([^:]+):score/)
        return match ? match[1] : null
      })
      .filter(Boolean)

    // Convert to array and combine both sources
    let users = Object.entries(allUsersFromHash).map(([userId, username]) => ({
      userId,
      username: username as string,
    }))

    // Add users from score keys that aren't in the hash
    const userIdsFromHash = new Set(users.map((user) => user.userId))

    for (const userId of scoreUserIds) {
      if (!userIdsFromHash.has(userId)) {
        // This user has a score but no entry in the users hash
        // Use their user ID as a fallback username
        users.push({
          userId,
          username: `Player_${userId.substring(0, 6)}`,
        })
      }
    }

    if (searchQuery) {
      users = users.filter((user) => user.username.toLowerCase().includes(searchQuery))
    }

    // Fetch scores for all users
    const userScores = await Promise.all(
      users.map(async (user) => {
        // Try to get score from user:{userId}:score
        let score = await kv.get(`user:${user.userId}:score`)

        // If not found, try to get from user object
        if (score === null) {
          const userData = await kv.get(`user:${user.userId}`)
          if (userData && typeof userData === "object" && "score" in userData) {
            score = userData.score
          }
        }

        // If still not found, try to get from leaderboard
        if (score === null) {
          const leaderboardEntry = await kv.zscore("movie-game:leaderboard", user.userId)
          if (leaderboardEntry !== null) {
            score = leaderboardEntry
          }
        }

        return {
          ...user,
          score: score !== null ? Number(score) : null,
        }
      }),
    )

    // Sort alphabetically by username
    userScores.sort((a, b) => a.username.localeCompare(b.username))

    // Calculate total and paginate
    const total = userScores.length
    const startIndex = (page - 1) * limit
    const paginatedUsers = userScores.slice(startIndex, startIndex + limit)

    return NextResponse.json({
      users: paginatedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ message: "Failed to fetch users" }, { status: 500 })
  }
}
