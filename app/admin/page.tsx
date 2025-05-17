"use client"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Trophy, Users, Database, Trash2, AlertTriangle } from "lucide-react"
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

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isClearingLeaderboard, setIsClearingLeaderboard] = useState(false)
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

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Game
            </Button>
          </Link>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Admin Authentication</CardTitle>
            <CardDescription>Enter your admin password to access admin features</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="admin-password">Admin Password</Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
              />
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="leaderboard">
          <TabsList className="mb-4">
            <TabsTrigger value="leaderboard">
              <Trophy className="w-4 h-4 mr-2" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="monitoring">
              <Database className="w-4 h-4 mr-2" />
              Monitoring
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle>Leaderboard Management</CardTitle>
                <CardDescription>Tools for managing the game leaderboard</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="entry-count">Number of Fake Entries</Label>
                    <Input
                      id="entry-count"
                      type="number"
                      min={1}
                      max={100}
                      value={entryCount}
                      onChange={(e) => setEntryCount(Number.parseInt(e.target.value) || 20)}
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Danger Zone</h3>
                    <p className="text-sm text-gray-500 mb-4">These actions cannot be undone. Please be certain.</p>
                    <Button
                      variant="destructive"
                      onClick={() => setShowClearConfirmation(true)}
                      disabled={!password}
                      className="w-full sm:w-auto"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear Leaderboard
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-start space-y-4">
                <Button onClick={populateLeaderboard} disabled={isLoading || !password} className="w-full sm:w-auto">
                  <Trophy className="w-4 h-4 mr-2" />
                  {isLoading ? "Populating..." : "Populate Leaderboard with Fake Data"}
                </Button>

                {message && (
                  <div
                    className={`text-sm ${status === "success" ? "text-green-600" : status === "error" ? "text-red-600" : ""}`}
                  >
                    {message}
                  </div>
                )}
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage users and handle inappropriate usernames</CardDescription>
              </CardHeader>
              <CardContent>
                {password ? (
                  <UserManagement adminPassword={password} />
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    Please enter your admin password to access user management
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring">
            <Card>
              <CardHeader>
                <CardTitle>System Monitoring</CardTitle>
                <CardDescription>Monitor system performance and resource usage</CardDescription>
              </CardHeader>
              <CardContent>
                {password ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Redis Monitoring</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Monitor Redis usage statistics and performance metrics.
                      </p>
                      <Link href="/admin/redis-monitor">
                        <Button>
                          <Database className="w-4 h-4 mr-2" />
                          View Redis Monitor
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    Please enter your admin password to access monitoring tools
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation Dialog for Clearing Leaderboard */}
      <Dialog open={showClearConfirmation} onOpenChange={setShowClearConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Clear Leaderboard
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete all leaderboard entries.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500">
              Are you sure you want to clear the leaderboard? All player scores and rankings will be removed.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearConfirmation(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={clearLeaderboard} disabled={isClearingLeaderboard}>
              {isClearingLeaderboard ? "Clearing..." : "Yes, Clear Leaderboard"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
