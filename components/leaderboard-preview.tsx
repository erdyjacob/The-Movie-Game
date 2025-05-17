"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Trophy, Loader2 } from "lucide-react"
import { getRankColor, getRankBorderColor } from "@/lib/rank-utils"
import type { LeaderboardEntry } from "@/lib/types"

export function LeaderboardPreview() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/leaderboard/top?limit=5")

        if (!response.ok) {
          throw new Error("Failed to fetch leaderboard data")
        }

        const data = await response.json()
        setLeaderboardData(data)
      } catch (err) {
        console.error("Error fetching leaderboard:", err)
        setError("Could not load leaderboard")
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  if (isLoading) {
    return (
      <div className="border rounded-lg p-4 bg-card">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="border rounded-lg p-4 bg-card">
        <div className="text-center py-4 text-muted-foreground">{error}</div>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <div className="bg-muted/50 px-4 py-3 border-b flex items-center">
        <Trophy className="h-4 w-4 mr-2 text-amber-500" />
        <h3 className="font-semibold">Top Players</h3>
      </div>

      <div className="divide-y">
        {leaderboardData.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No leaderboard data yet. Be the first to play!
          </div>
        ) : (
          leaderboardData.map((entry, index) => (
            <div key={entry.id} className="flex items-center justify-between p-3 hover:bg-muted/30">
              <div className="flex items-center">
                <div className="w-6 font-bold text-muted-foreground">#{index + 1}</div>
                <div className="font-medium">{entry.playerName}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right font-semibold">{entry.score.toLocaleString()}</div>
                <span
                  className={`inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-bold shadow-sm ${getRankColor(entry.rank)} ${getRankBorderColor(entry.rank)}`}
                >
                  {entry.rank}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-3 bg-muted/20 border-t">
        <Link href="/leaderboard" className="w-full">
          <div className="bg-gray-500/20 text-white hover:bg-gray-500/30 rounded-md py-2 px-4 text-center text-sm font-medium transition-colors">
            View Full Leaderboard
          </div>
        </Link>
      </div>
    </div>
  )
}
