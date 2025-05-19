"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function FixMissingScores({ adminToken }: { adminToken: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFixMissingScores = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/fix-missing-scores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fix missing scores")
      }

      setResults(data.results)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Fix Missing Score Objects</CardTitle>
        <CardDescription>Create missing score objects for users who have accounts but no score data</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleFixMissingScores} disabled={isLoading} className="mb-4">
          {isLoading ? "Fixing..." : "Fix Missing Scores"}
        </Button>

        {error && <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-md">{error}</div>}

        {results && (
          <div className="p-4 bg-gray-100 rounded-md">
            <h3 className="font-semibold mb-2">Results:</h3>
            <ul className="space-y-1">
              <li>Users processed: {results.usersProcessed}</li>
              <li>Missing scores found: {results.missingScores}</li>
              <li>Scores created: {results.scoresCreated}</li>
              {results.fixedUserIds.length > 0 && <li>Fixed user IDs: {results.fixedUserIds.join(", ")}</li>}
            </ul>

            {results.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold mb-1">Errors:</h4>
                <ul className="text-sm text-red-600">
                  {results.errors.map((err: string, i: number) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
