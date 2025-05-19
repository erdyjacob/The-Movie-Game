import { type NextRequest, NextResponse } from "next/server"
import { syncPlayerHistoryAndUpdateScore } from "@/lib/score-tracking"
import type { PlayerHistory } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const { userId, username, playerHistory, gameScore, gameMode, difficulty } = await request.json()

    if (!userId || !username || !playerHistory) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    console.log(`[API] Sync history request received for ${username} (${userId})`)

    // Log the game score if provided
    if (gameScore !== undefined) {
      console.log(`[API] Game finished with score: ${gameScore}, mode: ${gameMode}, difficulty: ${difficulty}`)
    }

    // Calculate item count from history
    const itemCount = playerHistory.movies?.length + playerHistory.actors?.length

    const success = await syncPlayerHistoryAndUpdateScore(
      userId,
      username,
      playerHistory as PlayerHistory,
      gameScore,
      gameMode,
      difficulty,
      itemCount,
    )

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, message: "Failed to sync player history" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error in sync history API:", error)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
