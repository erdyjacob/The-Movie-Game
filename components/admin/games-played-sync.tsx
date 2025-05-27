"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Play, CheckCircle, AlertCircle } from "lucide-react"

interface SyncResult {
  processed: number
  updated: number
  errors: number
}

interface SyncResponse {
  success: boolean
  userSync: SyncResult
  leaderboardSync: SyncResult
  message: string
}

export function GamesPlayedSync() {
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<SyncResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSync = async () => {
    if (!password.trim()) {
      setError("Password is required")
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/admin/sync-games-played", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Sync failed")
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Games Played Synchronization
        </CardTitle>
        <CardDescription>
          Synchronize games played counts across all users and update the leaderboard with accurate data from the game
          tracking system.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Admin Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
          />
        </div>

        <Button onClick={handleSync} disabled={isLoading || !password.trim()} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Synchronizing...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Start Synchronization
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">User Statistics Sync</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processed:</span>
                    <span className="font-mono">{result.userSync.processed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Updated:</span>
                    <span className="font-mono text-green-600">{result.userSync.updated}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Errors:</span>
                    <span className="font-mono text-red-600">{result.userSync.errors}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Leaderboard Sync</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processed:</span>
                    <span className="font-mono">{result.leaderboardSync.processed}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Updated:</span>
                    <span className="font-mono text-green-600">{result.leaderboardSync.updated}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Errors:</span>
                    <span className="font-mono text-red-600">{result.leaderboardSync.errors}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
