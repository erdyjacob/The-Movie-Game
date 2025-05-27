"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, XCircle, AlertTriangle, Clock, Play, RefreshCw, FileText } from "lucide-react"

interface VerificationResult {
  testId: string
  testName: string
  status: "passed" | "failed" | "warning" | "running"
  executionTime: number
  details: string
  metrics?: {
    totalUsers: number
    discrepancies: number
    accuracy: number
  }
}

interface GamesPlayedVerificationProps {
  adminPassword: string
}

export function GamesPlayedVerification({ adminPassword }: GamesPlayedVerificationProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<VerificationResult[]>([])
  const [selectedUserId, setSelectedUserId] = useState("")

  const runVerification = async () => {
    if (!adminPassword) {
      alert("Please enter admin password first")
      return
    }

    setIsRunning(true)
    setProgress(0)
    setResults([])

    try {
      const response = await fetch("/api/admin/verify-games-played", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminPassword,
          userId: selectedUserId || undefined,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Simulate progress updates
      const testResults = data.results || []
      for (let i = 0; i < testResults.length; i++) {
        setProgress(((i + 1) / testResults.length) * 100)
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      setResults(testResults)
    } catch (error) {
      console.error("Verification failed:", error)
      setResults([
        {
          testId: "error",
          testName: "Verification Error",
          status: "failed",
          executionTime: 0,
          details: error instanceof Error ? error.message : "Unknown error occurred",
        },
      ])
    } finally {
      setIsRunning(false)
      setProgress(100)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-400" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-400" />
      case "running":
        return <Clock className="h-4 w-4 text-blue-400 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "passed":
        return <Badge className="bg-green-600 text-white">Passed</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      case "warning":
        return <Badge className="bg-yellow-600 text-white">Warning</Badge>
      case "running":
        return <Badge className="bg-blue-600 text-white">Running</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  const overallStats =
    results.length > 0
      ? {
          totalTests: results.length,
          passed: results.filter((r) => r.status === "passed").length,
          failed: results.filter((r) => r.status === "failed").length,
          warnings: results.filter((r) => r.status === "warning").length,
          avgExecutionTime: results.reduce((acc, r) => acc + r.executionTime, 0) / results.length,
        }
      : null

  return (
    <div className="space-y-6">
      <Card className="bg-gray-700 border-gray-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <CheckCircle className="h-5 w-5 text-green-400" />
            Games Played Statistics Verification
          </CardTitle>
          <CardDescription className="text-gray-400">
            Verify the accuracy and consistency of games played counts across all systems
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="user-id" className="text-gray-300">
                Specific User ID (Optional)
              </Label>
              <Input
                id="user-id"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                placeholder="Leave empty to verify all users"
                className="bg-gray-600 border-gray-500 text-white placeholder-gray-400"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={runVerification}
                disabled={isRunning || !adminPassword}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Running Verification...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Start Verification
                  </>
                )}
              </Button>
            </div>
          </div>

          {isRunning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Verification Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="bg-gray-600" />
            </div>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-700">
            <TabsTrigger
              value="overview"
              className="text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="results"
              className="text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Test Results
            </TabsTrigger>
            <TabsTrigger
              value="discrepancies"
              className="text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Discrepancies
            </TabsTrigger>
            <TabsTrigger
              value="recommendations"
              className="text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Recommendations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {overallStats && (
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-gray-700 border-gray-600">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="text-sm text-gray-400">Total Tests</p>
                        <p className="text-lg font-semibold text-white">{overallStats.totalTests}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-700 border-gray-600">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <div>
                        <p className="text-sm text-gray-400">Passed</p>
                        <p className="text-lg font-semibold text-white">{overallStats.passed}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-700 border-gray-600">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-400" />
                      <div>
                        <p className="text-sm text-gray-400">Failed</p>
                        <p className="text-lg font-semibold text-white">{overallStats.failed}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-gray-700 border-gray-600">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-400" />
                      <div>
                        <p className="text-sm text-gray-400">Avg Time</p>
                        <p className="text-lg font-semibold text-white">{overallStats.avgExecutionTime.toFixed(0)}ms</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            <div className="space-y-3">
              {results.map((result, index) => (
                <Card key={index} className="bg-gray-700 border-gray-600">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <h4 className="font-medium text-white">{result.testName}</h4>
                          <p className="text-sm text-gray-400">{result.details}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{result.executionTime}ms</span>
                        {getStatusBadge(result.status)}
                      </div>
                    </div>
                    {result.metrics && (
                      <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Users: </span>
                          <span className="text-white">{result.metrics.totalUsers}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Discrepancies: </span>
                          <span className="text-white">{result.metrics.discrepancies}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Accuracy: </span>
                          <span className="text-white">{result.metrics.accuracy.toFixed(1)}%</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="discrepancies" className="space-y-4">
            <Card className="bg-gray-700 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">Identified Discrepancies</CardTitle>
                <CardDescription className="text-gray-400">
                  Issues found during verification that require attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Discrepancy details will be displayed here when verification is complete.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <Card className="bg-gray-700 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">Recommendations</CardTitle>
                <CardDescription className="text-gray-400">
                  Suggested actions based on verification results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Recommendations will be provided based on the verification results.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
