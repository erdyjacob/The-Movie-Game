"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export function ForceRebuildLeaderboard() {
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRebuildLeaderboard = async () => {
    if (!password) return

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/admin/force-rebuild-leaderboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to rebuild leaderboard")
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Force Rebuild Leaderboard</CardTitle>
        <CardDescription>Completely rebuild the leaderboard from scratch with all users</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-password-rebuild">Admin Password</Label>
            <Input
              id="admin-password-rebuild"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-sm text-amber-800">
            <strong>Warning:</strong> This will completely clear the existing leaderboard and rebuild it from scratch.
            All users will be assigned scores (random scores if none exist) and added to the leaderboard.
          </div>

          {error && (
            <div className="text-sm p-3 rounded bg-red-100 text-red-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="space-y-4 mt-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-green-800">{result.message}</h4>
                  <ul className="mt-2 space-y-1 text-sm text-green-700">
                    <li>Users processed: {result.results.usersProcessed}</li>
                    <li>Users with scores: {result.results.usersWithScores}</li>
                    <li>Added to leaderboard: {result.results.addedToLeaderboard}</li>
                  </ul>
                </div>
              </div>

              {result.results.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-800">Errors ({result.results.errors.length})</h4>
                  <div className="max-h-40 overflow-y-auto text-xs bg-red-50 p-3 rounded border border-red-200">
                    <ul className="space-y-1">
                      {result.results.errors.map((error: string, index: number) => (
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
        <Button onClick={handleRebuildLeaderboard} disabled={!password || isLoading} variant="destructive">
          {isLoading ? "Rebuilding Leaderboard..." : "Force Rebuild Leaderboard"}
        </Button>
      </CardFooter>
    </Card>
  )
}
