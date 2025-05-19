"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { GameItem, GameMode } from "@/lib/types"
import GamePath from "./game-path"
import { BarChart, Network, Trophy, UserPlus } from "lucide-react"
import ErrorBoundary from "./error-boundary"
import PlayerStats from "./player-stats"
import { track } from "@vercel/analytics/react"
import ConnectionWebButton from "./connection-web-button"
import { useUser } from "@/contexts/user-context"
import { useRouter } from "next/navigation"
import { AnimatedButton } from "./game-over/animated-button"
import { GameSummary } from "./game-over/game-summary"
import { NewUnlocks } from "./game-over/new-unlocks"
import { useScoreSync } from "@/hooks/use-score-sync"

// Update the props interface to include difficulty
interface GameOverScreenProps {
  history: GameItem[]
  score: number
  highScore: number
  onRestart: () => void
  gameMode: GameMode
  newUnlocks: {
    actors: GameItem[]
    movies: GameItem[]
  }
  dailyChallengeCompleted?: boolean
  difficulty?: string // Make optional for backward compatibility
}

export default function GameOverScreen({
  history,
  score,
  highScore,
  onRestart,
  gameMode,
  newUnlocks,
  dailyChallengeCompleted,
  difficulty = "medium", // Default to medium if not provided
}: GameOverScreenProps) {
  const isNewHighScore = score > highScore
  const [statsOpen, setStatsOpen] = useState(false)
  const { username, showUsernameSetup, userId } = useUser()
  const router = useRouter()
  const isEstablishedPlayer = history.length > 1

  const { syncScore, isSyncing, syncError, syncSuccess } = useScoreSync()

  // Add this effect to sync score when the game over screen appears
  useEffect(() => {
    // Automatically sync score if user is logged in
    if (username && userId) {
      console.log(`[GameOver] Syncing score for ${username}: ${score}`)
      syncScore(score, gameMode, difficulty)
        .then((success) => {
          if (success) {
            console.log("[GameOver] Score sync successful")
          } else {
            console.warn("[GameOver] Score sync failed")
          }
        })
        .catch((error) => {
          console.error("[GameOver] Score sync error:", error)
        })
    } else {
      console.log("[GameOver] User not logged in, skipping score sync")
    }
  }, [username, userId, score, gameMode, difficulty, syncScore])

  useEffect(() => {
    // Update longest chain if this game's chain is longer than the stored one
    const currentChainLength = history.length
    const storedLongestChain = localStorage.getItem("movieGameLongestChain")
    const longestChain = storedLongestChain ? Number.parseInt(storedLongestChain) : 0

    if (currentChainLength > longestChain) {
      localStorage.setItem("movieGameLongestChain", currentChainLength.toString())
    }
  }, [history.length])

  const openStats = () => {
    setStatsOpen(true)
  }

  const closeStats = () => {
    setStatsOpen(false)
  }

  // Replace the openConnectionWeb function with this direct navigation approach
  const openConnectionWeb = () => {
    // Navigate directly to the connection web page
    window.location.href = "/connection-web"
  }

  // Function to view the leaderboard
  const viewLeaderboard = () => {
    router.push("/leaderboard")
  }

  // Track when the Create Screenname button is clicked
  const handleCreateScreenname = () => {
    track("create_screenname_click", {
      location: "game_over_screen",
    })
    showUsernameSetup()
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-center text-2xl">Game Over</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8 px-6">
        {/* Use the GameSummary component */}
        <GameSummary score={score} highScore={highScore} isNewHighScore={isNewHighScore} />

        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-center mb-4">Your Movie Path</h3>
          <div className="bg-muted/30 p-5 rounded-lg">
            <GamePath history={history} />
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">
            You connected {history.length} items in your movie journey!
          </p>
        </div>

        {/* Use the NewUnlocks component */}
        <NewUnlocks newUnlocks={newUnlocks} />

        {/* Score sync status indicator - only for users with accounts */}
        {username && (
          <div className="text-center text-sm">
            {isSyncing && <p className="text-blue-500">Syncing your score...</p>}
            {syncSuccess && <p className="text-green-500">Score synced to leaderboard!</p>}
            {syncError && <p className="text-red-500">Failed to sync score: {syncError}</p>}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col justify-center gap-4 pt-4 pb-6">
        {/* Main buttons in a grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
          <AnimatedButton
            variant="outline"
            size="lg"
            onClick={openStats}
            className="flex items-center justify-center gap-2 h-12"
          >
            <BarChart size={16} />
            <span>View Stats</span>
          </AnimatedButton>

          <AnimatedButton
            variant="outline"
            size="lg"
            onClick={openConnectionWeb}
            className="flex items-center justify-center gap-2 h-12"
          >
            <Network size={16} />
            <span>Connection Web</span>
          </AnimatedButton>

          <AnimatedButton
            size="lg"
            onClick={() => {
              // Track game restart
              track("game_restart", {
                score,
                highScore,
                gameMode,
                dailyChallengeCompleted,
              })
              onRestart()
            }}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white flex items-center justify-center gap-2 h-12"
          >
            Play Again
          </AnimatedButton>
        </div>

        {/* Conditional button for account creation - different messages based on player status */}
        {!username &&
          (isEstablishedPlayer ? (
            // For established players without accounts
            <div className="w-full mt-2 text-center">
              <p className="text-amber-400 font-medium mb-2">
                Create an account to save your progress and compete on the leaderboard!
              </p>
              <AnimatedButton
                variant="outline"
                size="lg"
                onClick={handleCreateScreenname}
                className="w-full flex items-center justify-center gap-2 h-12 border-amber-400/30 text-amber-400 hover:bg-amber-400/10"
              >
                <UserPlus size={16} />
                <span>Create Account</span>
              </AnimatedButton>
            </div>
          ) : (
            // For new players without accounts
            <AnimatedButton
              variant="outline"
              size="lg"
              onClick={handleCreateScreenname}
              className="w-full mt-2 flex items-center justify-center gap-2 h-12 border-dashed border-2"
            >
              <Trophy size={16} />
              <span>Create Screenname</span>
            </AnimatedButton>
          ))}

        {/* View Leaderboard button - always visible */}
        <AnimatedButton
          variant="ghost"
          size="sm"
          onClick={viewLeaderboard}
          className="mt-2 text-muted-foreground hover:text-foreground"
        >
          <Trophy className="h-4 w-4 mr-1" />
          <span>View Leaderboard</span>
        </AnimatedButton>

        {/* Hidden connection web button that will be triggered programmatically */}
        <div className="hidden">
          <ConnectionWebButton />
        </div>
      </CardFooter>
      {/* Stats modal - Use the simplified version */}
      {statsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={closeStats}>
          <div
            className="bg-background p-3 sm:p-6 rounded-lg w-[95vw] sm:w-full sm:max-w-4xl max-h-[80vh] sm:max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <ErrorBoundary>
              <PlayerStats onClose={closeStats} mode="simple" />
            </ErrorBoundary>
          </div>
        </div>
      )}
    </Card>
  )
}
