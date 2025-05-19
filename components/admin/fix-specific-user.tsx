"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export function FixSpecificUser() {
  const [password, setPassword] = useState("")
  const [userId, setUserId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFixUser = async () => {
    if (!password || !userId) return

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/admin/fix-specific-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password, userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to fix user")
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
        <CardTitle>Fix Specific User</CardTitle>
        <CardDescription>Fix score and leaderboard entry for a specific user</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-id">User ID</Label>
            <Input
              id="user-id"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-password-specific">Admin Password</Label>
            <Input
              id="admin-password-specific"
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

          {result && (
            <div className="space-y-4 mt-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-green-800">{result.message}</h4>
                  <p className="text-sm text-green-700 mt-1">
                    User ID: {result.debug.userId}
                    <br />
                    Username: {result.debug.username}
                    <br />
                    Score: {result.debug.leaderboardAfter?.score || "N/A"}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Debug Information</h4>
                <div className="max-h-60 overflow-y-auto text-xs bg-gray-50 p-3 rounded border">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(result.debug, null, 2)}</pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleFixUser} disabled={!password || !userId || isLoading}>
          {isLoading ? "Fixing User..." : "Fix User"}
        </Button>
      </CardFooter>
    </Card>
  )
}
