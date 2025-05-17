"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react"

interface LeaderboardRepairProps {
  adminToken: string
}

export function LeaderboardRepair({ adminToken }: LeaderboardRepairProps) {
  const [repairResults, setRepairResults] = useState<any>(null)
  const [isRepairing, setIsRepairing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const repairLeaderboard = async () => {
    if (
      !confirm(
        "Are you sure you want to repair the leaderboard? This will scan all users and update their leaderboard entries.",
      )
    ) {
      return
    }

    setIsRepairing(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/repair-leaderboard", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setRepairResults(data.results)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsRepairing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Leaderboard Repair
          <Button onClick={repairLeaderboard} disabled={isRepairing} variant="default" size="sm">
            {isRepairing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Repair Leaderboard
          </Button>
        </CardTitle>
        <CardDescription>Fix missing or incorrect leaderboard entries for all users</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {repairResults && (
          <Alert className="mb-4" variant={repairResults.errors.length > 0 ? "destructive" : "default"}>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Repair Results</AlertTitle>
            <AlertDescription>
              <div className="mt-2">
                <p>
                  <strong>Users scanned:</strong> {repairResults.scannedUsers}
                </p>
                <p>
                  <strong>Leaderboard entries updated:</strong> {repairResults.updatedEntries}
                </p>
                <p>
                  <strong>Users skipped:</strong> {repairResults.skippedUsers}
                </p>
                <p>
                  <strong>Errors:</strong> {repairResults.errors.length}
                </p>
              </div>

              {repairResults.fixedUserIds.length > 0 && (
                <div className="mt-2">
                  <p>
                    <strong>Fixed users:</strong>
                  </p>
                  <div className="max-h-40 overflow-y-auto mt-1 bg-gray-100 p-2 rounded text-xs">
                    {repairResults.fixedUserIds.map((id: string, i: number) => (
                      <div key={i} className="mb-1">
                        {id}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {repairResults.errors.length > 0 && (
                <div className="mt-2">
                  <p>
                    <strong>Errors:</strong>
                  </p>
                  <ul className="list-disc pl-5 text-red-500 max-h-40 overflow-y-auto">
                    {repairResults.errors.map((err: string, i: number) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {!repairResults && !isRepairing && !error && (
          <div className="text-center py-4 text-gray-500">
            Click "Repair Leaderboard" to scan all users and fix missing leaderboard entries
          </div>
        )}
      </CardContent>
    </Card>
  )
}
