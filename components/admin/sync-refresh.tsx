"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Database,
  Users,
  Trophy,
  GamepadIcon,
  Award,
  Trash2,
  Shield,
} from "lucide-react"
import { nanoid } from "nanoid"

interface SyncProgress {
  operation: string
  status: "pending" | "running" | "completed" | "failed"
  progress: number
  message: string
  details?: any
  startTime?: number
  endTime?: number
  error?: string
}

interface SyncResult {
  success: boolean
  totalOperations: number
  completedOperations: number
  failedOperations: number
  operations: SyncProgress[]
  totalDuration: number
  summary: {
    usersProcessed: number
    scoresUpdated: number
    gamesPlayedSynced: number
    leaderboardUpdated: number
    achievementsSynced: number
    cachesCleaned: number
    errorsFound: number
    errorsFixed: number
  }
}

interface SyncRefreshProps {
  adminPassword: string
}

const operationIcons = {
  user_data_validation: Users,
  score_recalculation: Trophy,
  games_played_sync: GamepadIcon,
  leaderboard_refresh: Trophy,
  achievement_sync: Award,
  cache_cleanup: Trash2,
  data_integrity_check: Shield,
}

const operationLabels = {
  user_data_validation: "User Data Validation",
  score_recalculation: "Score Recalculation",
  games_played_sync: "Games Played Sync",
  leaderboard_refresh: "Leaderboard Refresh",
  achievement_sync: "Achievement Sync",
  cache_cleanup: "Cache Cleanup",
  data_integrity_check: "Data Integrity Check",
}

export function SyncRefresh({ adminPassword }: SyncRefreshProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [progress, setProgress] = useState<SyncProgress[]>([])
  const [result, setResult] = useState<SyncResult | null>(null)
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")

  // Poll for progress updates
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && sessionId) {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/admin/sync-refresh?sessionId=${sessionId}`)
          if (response.ok) {
            const data = await response.json()
            setProgress(data.progress || [])
          }
        } catch (error) {
          console.error("Error polling progress:", error)
        }
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, sessionId])

  const startSyncRefresh = async () => {
    if (!adminPassword) {
      setMessage("Admin password is required")
      setStatus("error")
      return
    }

    const newSessionId = nanoid()
    setSessionId(newSessionId)
    setIsRunning(true)
    setShowProgress(true)
    setProgress([])
    setResult(null)
    setMessage("")
    setStatus("idle")

    try {
      const response = await fetch("/api/admin/sync-refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminPassword}`,
        },
        body: JSON.stringify({ sessionId: newSessionId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Sync refresh failed")
      }

      const syncResult = await response.json()
      setResult(syncResult)

      if (syncResult.success) {
        setMessage("Sync & Refresh completed successfully!")
        setStatus("success")
      } else {
        setMessage(`Sync & Refresh completed with ${syncResult.failedOperations} failed operations`)
        setStatus("error")
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "An unexpected error occurred")
      setStatus("error")
    } finally {
      setIsRunning(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "running":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "running":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  const overallProgress =
    progress.length > 0 ? Math.round(progress.reduce((sum, op) => sum + op.progress, 0) / progress.length) : 0

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Database className="h-5 w-5" />
            Sync & Refresh
          </CardTitle>
          <CardDescription className="text-gray-400">
            Comprehensive data synchronization and integrity maintenance tool
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-white">What this tool does:</h4>
              <ul className="space-y-1 text-gray-300">
                <li>• Validates and repairs user data</li>
                <li>• Recalculates all user scores</li>
                <li>• Synchronizes games played counts</li>
                <li>• Refreshes leaderboard data</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-white">Additional operations:</h4>
              <ul className="space-y-1 text-gray-300">
                <li>• Syncs achievement data</li>
                <li>• Cleans up stale caches</li>
                <li>• Performs data integrity checks</li>
                <li>• Fixes data inconsistencies</li>
              </ul>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-gray-600">
            <Button
              onClick={startSyncRefresh}
              disabled={isRunning || !adminPassword}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Running Sync & Refresh...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Start Sync & Refresh
                </>
              )}
            </Button>

            {result && (
              <div className="flex items-center gap-2 text-sm">
                <Badge variant={result.success ? "default" : "destructive"}>
                  {result.success ? "Success" : "Partial Failure"}
                </Badge>
                <span className="text-gray-400">
                  {result.completedOperations}/{result.totalOperations} operations completed
                </span>
                <span className="text-gray-400">({formatDuration(result.totalDuration)})</span>
              </div>
            )}
          </div>

          {message && (
            <div
              className={`text-sm p-3 rounded ${
                status === "success"
                  ? "bg-green-100 text-green-800"
                  : status === "error"
                    ? "bg-red-100 text-red-800"
                    : ""
              }`}
            >
              {message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Dialog */}
      <Dialog open={showProgress} onOpenChange={setShowProgress}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Sync & Refresh Progress
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {isRunning ? "Synchronization in progress..." : "Synchronization completed"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-gray-400">{overallProgress}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>

            {/* Individual Operations */}
            <div className="space-y-4">
              <h4 className="font-medium">Operations</h4>
              <div className="grid gap-3">
                {progress.map((operation) => {
                  const Icon = operationIcons[operation.operation as keyof typeof operationIcons] || Database
                  return (
                    <Card key={operation.operation} className="bg-gray-700 border-gray-600">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span className="font-medium">
                              {operationLabels[operation.operation as keyof typeof operationLabels] ||
                                operation.operation}
                            </span>
                            {getStatusIcon(operation.status)}
                          </div>
                          <Badge className={getStatusColor(operation.status)}>{operation.status}</Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-300">{operation.message}</span>
                            <span className="text-gray-400">{operation.progress}%</span>
                          </div>
                          <Progress value={operation.progress} className="h-1" />

                          {operation.error && (
                            <div className="flex items-start gap-2 p-2 bg-red-900/20 border border-red-800 rounded text-red-300 text-sm">
                              <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span>{operation.error}</span>
                            </div>
                          )}

                          {operation.details && (
                            <div className="text-xs text-gray-400 bg-gray-800 p-2 rounded">
                              {JSON.stringify(operation.details, null, 2)}
                            </div>
                          )}

                          {operation.startTime && operation.endTime && (
                            <div className="text-xs text-gray-400">
                              Duration: {formatDuration(operation.endTime - operation.startTime)}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Summary Results */}
            {result && (
              <div className="space-y-4">
                <h4 className="font-medium">Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-2xl font-bold text-blue-400">{result.summary.usersProcessed}</div>
                    <div className="text-sm text-gray-400">Users Processed</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-2xl font-bold text-green-400">{result.summary.scoresUpdated}</div>
                    <div className="text-sm text-gray-400">Scores Updated</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-2xl font-bold text-purple-400">{result.summary.gamesPlayedSynced}</div>
                    <div className="text-sm text-gray-400">Games Synced</div>
                  </div>
                  <div className="bg-gray-700 p-3 rounded">
                    <div className="text-2xl font-bold text-yellow-400">{result.summary.errorsFixed}</div>
                    <div className="text-sm text-gray-400">Errors Fixed</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
