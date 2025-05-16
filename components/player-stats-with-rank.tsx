"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, X, Trophy } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface PlayerStatsWithRankProps {
  onClose: () => void
}

export function PlayerStatsWithRank({ onClose }: PlayerStatsWithRankProps) {
  // Get stats from localStorage
  const legendaryCount = Number.parseInt(localStorage.getItem("legendaryCount") || "0")
  const epicCount = Number.parseInt(localStorage.getItem("epicCount") || "0")
  const rareCount = Number.parseInt(localStorage.getItem("rareCount") || "0")
  const uncommonCount = Number.parseInt(localStorage.getItem("uncommonCount") || "0")
  const commonCount = Number.parseInt(localStorage.getItem("commonCount") || "0")
  const gamesPlayed = Number.parseInt(localStorage.getItem("gamesPlayed") || "0")
  const highScore = Number.parseInt(localStorage.getItem("highScore") || "0")

  const [userId, setUserId] = useState(localStorage.getItem("movieGameUserId"))
  const [username, setUsername] = useState(localStorage.getItem("movieGameUsername"))
  const [leaderboardRank, setLeaderboardRank] = useState<number | null>(null)
  const [isLoadingRank, setIsLoadingRank] = useState(false)

  // Calculate total points
  const points = legendaryCount * 100 + epicCount * 50 + rareCount * 25 + uncommonCount * 10 + commonCount * 1

  // Fetch user's leaderboard rank
  useEffect(() => {
    async function fetchRank() {
      if (!username) return

      setIsLoadingRank(true)
      try {
        const response = await fetch(`/api/leaderboard?username=${encodeURIComponent(username)}`)
        const data = await response.json()

        if (data.userRank) {
          setLeaderboardRank(data.userRank.rank)
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard rank:", error)
      } finally {
        setIsLoadingRank(false)
      }
    }

    fetchRank()
  }, [username])

  const handleDeleteAccount = async () => {
    if (!userId) {
      return
    }

    try {
      const response = await fetch(`/api/user/${userId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        // Clear local storage
        localStorage.removeItem("movieGameUserId")
        localStorage.removeItem("movieGameUsername")

        // Clear player history
        localStorage.removeItem("legendaryCount")
        localStorage.removeItem("epicCount")
        localStorage.removeItem("rareCount")
        localStorage.removeItem("uncommonCount")
        localStorage.removeItem("commonCount")
        localStorage.removeItem("gamesPlayed")
        localStorage.removeItem("highScore")

        onClose()
        window.location.reload()
      }
    } catch (error) {
      console.error("Delete account error:", error)
    }
  }

  return (
    <Card className="w-full border-0 rounded-none sm:rounded-lg sm:border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Your Movie Game Stats
          </span>
          <div className="flex items-center gap-2">
            {userId && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your account, leaderboard entries, and game history. This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount}>Delete Account</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {username && (
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Username</h3>
              <p className="text-xl font-semibold">{username}</p>
            </div>

            <div className="text-right">
              <h3 className="text-sm font-medium text-muted-foreground">Leaderboard Rank</h3>
              {isLoadingRank ? (
                <Skeleton className="h-7 w-16 ml-auto" />
              ) : leaderboardRank ? (
                <div className="flex items-center justify-end gap-1">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <p className="text-xl font-semibold">#{leaderboardRank}</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not ranked yet</p>
              )}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Collection</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm">Legendary</span>
                <Badge
                  variant="outline"
                  className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                >
                  {legendaryCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Epic</span>
                <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                  {epicCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Rare</span>
                <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  {rareCount}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm">Uncommon</span>
                <Badge
                  variant="outline"
                  className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                >
                  {uncommonCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Common</span>
                <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                  {commonCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Total</span>
                <Badge variant="outline">{legendaryCount + epicCount + rareCount + uncommonCount + commonCount}</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-muted/50 p-3 rounded-lg">
            <h3 className="text-xs font-medium text-muted-foreground mb-1">Points</h3>
            <p className="text-xl font-semibold">{points.toLocaleString()}</p>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg">
            <h3 className="text-xs font-medium text-muted-foreground mb-1">Games Played</h3>
            <p className="text-xl font-semibold">{gamesPlayed}</p>
          </div>
          <div className="bg-muted/50 p-3 rounded-lg">
            <h3 className="text-xs font-medium text-muted-foreground mb-1">High Score</h3>
            <p className="text-xl font-semibold">{highScore}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
