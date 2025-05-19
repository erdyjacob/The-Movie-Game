"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react"

interface UserDataFixProps {
  adminToken: string
}

export function UserDataFix({ adminToken }: UserDataFixProps) {
  const [fixResults, setFixResults] = useState<any>(null)
  const [isFixing, setIsFixing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fixUserData = async () => {
    if (
      !confirm(
        "Are you sure you want to fix user data inconsistencies? This will ensure all users are properly registered in the users hash.",
      )
    ) {
      return
    }

    setIsFixing(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/fix-user-data", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setFixResults(data.results)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsFixing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Fix User Data Inconsistencies
          <Button onClick={fixUserData} disabled={isFixing} variant="default" size="sm">
            {isFixing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Fix User Data
          </Button>
        </CardTitle>
        <CardDescription>Ensure all users are properly registered in the users hash</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {fixResults && (
          <Alert className="mb-4" variant={fixResults.errors.length > 0 ? "destructive" : "default"}>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Fix Results</AlertTitle>
            <AlertDescription>
              <div className="mt-2">
                <p>
                  <strong>Direct user objects found:</strong> {fixResults.directUserObjects}
                </p>
                <p>
                  <strong>Users added to hash:</strong> {fixResults.usersAddedToHash}
                </p>
              </div>

              {fixResults.fixedUserIds.length > 0 && (
                <div className="mt-2">
                  <p>
                    <strong>Fixed users:</strong>
                  </p>
                  <div className="max-h-40 overflow-y-auto mt-1 bg-gray-100 p-2 rounded text-xs">
                    {fixResults.fixedUserIds.map((id: string, i: number) => (
                      <div key={i} className="mb-1">
                        {id}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {fixResults.errors.length > 0 && (
                <div className="mt-2">
                  <p>
                    <strong>Errors:</strong>
                  </p>
                  <ul className="list-disc pl-5 text-red-500 max-h-40 overflow-y-auto">
                    {fixResults.errors.map((err: string, i: number) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {!fixResults && !isFixing && !error && (
          <div className="text-center py-4 text-gray-500">
            Click "Fix User Data" to ensure all users are properly registered in the users hash
          </div>
        )}
      </CardContent>
    </Card>
  )
}
