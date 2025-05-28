"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Database } from "lucide-react"

interface DiagnosticResult {
  userId: string
  username: string
  gameTrackingCount: number
  leaderboardCount: number
  userStatsCount: number
  legacyGameHistoryCount: number
  discrepancy: number
  lastGameRecorded: string | null
  lastLeaderboardUpdate: string | null
  cacheStatus: string
  issues: string[]
}

interface DiagnosticResponse {
  success: boolean
  totalUsersAnalyzed: number
  usersWithDiscrepancies: number
  diagnosticResults: DiagnosticResult[]
  analysis: {
    summary: {
      totalUsers: number
      usersWithIssues: number
      usersWithDiscrepancies: number
      issueRate: string
      discrepancyRate: string
    }
    statistics: {
      averageDiscrepancy: number
      maxDiscrepancy: number
      totalDiscrepancy: number
    }
    commonIssues: Array<{
      issue: string
      count: number
      percentage: string
    }>
  }
  timestamp: string
}

interface FixResult {
  userId: string
  username: string
  beforeCount: number
  afterCount: number
  fixed: boolean
  error?: string
}

export function GamesPlayedDiagnostics() {
  const [password, setPassword] = useState("")
  const [isRunning, setIsRunning] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticResponse | null>(null)
  const [fixResults, setFixResults] = useState<FixResult[] | null>(null)
  const [error, setError] = useState("")

  const runDiagnostics = async () => {
    if (!password) {
      setError("Password is required")
      return
    }

    setIsRunning(true)
    setError("")

    try {
      const response = await fetch("/api/admin/games-played-diagnostics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run diagnostics")
      }

      setDiagnosticData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsRunning(false)
    }
  }

  const runFix = async (fixType: string, userIds?: string[]) => {
    if (!password) {
      setError("Password is required")
      return
    }

    setIsFixing(true)
    setError("")

    try {
      const response = await fetch("/api/admin/fix-games-played-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, fixType, userIds }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run fix")
      }

      setFixResults(data.results)

      // Re-run diagnostics after fix
      setTimeout(() => {
        runDiagnostics()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsFixing(false)
    }
  }

  const getSeverityColor = (discrepancy: number) => {
    const abs = Math.abs(discrepancy)
    if (abs === 0) return "bg-green-100 text-green-800"
    if (abs <= 2) return "bg-yellow-100 text-yellow-800"
    if (abs <= 5) return "bg-orange-100 text-orange-800"
    return "bg-red-100 text-red-800"
  }

  const getCacheStatusColor = (status: string) => {
    switch (status) {
      case "fresh":
        return "bg-green-100 text-green-800"
      case "expiring-soon":
        return "bg-yellow-100 text-yellow-800"
      case "stale":
        return "bg-orange-100 text-orange-800"
      case "missing":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Games Played Synchronization Diagnostics
          </CardTitle>
          <CardDescription>
            Analyze and fix discrepancies in games played counts across different data sources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <Button onClick={runDiagnostics} disabled={isRunning || !password}>
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                "Run Diagnostics"
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {diagnosticData && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">User Details</TabsTrigger>
            <TabsTrigger value="fixes">Quick Fixes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Users Analyzed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{diagnosticData.analysis.summary.totalUsers}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Users with Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {diagnosticData.analysis.summary.usersWithIssues}
                  </div>
                  <p className="text-xs text-muted-foreground">{diagnosticData.analysis.summary.issueRate} of total</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Discrepancies</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {diagnosticData.analysis.summary.usersWithDiscrepancies}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {diagnosticData.analysis.summary.discrepancyRate} of total
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Common Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {diagnosticData.analysis.commonIssues.map((issue, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm">{issue.issue}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{issue.count} users</Badge>
                        <Badge variant="outline">{issue.percentage}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Average Discrepancy</div>
                    <div className="text-lg font-semibold">
                      {diagnosticData.analysis.statistics.averageDiscrepancy.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Max Discrepancy</div>
                    <div className="text-lg font-semibold">{diagnosticData.analysis.statistics.maxDiscrepancy}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Discrepancy</div>
                    <div className="text-lg font-semibold">{diagnosticData.analysis.statistics.totalDiscrepancy}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>User-by-User Analysis</CardTitle>
                <CardDescription>
                  Detailed breakdown of games played counts across different data sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {diagnosticData.diagnosticResults
                      .filter((result) => result.issues.length > 0)
                      .map((result) => (
                        <div key={result.userId} className="border rounded-lg p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{result.username}</h4>
                              <p className="text-sm text-muted-foreground">ID: {result.userId}</p>
                            </div>
                            <Badge className={getSeverityColor(result.discrepancy)}>
                              {result.discrepancy > 0 ? "+" : ""}
                              {result.discrepancy}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <div className="text-muted-foreground">Game Tracking</div>
                              <div className="font-medium">{result.gameTrackingCount}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Leaderboard</div>
                              <div className="font-medium">{result.leaderboardCount}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">User Stats</div>
                              <div className="font-medium">{result.userStatsCount}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Cache Status</div>
                              <Badge className={getCacheStatusColor(result.cacheStatus)} variant="outline">
                                {result.cacheStatus}
                              </Badge>
                            </div>
                          </div>

                          {result.issues.length > 0 && (
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-red-600">Issues:</div>
                              {result.issues.map((issue, index) => (
                                <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                                  {issue}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fixes">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Automated Fixes</CardTitle>
                  <CardDescription>Run automated fixes to resolve synchronization issues</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => runFix("rebuild-all-stats")}
                    disabled={isFixing}
                    className="w-full"
                    variant="outline"
                  >
                    {isFixing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Rebuild All User Stats
                  </Button>

                  <Button
                    onClick={() => runFix("sync-leaderboard")}
                    disabled={isFixing}
                    className="w-full"
                    variant="outline"
                  >
                    {isFixing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Synchronize Leaderboard
                  </Button>

                  <Button
                    onClick={() => runFix("rebuild-caches")}
                    disabled={isFixing}
                    className="w-full"
                    variant="outline"
                  >
                    {isFixing ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Rebuild User Caches
                  </Button>
                </CardContent>
              </Card>

              {fixResults && (
                <Card>
                  <CardHeader>
                    <CardTitle>Fix Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {fixResults.map((result, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <div>
                              <div className="font-medium">{result.username}</div>
                              <div className="text-sm text-muted-foreground">
                                {result.beforeCount} → {result.afterCount}
                              </div>
                            </div>
                            {result.fixed ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
