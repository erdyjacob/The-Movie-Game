"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react"

interface UserMigrationProps {
  adminPassword: string
}

export function UserMigration({ adminPassword }: UserMigrationProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    message?: string
    errors?: string[]
  } | null>(null)

  const handleMigration = async () => {
    if (!adminPassword) {
      setResult({
        success: false,
        message: "Admin password is required",
      })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/migrate-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: adminPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Migration failed")
      }

      setResult({
        success: data.success,
        message: data.message,
        errors: data.errors,
      })
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Data Migration</CardTitle>
        <CardDescription>
          Fix inconsistencies in user data storage by migrating existing users to the new data structure.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {result && (
          <div
            className={`mb-4 p-4 rounded-md ${
              result.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {result.success ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <p className="font-medium">{result.message}</p>
            </div>
            {result.errors && result.errors.length > 0 && (
              <div className="mt-2 text-sm">
                <p className="font-medium">Errors:</p>
                <ul className="list-disc pl-5 mt-1">
                  {result.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          This will scan all existing user data and ensure it's properly stored in both the old and new data structures.
          It's safe to run multiple times and won't affect existing users.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={handleMigration} disabled={isLoading}>
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Migrating...
            </>
          ) : (
            "Migrate User Data"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
