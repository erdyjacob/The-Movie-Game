"use client"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Trophy,
  Users,
  Database,
  Trash2,
  AlertTriangle,
  RefreshCw,
  CheckCircle,
  TrendingUp,
  Shield,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserManagement } from "@/components/admin/user-management"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LeaderboardRepair } from "@/components/admin/leaderboard-repair"
import { UserDiagnostics } from "@/components/admin/user-diagnostics"
import { UserDataFix } from "@/components/admin/user-data-fix"
import { ScoreDiagnostics } from "@/components/admin/score-diagnostics"
import { UserScoreFix } from "@/components/admin/user-score-fix"
import { FixMissingScores } from "@/components/admin/fix-missing-scores"
import { ScoreSyncDiagnostics } from "@/components/admin/score-sync-diagnostics"
import { AchievementMigration } from "@/components/admin/achievement-migration"
import { TestingSuiteLayout } from "@/components/admin/testing-suite-layout"
import { GamesPlayedVerification } from "@/components/admin/games-played-verification"
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard"
import { SyncRefresh } from "@/components/admin/sync-refresh"

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isClearingLeaderboard, setIsClearingLeaderboard] = useState(false)
  const [isRefreshingLeaderboard, setIsRefreshingLeaderboard] = useState(false)
  const [message, setMessage] = useState("")
  const [password, setPassword] = useState("")
  const [entryCount, setEntryCount] = useState(20)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [showClearConfirmation, setShowClearConfirmation] = useState(false)

  const populateLeaderboard = async () => {
    if (!password) {
      setMessage("Please enter the admin password")
      setStatus("error")
      return
    }

    setIsLoading(true)
    setMessage("")
    setStatus("idle")

    try {
      const response = await fetch("/api/admin/populate-leaderboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password, count: entryCount }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`${data.message}`)
        setStatus("success")
      } else {
        setMessage(`Error: ${data.message}`)
        setStatus("error")
      }
    } catch (error) {
      setMessage("An unexpected error occurred")
      setStatus("error")
    } finally {
      setIsLoading(false)
    }
  }

  const clearLeaderboard = async () => {
    if (!password) {
      setMessage("Please enter the admin password")
      setStatus("error")
      return
    }

    setIsClearingLeaderboard(true)
    setMessage("")
    setStatus("idle")

    try {
      const response = await fetch("/api/admin/clear-leaderboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`${data.message}`)
        setStatus("success")
      } else {
        setMessage(`Error: ${data.message}`)
        setStatus("error")
      }
    } catch (error) {
      setMessage("An unexpected error occurred")
      setStatus("error")
    } finally {
      setIsClearingLeaderboard(false)
      setShowClearConfirmation(false)
    }
  }

  const refreshLeaderboard = async () => {
    if (!password) {
      setMessage("Please enter the admin password")
      setStatus("error")
      return
    }

    setIsRefreshingLeaderboard(true)
    setMessage("")
    setStatus("idle")

    try {
      const response = await fetch("/api/admin/refresh-leaderboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${password}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`${data.message}`)
        setStatus("success")
      } else {
        setMessage(`Error: ${data.message}`)
        setStatus("error")
      }
    } catch (error) {
      setMessage("An unexpected error occurred")
      setStatus("error")
    } finally {
      setIsRefreshingLeaderboard(false)
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-900 text-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Game
            </Button>
          </Link>
        </div>

        <Card className="mb-6 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Admin Authentication</CardTitle>
            <CardDescription className="text-gray-400">
              Enter your admin password to access admin features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-md">
              <Label htmlFor="admin-password" className="text-gray-300">
                Admin Password
              </Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="leaderboard" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 mb-6 bg-gray-800 border-gray-700">
            <TabsTrigger
              value="leaderboard"
              className="flex items-center gap-2 text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Leaderboard</span>
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="flex items-center gap-2 text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger
              value="scores"
              className="flex items-center gap-2 text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Scores</span>
            </TabsTrigger>
            <TabsTrigger
              value="monitoring"
              className="flex items-center gap-2 text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Monitoring</span>
            </TabsTrigger>
            <TabsTrigger
              value="achievements"
              className="flex items-center gap-2 text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Achievements</span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="flex items-center gap-2 text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger
              value="testing"
              className="flex items-center gap-2 text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <CheckCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Testing</span>
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded">New</span>
            </TabsTrigger>
            <TabsTrigger
              value="sync-refresh"
              className="flex items-center gap-2 text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Sync & Refresh</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Leaderboard Management</CardTitle>
                <CardDescription className="text-gray-400">Tools for managing the game leaderboard</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="entry-count" className="text-gray-300">
                      Number of Fake Entries
                    </Label>
                    <Input
                      id="entry-count"
                      type="number"
                      min={1}
                      max={100}
                      value={entryCount}
                      onChange={(e) => setEntryCount(Number.parseInt(e.target.value) || 20)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      onClick={populateLeaderboard}
                      disabled={isLoading || !password}
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Trophy className="w-4 h-4 mr-2" />
                      {isLoading ? "Populating..." : "Populate with Fake Data"}
                    </Button>

                    <Button
                      onClick={refreshLeaderboard}
                      disabled={isRefreshingLeaderboard || !password}
                      variant="outline"
                      className="w-full sm:w-auto border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshingLeaderboard ? "animate-spin" : ""}`} />
                      {isRefreshingLeaderboard ? "Refreshing..." : "Refresh Leaderboard"}
                    </Button>
                  </div>

                  <div className="pt-4 border-t border-gray-600">
                    <h3 className="text-sm font-medium text-white mb-2">Danger Zone</h3>
                    <p className="text-sm text-gray-400 mb-4">These actions cannot be undone. Please be certain.</p>
                    <Button
                      variant="destructive"
                      onClick={() => setShowClearConfirmation(true)}
                      disabled={!password}
                      className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear Leaderboard
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-start space-y-4">
                {message && (
                  <div
                    className={`text-sm ${
                      status === "success" ? "text-green-400" : status === "error" ? "text-red-400" : ""
                    }`}
                  >
                    {message}
                  </div>
                )}
              </CardFooter>
            </Card>

            <div className="grid gap-6 mt-6">
              <LeaderboardRepair adminToken={password} />
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">User Management</CardTitle>
                  <CardDescription className="text-gray-400">
                    Manage users and handle inappropriate usernames
                  </CardDescription>
                </div>
                {password && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                    onClick={() => {
                      const userManagementElement = document.getElementById("user-management")
                      if (userManagementElement) {
                        userManagementElement.dispatchEvent(new CustomEvent("refresh-users"))
                      }
                    }}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Users
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {password ? (
                  <>
                    <UserManagement adminPassword={password} id="user-management" />
                    <div className="grid gap-6 mt-6">
                      <UserDiagnostics adminToken={password} />
                      <UserDataFix adminToken={password} />
                      <FixMissingScores adminToken={password} />
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    Please enter your admin password to access user management
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scores">
            <div className="grid gap-6">
              <ScoreDiagnostics />
              <UserScoreFix />
              <ScoreSyncDiagnostics />
            </div>
          </TabsContent>

          <TabsContent value="monitoring">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">System Monitoring</CardTitle>
                <CardDescription className="text-gray-400">
                  Monitor system performance and resource usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                {password ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2 text-white">Redis Monitoring</h3>
                      <p className="text-sm text-gray-400 mb-4">
                        Monitor Redis usage statistics and performance metrics.
                      </p>
                      <Link href="/admin/redis-monitor">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                          <Database className="w-4 h-4 mr-2" />
                          View Redis Monitor
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    Please enter your admin password to access monitoring tools
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Achievement Migration</CardTitle>
                <CardDescription className="text-gray-400">
                  Migrate existing users to the new achievement system
                </CardDescription>
              </CardHeader>
              <CardContent>
                {password ? (
                  <AchievementMigration adminPassword={password} />
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    Please enter your admin password to access achievement migration
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Analytics Dashboard</CardTitle>
                <CardDescription className="text-gray-400">Comprehensive game analytics and insights</CardDescription>
              </CardHeader>
              <CardContent>
                {password ? (
                  <AnalyticsDashboard adminPassword={password} />
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    Please enter your admin password to access analytics
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testing" className="w-full">
            <TestingSuiteLayout adminPassword={password}>
              <GamesPlayedVerification adminPassword={password} />
            </TestingSuiteLayout>
          </TabsContent>

          <TabsContent value="sync-refresh">
            <SyncRefresh adminPassword={password} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation Dialog for Clearing Leaderboard */}
      <Dialog open={showClearConfirmation} onOpenChange={setShowClearConfirmation}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Clear Leaderboard
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              This action cannot be undone. This will permanently delete all leaderboard entries.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-400">
              Are you sure you want to clear the leaderboard? All player scores and rankings will be removed.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowClearConfirmation(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={clearLeaderboard}
              disabled={isClearingLeaderboard}
              className="bg-red-600 hover:bg-red-700"
            >
              {isClearingLeaderboard ? "Clearing..." : "Yes, Clear Leaderboard"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
