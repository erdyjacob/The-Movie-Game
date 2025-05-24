"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LeaderboardTable } from "./leaderboard-table"
import type { LeaderboardEntry } from "@/lib/types"

export function LeaderboardPreview() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch("/api/leaderboard/top")
        if (!response.ok) {
          throw new Error("Failed to fetch leaderboard")
        }

        const data = await response.json()

        // Ensure all entries have gamesPlayed field for backward compatibility
        const processedData = data.map((entry: LeaderboardEntry) => ({
          ...entry,
          gamesPlayed: entry.gamesPlayed || 0,
        }))

        setLeaderboardData(processedData.slice(0, 5)) // Show top 5 for preview
      } catch (error) {
        console.error("Error fetching leaderboard:", error)
        setError("Failed to load leaderboard")
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Players</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Players</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Players</CardTitle>
      </CardHeader>
      <CardContent>
        <LeaderboardTable data={leaderboardData} />
        {leaderboardData.length > 0 && (
          <div className="mt-4 text-center">
            <a href="/leaderboard" className="text-sm text-primary hover:underline">
              View Full Leaderboard →
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
