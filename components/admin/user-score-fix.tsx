"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export function UserScoreFix() {
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fixUserScores = async () => {
    if (!password) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/fix-user-scores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to fix user scores")
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
        <CardTitle>Fix User Scores</CardTitle>
        <CardDescription>Recalculate and fix user scores based on their collection history</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-password-scores">Admin Password</Label>
            <Input
              id="admin-password-scores"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
            />
          </div>

          {error && (
            <div className="text-sm p-3 rounded bg-red-100 text-red-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {results && (
            <div className="space-y-4 mt-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-green-800">Score Fix Completed</h4>
                  <ul className="mt-2 space-y-1 text-sm text-green-700">
                    <li>Users processed: {results.usersProcessed}</li>
                    <li>Scores fixed: {results.scoresFixed}</li>
                    <li>Leaderboard entries updated: {results.leaderboardUpdates}</li>
                  </ul>
                </div>
              </div>

              {results.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-800">Errors ({results.errors.length})</h4>
                  <div className="max-h-40 overflow-y-auto text-xs bg-red-50 p-3 rounded border border-red-200">
                    <ul className="space-y-1">
                      {results.errors.map((error: string, index: number) => (
                        <li key={index} className="text-red-700">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={fixUserScores} disabled={!password || isLoading}>
          {isLoading ? "Fixing User Scores..." : "Fix User Scores"}
        </Button>
      </CardFooter>
    </Card>
  )
}
