"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  XCircle,
  Clock,
  Users,
  Target,
  TrendingUp,
  FileText,
  Wrench,
} from "lucide-react"

interface TestCase {
  id: string
  name: string
  description: string
  category: "data_integrity" | "synchronization" | "edge_cases" | "performance"
  status: "pending" | "running" | "passed" | "failed" | "warning"
  expectedResult?: any
  actualResult?: any
  error?: string
  executionTime?: number
  details?: Record<string, any>
}

interface VerificationResult {
  testSuite: string
  timestamp: string
  totalTests: number
  passed: number
  failed: number
  warnings: number
  executionTime: number
  testCases: TestCase[]
  summary: {
    dataIntegrityScore: number
    synchronizationAccuracy: number
    performanceMetrics: {
      averageQueryTime: number
      slowestQuery: number
      fastestQuery: number
    }
    discrepancies: Array<{
      userId: string
      playerName: string
      leaderboardCount: number
      actualCount: number
      difference: number
    }>
    recommendations: string[]
  }
}

export function GamesPlayedVerification({ adminPassword }: { adminPassword: string }) {
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  const runVerification = async () => {
    if (!password.trim()) {
      setError("Password is required")
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/admin/verify-games-played", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password, action: "verify" }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Verification failed")
      }

      setResult(data)
      setActiveTab("overview")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      passed: "default",
      warning: "secondary",
      failed: "destructive",
      running: "outline",
      pending: "outline",
    }

    return (
      <Badge variant={variants[status] || "outline"} className="ml-2">
        {status.toUpperCase()}
      </Badge>
    )
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "data_integrity":
        return <Target className="h-4 w-4" />
      case "synchronization":
        return <TrendingUp className="h-4 w-4" />
      case "edge_cases":
        return <AlertCircle className="h-4 w-4" />
      case "performance":
        return <Clock className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          Games Played Statistics Verification
        </CardTitle>
        <CardDescription>Verify the accuracy and consistency of games played counts across all systems</CardDescription>
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

        <Button onClick={runVerification} disabled={isLoading || !password.trim()} className="w-full">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Verification...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Start Verification
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
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="tests">Test Results</TabsTrigger>
                <TabsTrigger value="discrepancies">Discrepancies</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Data Integrity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{result.summary.dataIntegrityScore}%</div>
                      <Progress value={result.summary.dataIntegrityScore} className="mt-2" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Sync Accuracy
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{result.summary.synchronizationAccuracy}%</div>
                      <Progress value={result.summary.synchronizationAccuracy} className="mt-2" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Avg Query Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{result.summary.performanceMetrics.averageQueryTime}ms</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Range: {result.summary.performanceMetrics.fastestQuery}ms -{" "}
                        {result.summary.performanceMetrics.slowestQuery}ms
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Discrepancies
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{result.summary.discrepancies.length}</div>
                      <div className="text-xs text-muted-foreground mt-1">Issues found</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Test Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">{result.passed}</div>
                        <div className="text-xs text-muted-foreground">Passed</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">{result.warnings}</div>
                        <div className="text-xs text-muted-foreground">Warnings</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                        <div className="text-xs text-muted-foreground">Failed</div>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Total Tests: {result.totalTests}</span>
                      <span>Execution Time: {result.executionTime}ms</span>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tests" className="space-y-4">
                {result.testCases.map((test) => (
                  <Card key={test.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          {getCategoryIcon(test.category)}
                          {test.name}
                        </span>
                        {getStatusBadge(test.status)}
                      </CardTitle>
                      <CardDescription>{test.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          {getStatusIcon(test.status)}
                          Status
                        </span>
                        <span>Execution Time: {test.executionTime || 0}ms</span>
                      </div>

                      {test.error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{test.error}</AlertDescription>
                        </Alert>
                      )}

                      {test.actualResult && (
                        <div className="text-xs">
                          <strong>Results:</strong>
                          <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                            {JSON.stringify(test.actualResult, null, 2)}
                          </pre>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="discrepancies" className="space-y-4">
                {result.summary.discrepancies.length === 0 ? (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>No discrepancies found - all games played counts are accurate!</AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-2">
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Found {result.summary.discrepancies.length} discrepancies that need attention.
                      </AlertDescription>
                    </Alert>

                    {result.summary.discrepancies.map((discrepancy, index) => (
                      <Card key={index}>
                        <CardContent className="pt-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <strong>Player:</strong>
                              <div>{discrepancy.playerName}</div>
                            </div>
                            <div>
                              <strong>Leaderboard:</strong>
                              <div>{discrepancy.leaderboardCount}</div>
                            </div>
                            <div>
                              <strong>Actual:</strong>
                              <div>{discrepancy.actualCount}</div>
                            </div>
                            <div>
                              <strong>Difference:</strong>
                              <div className={discrepancy.difference > 0 ? "text-green-600" : "text-red-600"}>
                                {discrepancy.difference > 0 ? "+" : ""}
                                {discrepancy.difference}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-4">
                {result.summary.recommendations.map((recommendation, index) => (
                  <Alert key={index}>
                    <Wrench className="h-4 w-4" />
                    <AlertDescription>{recommendation}</AlertDescription>
                  </Alert>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
