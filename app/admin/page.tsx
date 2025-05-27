"use client"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Trophy, Users, Database, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TestingSuiteLayout } from "@/components/admin/testing-suite-layout"
import { GamesPlayedVerification } from "@/components/admin/games-played-verification"

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isClearingLeaderboard, setIsClearingLeaderboard] = useState(false)
  const [isRefreshingLeaderboard, setIsRefreshingLeaderboard] = useState(false)
  const [message, setMessage] = useState("")
  const [password, setPassword] = useState("")
  const [entryCount, setEntryCount] = useState(20)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [showClearConfirmation, setShowClearConfirmation] = useState(false)

  // ... (keep all the existing functions: populateLeaderboard, clearLeaderboard, refreshLeaderboard)

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
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
            <div className="max-w-md">
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

        <Tabs defaultValue="leaderboard" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 mb-6">
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Leaderboard</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
            <TabsTrigger value="scores" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Scores</span>
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Monitoring</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Achievements</span>
            </TabsTrigger>
            <TabsTrigger value="testing" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Testing</span>
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded">New</span>
            </TabsTrigger>
          </TabsList>

          {/* Keep all existing TabsContent sections unchanged */}

          <TabsContent value="testing" className="w-full">
            <TestingSuiteLayout adminPassword={password}>
              <GamesPlayedVerification adminPassword={password} />
            </TestingSuiteLayout>
          </TabsContent>
        </Tabs>
      </div>

      {/* Keep the existing confirmation dialog */}
    </div>
  )
}
