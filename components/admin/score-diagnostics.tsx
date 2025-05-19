"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function ScoreDiagnostics() {
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runDiagnostics = async () => {
    if (!password) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/score-diagnostics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to run diagnostics")
      }

      setResults(data.results)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Score Diagnostics</CardTitle>
        <CardDescription>Analyze how scores are stored in the database and identify potential issues</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-password">Admin Password</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
            />
          </div>

          {error && <div className="text-sm p-3 rounded bg-red-100 text-red-800">{error}</div>}

          {results && (
            <div className="space-y-4 mt-4">
              <h3 className="text-lg font-semibold">Diagnostic Results</h3>

              <div className="space-y-2">
                <h4 className="font-medium">Leaderboard Entries</h4>
                <p className="text-sm">Found {results.leaderboard.count} entries in the leaderboard</p>
                {results.leaderboard.count > 0 && (
                  <div className="max-h-40 overflow-y-auto text-xs bg-muted p-2 rounded">
                    <pre>{JSON.stringify(results.leaderboard.entries, null, 2)}</pre>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">User Score Keys</h4>
                <p className="text-sm">Found {results.userScoreKeys.count} dedicated user score keys</p>
                {results.userScoreKeys.count > 0 && (
                  <div className="max-h-40 overflow-y-auto text-xs bg-muted p-2 rounded">
                    <pre>
                      {JSON.stringify(
                        results.userScoreKeys.keys.map((key: string, i: number) => ({
                          key,
                          value: results.userScoreKeys.values[i],
                        })),
                        null,
                        2,
                      )}
                    </pre>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">User Objects with Scores</h4>
                <p className="text-sm">
                  Found {results.userObjects.usersWithScores.count} user objects with embedded scores (out of{" "}
                  {results.userObjects.count} total user objects)
                </p>
                {results.userObjects.usersWithScores.count > 0 && (
                  <div className="max-h-40 overflow-y-auto text-xs bg-muted p-2 rounded">
                    <pre>{JSON.stringify(results.userObjects.usersWithScores.entries, null, 2)}</pre>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Player History</h4>
                <p className="text-sm">Found {results.playerHistory.count} player history records</p>
                {results.playerHistory.count > 0 && (
                  <div className="max-h-40 overflow-y-auto text-xs bg-muted p-2 rounded">
                    <pre>{JSON.stringify(results.playerHistory.keys, null, 2)}</pre>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Other Score-Related Keys</h4>
                <p className="text-sm">Found {results.otherScoreKeys.count} other score-related keys</p>
                {results.otherScoreKeys.count > 0 && (
                  <div className="max-h-40 overflow-y-auto text-xs bg-muted p-2 rounded">
                    <pre>{JSON.stringify(results.otherScoreKeys.keys, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={runDiagnostics} disabled={!password || isLoading}>
          {isLoading ? "Running Diagnostics..." : "Run Diagnostics"}
        </Button>
      </CardFooter>
    </Card>
  )
}
