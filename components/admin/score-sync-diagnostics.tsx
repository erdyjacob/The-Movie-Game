"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ScoreSyncDiagnostics() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState("")

  const checkScoreSyncStatus = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/score-sync-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        throw new Error("Failed to get score sync status")
      }

      const data = await response.json()
      setResults(data)
    } catch (err) {
      setError((err as Error).message || "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Score Sync Diagnostics</CardTitle>
        <CardDescription>Check if the score syncing system is working correctly</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="admin-password">Admin Password</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
            />
          </div>

          <Button onClick={checkScoreSyncStatus} disabled={loading || !password}>
            {loading ? "Checking..." : "Check Score Sync Status"}
          </Button>

          {error && <div className="text-red-500">{error}</div>}

          {results && (
            <div className="mt-4 space-y-4">
              <h3 className="text-lg font-semibold">Results</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted p-3 rounded">
                  <p className="font-medium">User Score Keys:</p>
                  <p className="text-2xl">{results.stats.userScoreKeysCount}</p>
                </div>
                <div className="bg-muted p-3 rounded">
                  <p className="font-medium">User Account Score Keys:</p>
                  <p className="text-2xl">{results.stats.userAccountScoreKeysCount}</p>
                </div>
                <div className="bg-muted p-3 rounded">
                  <p className="font-medium">Game History Keys:</p>
                  <p className="text-2xl">{results.stats.gameHistoryKeysCount}</p>
                </div>
                <div className="bg-muted p-3 rounded">
                  <p className="font-medium">Leaderboard Entries:</p>
                  <p className="text-2xl">{results.stats.leaderboardEntriesCount}</p>
                </div>
              </div>

              {results.stats.recentGames && results.stats.recentGames.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Recent Games:</h4>
                  <div className="bg-muted p-3 rounded overflow-auto max-h-60">
                    <pre className="text-xs">{JSON.stringify(results.stats.recentGames, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
