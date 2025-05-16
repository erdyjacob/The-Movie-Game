"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, Loader2 } from "lucide-react"
import { UsernameRegistrationModal } from "./username-registration-modal"

interface LeaderboardEntry {
  rank: number
  username: string
  points: number
}

interface LeaderboardProps {
  className?: string
}

export function Leaderboard({ className }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null)
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true)

        // Get username from localStorage
        const username = localStorage.getItem("movieGameUsername")

        // Construct URL with username if available
        let url = "/api/leaderboard"
        if (username) {
          url += `?username=${encodeURIComponent(username)}`
        }

        const response = await fetch(url)
        const data = await response.json()

        if (data.leaderboard) {
          setLeaderboard(data.leaderboard)
        }

        if (data.userRank) {
          setUserRank(data.userRank)
        }

        // Check if user is logged in
        const userId = localStorage.getItem("movieGameUserId")
        if (!userId) {
          setShowRegisterPrompt(true)
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  const handleUsernameSubmit = (userId: string, username: string) => {
    // Refresh leaderboard after registration
    window.location.reload()
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="h-5 w-5 text-amber-500" />
          <span>Leaderboard</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {leaderboard.length > 0 ? (
                leaderboard.map((entry, index) => (
                  <div
                    key={entry.username}
                    className={`flex items-center justify-between p-2 rounded-md ${
                      index === 0
                        ? "bg-amber-100 dark:bg-amber-900/20"
                        : index === 1
                          ? "bg-slate-100 dark:bg-slate-800/40"
                          : index === 2
                            ? "bg-orange-100 dark:bg-orange-900/20"
                            : "bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold w-6 text-center">{entry.rank}</span>
                      <span>{entry.username}</span>
                    </div>
                    <span className="font-mono">{entry.points.toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <p className="text-center py-4 text-muted-foreground">No players yet. Be the first!</p>
              )}
            </div>

            {userRank && !leaderboard.some((entry) => entry.username === userRank.username) && (
              <div className="mt-4 p-2 border-t pt-4">
                <div className="flex items-center justify-between p-2 rounded-md bg-blue-100 dark:bg-blue-900/20">
                  <div className="flex items-center gap-3">
                    <span className="font-bold w-6 text-center">{userRank.rank}</span>
                    <span>{userRank.username} (You)</span>
                  </div>
                  <span className="font-mono">{userRank.points.toLocaleString()}</span>
                </div>
              </div>
            )}

            {showRegisterPrompt && (
              <div className="mt-4 p-3 border rounded-md bg-muted/30">
                <p className="text-sm text-center mb-2">Register to appear on the leaderboard!</p>
                <Button className="w-full" size="sm" onClick={() => setIsRegistering(true)}>
                  Choose Username
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Username registration modal */}
      <UsernameRegistrationModal
        isOpen={isRegistering}
        onClose={() => setIsRegistering(false)}
        onSubmit={handleUsernameSubmit}
      />
    </Card>
  )
}
