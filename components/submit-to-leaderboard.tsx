"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import type { AccountScore, GameMode, Difficulty } from "@/lib/types"
import { useRouter } from "next/navigation"
import { useUser } from "@/contexts/user-context"

interface SubmitToLeaderboardProps {
  score: AccountScore
  gameMode: GameMode
  difficulty: Difficulty
}

export function SubmitToLeaderboard({ score, gameMode, difficulty }: SubmitToLeaderboardProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [playerName, setPlayerName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const router = useRouter()
  const { username, userId } = useUser()

  useEffect(() => {
    if (username) {
      setPlayerName(username)
    }
  }, [username])

  const handleSubmit = async () => {
    if (!playerName.trim()) return

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/leaderboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerName: playerName.trim(),
          score,
          gameMode,
          difficulty,
          userId, // Include userId from context
        }),
      })

      if (response.ok) {
        setIsSubmitted(true)
      } else {
        console.error("Failed to submit score")
      }
    } catch (error) {
      console.error("Error submitting score:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const viewLeaderboard = () => {
    setIsOpen(false)
    router.push("/leaderboard")
  }

  return (
    <>
      <Button variant="outline" onClick={() => setIsOpen(true)} className="mt-4">
        Submit to Leaderboard
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isSubmitted ? "Score Submitted!" : "Submit Your Score"}</DialogTitle>
          </DialogHeader>

          {!isSubmitted ? (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Your Score: {score.points}</p>
                  <p className="text-sm font-medium">Rank: {score.rank}</p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="playerName" className="text-sm font-medium">
                    Your name:
                  </label>
                  <Input
                    id="playerName"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="Your name"
                    maxLength={20}
                    disabled={!!username} // Disable if we have a username from context
                  />
                  {username && <p className="text-xs text-gray-500">Using your registered screen name</p>}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={!playerName.trim() || isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Score"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="py-4 text-center">
                <p className="mb-4">Your score has been submitted to the leaderboard!</p>
                <Button onClick={viewLeaderboard}>View Leaderboard</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
