import { recordEnhancedGameParticipation } from "./enhanced-game-tracking"
import { calculateScoreFromHistory, updateUserScore } from "./score-tracking"
import type { PlayerHistory, GameMode, GameItem } from "./types"

// Enhanced game completion recording
export async function recordEnhancedGameCompletion(
  userId: string,
  username: string,
  gameData: {
    score: number
    itemCount: number
    gameMode: GameMode
    difficulty: string
    duration?: number
    gameItems: GameItem[]
    gameEndReason: "completed" | "strikes" | "timeout" | "quit"
    strikes?: number
    timingData?: {
      connectionTimes: number[]
      finalMinuteItems?: number
    }
  },
  playerHistory: PlayerHistory,
): Promise<boolean> {
  try {
    console.log(`[ENHANCED_COMPLETION] Recording enhanced game completion for ${username}`)

    // Record in enhanced tracking system
    const gameId = await recordEnhancedGameParticipation(userId, username, gameData)

    if (!gameId) {
      console.error("Failed to record enhanced game participation")
      return false
    }

    // Continue with existing score tracking
    const accountScore = await calculateScoreFromHistory(userId, username, playerHistory)
    if (!accountScore) {
      console.error("Failed to calculate score from history")
      return false
    }

    // Update user score
    const success = await updateUserScore(userId, username, accountScore)

    console.log(`[ENHANCED_COMPLETION] Enhanced game completion recorded successfully: ${gameId}`)
    return success
  } catch (error) {
    console.error("Error recording enhanced game completion:", error)
    return false
  }
}
