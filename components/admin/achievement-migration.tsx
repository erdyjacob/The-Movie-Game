"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, RefreshCw, Trophy, Users } from "lucide-react"

interface AchievementMigrationProps {
  adminPassword: string
}

interface MigrationResult {
  success: boolean
  message: string
  migratedCount?: number
  errorCount?: number
  errors?: string[]
}

export function AchievementMigration({ adminPassword }: AchievementMigrationProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<MigrationResult | null>(null)

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
      const response = await fetch("/api/admin/migrate-achievements", {
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

      setResult(data)
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
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Achievement System Migration
        </CardTitle>
        <CardDescription>
          Migrate existing users to the new achievement system. This will analyze each user's current stats and unlock
          any achievements they should already have earned.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {result && (
          <div
            className={`p-4 rounded-md ${
              result.success
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {result.success ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <p className="font-medium">{result.message}</p>
            </div>

            {result.success && result.migratedCount !== undefined && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  <span>Users migrated: {result.migratedCount}</span>
                </div>
                {result.errorCount !== undefined && result.errorCount > 0 && (
                  <div className="flex items-center gap-2 text-sm text-amber-700">
                    <AlertCircle className="h-4 w-4" />
                    <span>Errors encountered: {result.errorCount}</span>
                  </div>
                )}
              </div>
            )}

            {result.errors && result.errors.length > 0 && (
              <div className="mt-3 text-sm">
                <p className="font-medium">Sample errors:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  {result.errors.slice(0, 5).map((error, index) => (
                    <li key={index} className="text-xs">
                      {error}
                    </li>
                  ))}
                </ul>
                {result.errors.length > 5 && (
                  <p className="text-xs mt-1 text-gray-600">...and {result.errors.length - 5} more</p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <h4 className="font-medium">What this migration does:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
            <li>Analyzes each user's current collection score and leaderboard rank</li>
            <li>Unlocks achievements they should already have (50k Club, 100k Club, etc.)</li>
            <li>Sets correct progress for partially completed achievements</li>
            <li>Saves achievement data to user profiles</li>
            <li>Safe to run multiple times - won't duplicate achievements</li>
          </ul>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Important Notes</span>
          </div>
          <ul className="text-sm text-amber-700 mt-2 space-y-1 list-disc pl-5">
            <li>This is a one-time migration for existing users</li>
            <li>New users will automatically get achievements going forward</li>
            <li>The process may take a few minutes for large user bases</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleMigration} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Migrating Achievements...
            </>
          ) : (
            <>
              <Trophy className="mr-2 h-4 w-4" />
              Start Achievement Migration
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
