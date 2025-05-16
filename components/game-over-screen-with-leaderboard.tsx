"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Network, RotateCcw, Trophy, Target } from "lucide-react"
import PlayerStats from "./player-stats"
import { UsernameRegistrationModal } from "./username-registration-modal"

interface GameOverScreenProps {
  score: number
  highScore: number
  onRestart: () => void
  onViewStats: () => void
  onViewConnectionWeb: () => void
  gameMode?: string
  dailyChallengeCompleted?: boolean
}

export default function GameOverScreen({
  score,
  highScore,
  onRestart,
  onViewStats,
  onViewConnectionWeb,
  gameMode = "timed",
  dailyChallengeCompleted = false,
}: GameOverScreenProps) {
  const [showStats, setShowStats] = useState(false)
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false)
  const [scoreUpdated, setScoreUpdated] = useState(false)

  // Check if user has played a game before and needs to register
  useEffect(() => {
    const hasPlayedBefore = localStorage.getItem("movieGameHasPlayed")
    const hasUsername = localStorage.getItem("movieGameUsername")

    if (hasPlayedBefore && !hasUsername) {
      setShowUsernamePrompt(true)
    }
  }, [])

  // Update leaderboard score
  useEffect(() => {
    const updateLeaderboard = async () => {
      const userId = localStorage.getItem("movieGameUserId")
      if (!userId || scoreUpdated) return

      try {
        // Get stats from localStorage
        const legendaryCount = Number.parseInt(localStorage.getItem("legendaryCount") || "0")
        const epicCount = Number.parseInt(localStorage.getItem("epicCount") || "0")
        const rareCount = Number.parseInt(localStorage.getItem("rareCount") || "0")
        const uncommonCount = Number.parseInt(localStorage.getItem("uncommonCount") || "0")
        const commonCount = Number.parseInt(localStorage.getItem("commonCount") || "0")
        const gamesPlayed = Number.parseInt(localStorage.getItem("gamesPlayed") || "0") + 1

        // Update localStorage counter
        localStorage.setItem("gamesPlayed", gamesPlayed.toString())

        // Prepare stats object
        const stats = {
          legendaryCount,
          epicCount,
          rareCount,
          uncommonCount,
          commonCount,
          highScore,
          gamesPlayed,
        }

        // Update server
        const response = await fetch("/api/user/update-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, stats }),
        })

        if (response.ok) {
          setScoreUpdated(true)
        }
      } catch (err) {
        console.error("Failed to update score:", err)
      }
    }

    updateLeaderboard()
  }, [highScore, scoreUpdated])

  const handleUsernameSubmit = (userId: string, username: string) => {
    setShowUsernamePrompt(false)
    // Update leaderboard after registration
    setScoreUpdated(false) // Reset to trigger update
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-2xl">Game Over</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {gameMode === "dailyChallenge" ? (
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold">
              Daily Challenge {dailyChallengeCompleted ? "Completed!" : "Failed"}
            </h3>
            {dailyChallengeCompleted ? (
              <div className="flex justify-center">
                <div className="inline-flex items-center bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full">
                  <Target className="h-4 w-4 mr-1" />
                  <span>Challenge Complete</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Better luck tomorrow!</p>
            )}
          </div>
        ) : (
          <div className="text-center space-y-2">
            <div className="text-4xl font-bold">{score}</div>
            <p className="text-muted-foreground">Your Score</p>

            {score >= highScore && score > 0 && (
              <div className="mt-2 inline-flex items-center bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-full">
                <Trophy className="h-4 w-4 mr-1" />
                <span>New High Score!</span>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-20 p-2"
            onClick={() => {
              setShowStats(true)
              onViewStats()
            }}
          >
            <BarChart className="h-6 w-6 mb-1" />
            <span className="text-xs text-center">View Stats</span>
          </Button>

          <Button
            variant="outline"
            className="flex flex-col items-center justify-center h-20 p-2"
            onClick={onViewConnectionWeb}
          >
            <Network className="h-6 w-6 mb-1" />
            <span className="text-xs text-center">Connection Web</span>
          </Button>

          <Button
            variant="default"
            className="flex flex-col items-center justify-center h-20 p-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            onClick={onRestart}
          >
            <RotateCcw className="h-6 w-6 mb-1" />
            <span className="text-xs text-center">Play Again</span>
          </Button>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center pt-2">
        <p className="text-xs text-center text-muted-foreground">
          {gameMode === "dailyChallenge"
            ? "A new daily challenge will be available tomorrow!"
            : "Keep playing to discover rare movies and actors!"}
        </p>
      </CardFooter>

      {/* Username registration modal */}
      <UsernameRegistrationModal
        isOpen={showUsernamePrompt}
        onClose={() => setShowUsernamePrompt(false)}
        onSubmit={handleUsernameSubmit}
      />

      {/* Stats modal */}
      {showStats && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setShowStats(false)}
        >
          <div
            className="bg-background p-3 sm:p-6 rounded-lg w-[95vw] sm:w-full sm:max-w-4xl max-h-[80vh] sm:max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <PlayerStats onClose={() => setShowStats(false)} mode="full" />
          </div>
        </div>
      )}
    </Card>
  )
}
