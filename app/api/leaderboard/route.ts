import { type NextRequest, NextResponse } from "next/server"
import { addLeaderboardEntry } from "@/lib/leaderboard"
import type { AccountScore, GameMode, Difficulty } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const { playerName, score, gameMode, difficulty, avatarUrl } = await request.json()

    if (!playerName || !score || !gameMode || !difficulty) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const success = await addLeaderboardEntry(
      playerName,
      score as AccountScore,
      gameMode as GameMode,
      difficulty as Difficulty,
      avatarUrl,
    )

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to add leaderboard entry" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in leaderboard API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
