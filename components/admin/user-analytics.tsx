"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertTriangle, Info, BarChart, Clock, Award, Zap } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface UserAnalyticsProps {
  adminToken: string
  userId: string
  username: string
}

export function UserAnalyticsDisplay({ adminToken, userId, username }: UserAnalyticsProps) {
  const [analytics, setAnalytics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/user-analytics?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setAnalytics(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchAnalytics()
    }
  }, [userId])

  // Format a number to 2 decimal places
  const formatNumber = (num: number) => {
    return Number(num).toFixed(2)
  }

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    if (!seconds) return "00:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          User Analytics: {username}
          <Button onClick={fetchAnalytics} disabled={isLoading} variant="default" size="sm">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Refresh Analytics
          </Button>
        </CardTitle>
        <CardDescription>Enhanced player statistics and behavior analysis</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {analytics && !isLoading && (
          <div className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Analytics Overview</AlertTitle>
              <AlertDescription>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                  <div>
                    <strong>Total Games:</strong> {analytics.totalGamesAnalyzed}
                  </div>
                  <div>
                    <strong>Total Sessions:</strong> {analytics.totalSessions}
                  </div>
                  <div>
                    <strong>Last Updated:</strong> {new Date(analytics.lastCalculated).toLocaleString()}
                  </div>
                  <div>
                    <strong>Connection Style:</strong>{" "}
                    <Badge variant={analytics.connectionStyle === "deep" ? "default" : "outline"}>
                      {analytics.connectionStyle === "deep" ? "Deep Explorer" : "Broad Explorer"}
                    </Badge>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <Tabs defaultValue="collection">
              <TabsList className="grid grid-cols-2 sm:grid-cols-4 mb-4">
                <TabsTrigger value="collection">
                  <Award className="h-4 w-4 mr-2" />
                  Collection
                </TabsTrigger>
                <TabsTrigger value="engagement">
                  <Clock className="h-4 w-4 mr-2" />
                  Engagement
                </TabsTrigger>
                <TabsTrigger value="speed">
                  <Zap className="h-4 w-4 mr-2" />
                  Speed
                </TabsTrigger>
                <TabsTrigger value="skill">
                  <BarChart className="h-4 w-4 mr-2" />
                  Skill
                </TabsTrigger>
              </TabsList>

              <TabsContent value="collection" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Collection Stats</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-muted/50 p-3 rounded-md">
                        <div className="text-sm text-muted-foreground">Collection Velocity</div>
                        <div className="text-2xl font-bold">{analytics.collectionVelocity}</div>
                        <div className="text-xs text-muted-foreground">new items/week</div>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-md">
                        <div className="text-sm text-muted-foreground">Rarity Luck</div>
                        <div className="text-2xl font-bold">{formatNumber(analytics.rarityLuck)}x</div>
                        <div className="text-xs text-muted-foreground">vs expected</div>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-md">
                        <div className="text-sm text-muted-foreground">Completion Rate</div>
                        <div className="text-2xl font-bold">{Math.round(analytics.completionRate * 100)}%</div>
                        <div className="text-xs text-muted-foreground">games finished</div>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-md">
                        <div className="text-sm text-muted-foreground">Rediscovery Rate</div>
                        <div className="text-2xl font-bold">{Math.round(analytics.rediscoveryRate * 100)}%</div>
                        <div className="text-xs text-muted-foreground">items reused</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Rarity Discovery</h3>
                    <div className="space-y-2">
                      {Object.entries(analytics.rarityDiscoveryRate).map(([rarity, rate]) => (
                        <div key={rarity} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{rarity}</span>
                            <span>{formatNumber(rate as number)} per game</span>
                          </div>
                          <Progress value={(rate as number) * 100} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Favorite Decades</h3>
                    <div className="flex flex-wrap gap-2">
                      {analytics.favoriteDecades.length > 0 ? (
                        analytics.favoriteDecades.map((decade: string) => (
                          <Badge key={decade} variant="secondary">
                            {decade}
                          </Badge>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground">No data available</div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Favorite Genres</h3>
                    <div className="flex flex-wrap gap-2">
                      {analytics.favoriteGenres.length > 0 ? (
                        analytics.favoriteGenres.map((genre: string) => (
                          <Badge key={genre} variant="secondary">
                            {genre.replace("genre_", "")}
                          </Badge>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground">No data available</div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="engagement" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Session Stats</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-muted/50 p-3 rounded-md">
                        <div className="text-sm text-muted-foreground">Avg Session Length</div>
                        <div className="text-2xl font-bold">{formatNumber(analytics.averageSessionLength)}</div>
                        <div className="text-xs text-muted-foreground">minutes</div>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-md">
                        <div className="text-sm text-muted-foreground">Binge Sessions</div>
                        <div className="text-2xl font-bold">{analytics.bingeSessions}</div>
                        <div className="text-xs text-muted-foreground">3+ games</div>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-md">
                        <div className="text-sm text-muted-foreground">Peak Play Time</div>
                        <div className="text-2xl font-bold">{analytics.peakPlayTime}:00</div>
                        <div className="text-xs text-muted-foreground">hour of day</div>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-md">
                        <div className="text-sm text-muted-foreground">Weekend Warrior</div>
                        <div className="text-2xl font-bold">{analytics.weekendWarrior ? "Yes" : "No"}</div>
                        <div className="text-xs text-muted-foreground">
                          {analytics.weekendWarrior ? "weekend player" : "weekday player"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Play Pattern</h3>
                    <div className="bg-muted/50 p-4 rounded-md h-[150px] flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-2">
                          Play pattern visualization would go here
                        </div>
                        <div className="text-xs text-muted-foreground">(Data collection in progress)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="speed" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Speed Metrics</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-muted/50 p-3 rounded-md">
                        <div className="text-sm text-muted-foreground">Best Items/Min</div>
                        <div className="text-2xl font-bold">{formatNumber(analytics.bestItemsPerMinute)}</div>
                        <div className="text-xs text-muted-foreground">items per minute</div>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-md">
                        <div className="text-sm text-muted-foreground">Time Utilization</div>
                        <div className="text-2xl font-bold">{Math.round(analytics.averageTimeUtilization * 100)}%</div>
                        <div className="text-xs text-muted-foreground">of available time</div>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-md">
                        <div className="text-sm text-muted-foreground">Fastest Game</div>
                        <div className="text-2xl font-bold">{formatTime(analytics.fastestGameDuration)}</div>
                        <div className="text-xs text-muted-foreground">mm:ss</div>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-md">
                        <div className="text-sm text-muted-foreground">Longest Chain</div>
                        <div className="text-2xl font-bold">{analytics.longestGameItems}</div>
                        <div className="text-xs text-muted-foreground">items</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Connection Speed</h3>
                    <div className="bg-muted/50 p-3 rounded-md">
                      <div className="text-sm text-muted-foreground">Avg Time Per Connection</div>
                      <div className="text-2xl font-bold">{formatTime(analytics.averageConnectionTime)}</div>
                      <div className="text-xs text-muted-foreground">seconds per move</div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="skill" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Skill Progression</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-muted/50 p-3 rounded-md">
                        <div className="text-sm text-muted-foreground">Improvement Rate</div>
                        <div className="text-2xl font-bold">
                          {(analytics.improvementRate > 0 ? "+" : "") + Math.round(analytics.improvementRate * 100)}%
                        </div>
                        <div className="text-xs text-muted-foreground">last 10 games</div>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-md">
                        <div className="text-sm text-muted-foreground">Consistency</div>
                        <div className="text-2xl font-bold">{Math.round(analytics.consistencyScore)}</div>
                        <div className="text-xs text-muted-foreground">score deviation</div>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-md">
                        <div className="text-sm text-muted-foreground">Personal Best Streak</div>
                        <div className="text-2xl font-bold">{analytics.personalBestStreak}</div>
                        <div className="text-xs text-muted-foreground">games since PB</div>
                      </div>
                      <div className="bg-muted/50 p-3 rounded-md">
                        <div className="text-sm text-muted-foreground">Perfect Games</div>
                        <div className="text-2xl font-bold">{analytics.perfectGames}</div>
                        <div className="text-xs text-muted-foreground">no mistakes</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Achievement Stats</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-muted/50 p-3 rounded-md">
                        <div className="text-sm text-muted-foreground">Comeback Games</div>
                        <div className="text-2xl font-bold">{analytics.comebackGames}</div>
                        <div className="text-xs text-muted-foreground">recovered from 2+ strikes</div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {!analytics && !isLoading && !error && (
          <div className="text-center py-8 text-muted-foreground">No analytics data available for this user yet.</div>
        )}
      </CardContent>
    </Card>
  )
}
