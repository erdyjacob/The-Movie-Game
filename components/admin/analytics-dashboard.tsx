"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts"
import { Users, Trophy, TrendingUp, Clock, Gamepad2, RefreshCw, Filter } from "lucide-react"
import type { AnalyticsDashboardData, AnalyticsFilters } from "@/lib/analytics"
import type { GameMode, Difficulty } from "@/lib/types"

interface AnalyticsDashboardProps {
  adminPassword: string
}

export function AnalyticsDashboard({ adminPassword }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<AnalyticsFilters>({})
  const [showFilters, setShowFilters] = useState(false)

  // Form state for filters
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [playerIds, setPlayerIds] = useState("")
  const [gameMode, setGameMode] = useState<GameMode | "">("")
  const [difficulty, setDifficulty] = useState<Difficulty | "">("")

  const loadAnalytics = async (appliedFilters: AnalyticsFilters = {}) => {
    if (!adminPassword) {
      setError("Admin password required")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/analytics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: adminPassword,
          filters: appliedFilters,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setData(result.data)
      } else {
        setError(result.message || "Failed to load analytics")
      }
    } catch (err) {
      setError("An error occurred while loading analytics")
      console.error("Analytics loading error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    const newFilters: AnalyticsFilters = {}

    if (startDate) newFilters.startDate = new Date(startDate).getTime()
    if (endDate) newFilters.endDate = new Date(endDate).getTime()
    if (playerIds.trim()) {
      newFilters.playerIds = playerIds
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id)
    }
    if (gameMode) newFilters.gameMode = gameMode as GameMode
    if (difficulty) newFilters.difficulty = difficulty as Difficulty

    setFilters(newFilters)
    loadAnalytics(newFilters)
  }

  const clearFilters = () => {
    setStartDate("")
    setEndDate("")
    setPlayerIds("")
    setGameMode("")
    setDifficulty("")
    setFilters({})
    loadAnalytics({})
  }

  useEffect(() => {
    loadAnalytics()
  }, [adminPassword])

  if (!adminPassword) {
    return (
      <Card>
        <CardContent className="text-center py-6">
          <p className="text-muted-foreground">Please enter your admin password to access analytics</p>
        </CardContent>
      </Card>
    )
  }

  const chartConfig = {
    totalGames: {
      label: "Total Games",
      color: "hsl(var(--chart-1))",
    },
    uniquePlayers: {
      label: "Unique Players",
      color: "hsl(var(--chart-2))",
    },
    averageScore: {
      label: "Average Score",
      color: "hsl(var(--chart-3))",
    },
  }

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Comprehensive game participation insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm" onClick={() => loadAnalytics(filters)} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
            <CardDescription>Filter analytics data by date range, players, and game settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="player-ids">Player IDs (comma-separated)</Label>
                <Input
                  id="player-ids"
                  placeholder="user1, user2, user3"
                  value={playerIds}
                  onChange={(e) => setPlayerIds(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="game-mode">Game Mode</Label>
                <Select value={gameMode} onValueChange={setGameMode}>
                  <SelectTrigger>
                    <SelectValue placeholder="All modes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All modes</SelectItem>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="daily">Daily Challenge</SelectItem>
                    <SelectItem value="blitz">Blitz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue placeholder="All difficulties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All difficulties</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={applyFilters} disabled={isLoading}>
                Apply Filters
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading analytics data...</p>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-red-600">{error}</p>
            <Button variant="outline" onClick={() => loadAnalytics(filters)} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Analytics Content */}
      {data && !isLoading && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Games</CardTitle>
                <Gamepad2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overview.totalGames.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Players</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overview.totalPlayers.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Games/Player</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overview.averageGamesPerPlayer}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Score</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.overview.totalScore.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Analytics Tabs */}
          <Tabs defaultValue="trends" className="space-y-4">
            <TabsList>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="players">Players</TabsTrigger>
              <TabsTrigger value="peaks">Peak Times</TabsTrigger>
              <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
              <TabsTrigger value="recent">Recent Activity</TabsTrigger>
            </TabsList>

            {/* Trends Tab */}
            <TabsContent value="trends">
              <Card>
                <CardHeader>
                  <CardTitle>Game Participation Trends</CardTitle>
                  <CardDescription>Daily game participation over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.trends.length > 0 ? (
                    <ChartContainer config={chartConfig} className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.trends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="totalGames"
                            stroke="var(--color-totalGames)"
                            name="Total Games"
                          />
                          <Line
                            type="monotone"
                            dataKey="uniquePlayers"
                            stroke="var(--color-uniquePlayers)"
                            name="Unique Players"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">No trend data available</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Players Tab */}
            <TabsContent value="players">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Player Activity Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{data.playerActivity.totalPlayers}</div>
                        <div className="text-sm text-muted-foreground">Total Players</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{data.playerActivity.activePlayers}</div>
                        <div className="text-sm text-muted-foreground">Active (7 days)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{data.playerActivity.averageGamesPerPlayer}</div>
                        <div className="text-sm text-muted-foreground">Avg Games/Player</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{data.playerActivity.medianGamesPerPlayer}</div>
                        <div className="text-sm text-muted-foreground">Median Games/Player</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Players</CardTitle>
                    <CardDescription>Players with the most games played</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {data.playerActivity.topPlayers.map((player, index) => (
                        <div key={player.userId} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary">#{index + 1}</Badge>
                            <div>
                              <div className="font-medium">{player.username}</div>
                              <div className="text-sm text-muted-foreground">ID: {player.userId}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{player.totalGames} games</div>
                            <div className="text-sm text-muted-foreground">Avg: {player.averageScore}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Peak Times Tab */}
            <TabsContent value="peaks">
              <Card>
                <CardHeader>
                  <CardTitle>Peak Participation Periods</CardTitle>
                  <CardDescription>Times with highest game activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {data.peakPeriods.slice(0, 10).map((period, index) => (
                      <div
                        key={`${period.period}-${index}`}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{period.period}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{period.gamesCount} games</div>
                          <div className="text-sm text-muted-foreground">{period.playersCount} players</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Breakdown Tab */}
            <TabsContent value="breakdown">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Game Mode Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.gameModeBreakdown.length > 0 ? (
                      <ChartContainer config={chartConfig} className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={data.gameModeBreakdown}
                              dataKey="totalGames"
                              nameKey="mode"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              label={({ mode, percentage }) => `${mode}: ${percentage}%`}
                            >
                              {data.gameModeBreakdown.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <ChartTooltip content={<ChartTooltipContent />} />
                          </PieChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">No game mode data available</div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Difficulty Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {data.difficultyBreakdown.length > 0 ? (
                      <ChartContainer config={chartConfig} className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={data.difficultyBreakdown}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="difficulty" />
                            <YAxis />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar dataKey="totalGames" fill="var(--color-totalGames)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">No difficulty data available</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Recent Activity Tab */}
            <TabsContent value="recent">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Game Activity</CardTitle>
                  <CardDescription>Latest 20 games played</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.recentActivity.map((game) => (
                      <div key={game.gameId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="font-medium">{game.username}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(game.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">Score: {game.score}</div>
                          <div className="text-sm text-muted-foreground">
                            {game.gameMode} • {game.difficulty}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
