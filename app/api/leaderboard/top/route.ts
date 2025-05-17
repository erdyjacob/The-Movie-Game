import { type NextRequest, NextResponse } from "next/server"
import { getLeaderboardData } from "@/lib/leaderboard"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = Number.parseInt(searchParams.get("limit") || "5", 10)

    // Get leaderboard data and limit to requested number
    const leaderboardData = await getLeaderboardData()
    const topEntries = leaderboardData.slice(0, limit)

    return NextResponse.json(topEntries)
  } catch (error) {
    console.error("Error fetching top leaderboard entries:", error)
    return NextResponse.json({ error: "Failed to fetch leaderboard data" }, { status: 500 })
  }
}
