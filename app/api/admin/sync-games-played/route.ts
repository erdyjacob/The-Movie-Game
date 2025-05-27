import { type NextRequest, NextResponse } from "next/server"
import { synchronizeAllGamesPlayedCounts } from "@/lib/game-tracking"
import { synchronizeLeaderboardGamesPlayed } from "@/lib/leaderboard"

export async function POST(request: NextRequest) {
  try {
    // Check for admin password
    const { password } = await request.json()

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[ADMIN] Starting games played synchronization...")

    // Step 1: Synchronize all user game statistics
    const userSyncResult = await synchronizeAllGamesPlayedCounts()
    console.log("[ADMIN] User sync result:", userSyncResult)

    // Step 2: Synchronize leaderboard games played counts
    const leaderboardSyncResult = await synchronizeLeaderboardGamesPlayed()
    console.log("[ADMIN] Leaderboard sync result:", leaderboardSyncResult)

    return NextResponse.json({
      success: true,
      userSync: userSyncResult,
      leaderboardSync: leaderboardSyncResult,
      message: "Games played synchronization completed successfully",
    })
  } catch (error) {
    console.error("[ADMIN] Error in games played sync:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
