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

    // Get all users
    const allUsers = (await kv.hgetall(USERS_KEY)) || {}

    // Convert to array and filter by search query if provided
    let users = Object.entries(allUsers).map(([userId, username]) => ({
      userId,
      username: username as string,
    }))

    if (searchQuery) {
      users = users.filter((user) => user.username.toLowerCase().includes(searchQuery))
    }

    // Sort alphabetically by username
    users.sort((a, b) => a.username.localeCompare(b.username))

    // Calculate total and paginate
    const total = users.length
    const startIndex = (page - 1) * limit
    const paginatedUsers = users.slice(startIndex, startIndex + limit)

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
