"use client"

import { useState, useCallback } from "react"
import { useUser } from "@/contexts/user-context"
import { loadPlayerHistory } from "@/lib/player-history"
import type { GameMode } from "@/lib/types"

export function useScoreSync() {
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [syncSuccess, setSyncSuccess] = useState(false)
  const { username, userId } = useUser()

  const syncScore = useCallback(
    async (score: number, gameMode: GameMode, difficulty: string) => {
      // Reset states
      setSyncError(null)
      setSyncSuccess(false)

      // Don't sync if no user is logged in
      if (!username || !userId) {
        console.log("[Score Sync] Skipped - No user logged in")
        return false
      }

      setIsSyncing(true)

      try {
        console.log(`[Score Sync] Starting sync for ${username} (${userId})`)

        // Load the player's history from localStorage
        const playerHistory = loadPlayerHistory()

        // Send the request to sync history and update score
        const response = await fetch("/api/player/sync-history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            username,
            playerHistory,
            gameScore: score, // Include the game score for tracking
            gameMode,
            difficulty,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || "Failed to sync score")
        }

        console.log(`[Score Sync] Sync successful for ${username}`)
        setSyncSuccess(true)
        return true
      } catch (error) {
        console.error("[Score Sync] Error:", error)
        setSyncError(typeof error === "object" && error !== null ? (error as Error).message : String(error))
        return false
      } finally {
        setIsSyncing(false)
      }
    },
    [username, userId],
  )

  return {
    syncScore,
    isSyncing,
    syncError,
    syncSuccess,
    isAuthenticated: !!username && !!userId,
  }
}
