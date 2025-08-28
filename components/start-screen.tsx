"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Loader2, Target, Calendar, Film, User, BarChart, Network } from "lucide-react"
import type { Difficulty, GameFilters, GameItem, LeaderboardEntry } from "@/lib/types"
import PlayerStats from "./player-stats"
import Image from "next/image"
import { getDailyChallenge } from "@/lib/daily-challenge"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import ConnectionWebButton from "./connection-web-button"
import { LeaderboardTable } from "./leaderboard-table"
import ResetBanner from "./reset-banner"

// Custom animated button component
const AnimatedButton = ({
  children,
  onClick,
  variant = "default",
  size = "default",
  className,
  disabled = false,
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  disabled?: boolean
}) => {
  return (
    <Button
      onClick={onClick}
      variant={variant}
      size={size}
      disabled={disabled}
      className={cn(
        "transition-all duration-200",
        "hover:shadow-sm hover:brightness-105",
        "active:brightness-95",
        "focus:ring-2 focus:ring-offset-1 focus:ring-primary/40",
        className,
      )}
    >
      {children}
    </Button>
  )
}

interface StartScreenProps {
  onStart: (difficulty: Difficulty, filters: GameFilters, gameMode: string, dailyChallengeItem?: GameItem) => void
  highScore: number
  loading?: boolean
}

export default function StartScreen({ onStart, highScore, loading = false }: StartScreenProps) {
  const isMobile = useMobile()
  const [difficulty, setDifficulty] = useState<Difficulty>("easy")
  const [filters, setFilters] = useState<GameFilters>({
    includeAnimated: true,
    includeSequels: true,
    includeForeign: false,
  })
  const [gameModifiersOpen, setGameModifiersOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [dailyChallenge, setDailyChallenge] = useState<GameItem | null>(null)
  const [dailyChallengeLoading, setDailyChallengeLoading] = useState(true)
  const [dailyChallengeAttempted, setDailyChallengeAttempted] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([])
  const [leaderboardLoading, setLeaderboardLoading] = useState(true)
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLeaderboardLoading(true)
        setLeaderboardError(null)

        const response = await fetch("/api/leaderboard/top")
        if (!response.ok) {
          throw new Error("Failed to fetch leaderboard")
        }

        const data = await response.json()

        // Ensure all entries have gamesPlayed field for backward compatibility
        const processedData = data.map((entry: LeaderboardEntry) => ({
          ...entry,
          gamesPlayed: entry.gamesPlayed || 0,
        }))

        setLeaderboardData(processedData.slice(0, 5)) // Show top 5 for preview
      } catch (error) {
        console.error("Error fetching leaderboard:", error)
        setLeaderboardError("Failed to load leaderboard")
      } finally {
        setLeaderboardLoading(false)
      }
    }

    const loadDailyChallenge = async () => {
      try {
        setDailyChallengeLoading(true)

        // Use a specific cache key for today's date to ensure consistency
        const today = new Date().toISOString().split("T")[0]
        const cacheKey = `dailyChallenge_${today}`

        // Check if we already have the challenge in localStorage
        const cachedChallenge = localStorage.getItem(cacheKey)

        if (cachedChallenge) {
          // Use cached challenge if available
          setDailyChallenge(JSON.parse(cachedChallenge))
          console.log("Using cached daily challenge in start screen")
        } else {
          // Otherwise fetch a new one
          console.log("Fetching new daily challenge in start screen")
          const challenge = await getDailyChallenge()

          // Cache the challenge with today's date as key
          localStorage.setItem(cacheKey, JSON.stringify(challenge))
          setDailyChallenge(challenge)
        }

        // Check if daily challenge has been attempted today
        const attemptedDate = localStorage.getItem("dailyChallengeAttemptDate")
        setDailyChallengeAttempted(attemptedDate === today)
      } catch (error) {
        console.error("Failed to load daily challenge:", error)
        // Set a fallback challenge in case of error
        const fallbackChallenge = {
          id: 0,
          name: "Daily Challenge",
          image: null,
          type: "movie",
          details: {},
          rarity: "rare",
          isDailyChallenge: true,
        }
        setDailyChallenge(fallbackChallenge)
      } finally {
        setDailyChallengeLoading(false)
      }
    }

    loadDailyChallenge()
    fetchLeaderboard()
  }, [])

  const toggleGameModifiers = () => {
    setGameModifiersOpen(!gameModifiersOpen)
  }

  const openStats = () => {
    setStatsOpen(true)
  }

  const closeStats = () => {
    setStatsOpen(false)
  }

  const handleFilterChange = (key: keyof GameFilters) => {
    setFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const formatDate = () => {
    return new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  const startDailyChallenge = () => {
    const today = new Date().toISOString().split("T")[0]
    localStorage.setItem("dailyChallengeAttemptDate", today)
    onStart(
      "easy",
      { includeAnimated: true, includeSequels: true, includeForeign: false },
      "dailyChallenge",
      dailyChallenge,
    )
    setDailyChallengeAttempted(true)
  }

  const startRegularGame = () => {
    onStart(difficulty, filters, "timed")
  }

  const openConnectionWeb = () => {
    window.location.href = "/connection-web"
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ResetBanner />

      <header className="text-center py-4">
        <div className="w-80 h-20 relative mx-auto">
          <Image src="/images/TheMovieGame.svg" alt="The Movie Game" fill className="object-contain" priority />
        </div>
      </header>

      <main className="max-w-[90rem] mx-auto w-full px-4 flex-1">
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 min-h-96" aria-label="Game sections">
          {/* Daily Challenge Card */}
          <Card className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-red-500" aria-hidden="true" />
                  <h2 className="text-lg font-medium">Daily Challenge</h2>
                </div>
                <time className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  <span>{formatDate()}</span>
                </time>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
              {dailyChallengeLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2
                    className="h-10 w-10 animate-spin text-muted-foreground"
                    aria-label="Loading daily challenge"
                  />
                </div>
              ) : dailyChallenge ? (
                <div className="flex flex-col items-center gap-4 w-full max-w-md">
                  <div
                    className="relative h-40 w-28 rounded-xl overflow-hidden shadow-lg border-2 border-red-500"
                    style={{ boxShadow: "0 0 15px rgba(239, 68, 68, 0.6)" }}
                  >
                    {dailyChallenge.image ? (
                      <Image
                        src={dailyChallenge.image || "/placeholder.svg"}
                        alt={`${dailyChallenge.name} poster`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center">
                        {dailyChallenge.type === "movie" ? (
                          <Film size={32} className="text-muted-foreground" aria-hidden="true" />
                        ) : (
                          <User size={32} className="text-muted-foreground" aria-hidden="true" />
                        )}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-transparent to-transparent" />
                  </div>

                  <div className="text-center space-y-3 w-full">
                    <h3 className="font-bold text-lg">{dailyChallenge.name}</h3>
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" aria-hidden="true" />3 strikes
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" aria-hidden="true" />1 attempt per day
                        </span>
                      </div>
                      <AnimatedButton
                        onClick={startDailyChallenge}
                        disabled={dailyChallengeAttempted || loading}
                        className="w-full bg-gradient-to-r from-red-500 to-amber-600 hover:from-red-600 hover:to-amber-700 text-white"
                      >
                        {dailyChallengeAttempted ? "Already Attempted Today" : "Start Daily Challenge"}
                      </AnimatedButton>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">
                  No daily challenge available. Check back tomorrow!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Leaderboard Card */}
          <Card className="flex flex-col">
            <CardHeader>
              <h2 className="text-lg font-medium">Leaderboard</h2>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              {leaderboardLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading leaderboard" />
                </div>
              ) : leaderboardError ? (
                <div className="text-center py-8 text-muted-foreground">{leaderboardError}</div>
              ) : (
                <>
                  <LeaderboardTable data={leaderboardData} />
                  {leaderboardData.length > 0 && (
                    <div className="mt-4 text-center">
                      <a href="/leaderboard" className="text-sm text-primary hover:underline">
                        View Full Leaderboard →
                      </a>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </section>

        {highScore > 0 && (
          <section className="text-center p-4 bg-muted rounded-lg mb-6" aria-label="High score">
            <p className="text-base">
              Your High Score: <span className="font-bold">{highScore}</span>
            </p>
          </section>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6" aria-label="Game actions">
          <AnimatedButton
            variant="outline"
            size="lg"
            onClick={openStats}
            className="flex items-center justify-center gap-2 h-14"
          >
            <BarChart size={18} aria-hidden="true" />
            <span>View Stats</span>
          </AnimatedButton>

          <AnimatedButton
            variant="outline"
            size="lg"
            onClick={openConnectionWeb}
            className="flex items-center justify-center gap-2 h-14"
          >
            <Network size={18} aria-hidden="true" />
            <span>Connection Web</span>
          </AnimatedButton>

          <AnimatedButton
            size="lg"
            disabled={loading}
            onClick={startRegularGame}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white flex items-center justify-center gap-2 h-14"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                <span>Loading...</span>
              </>
            ) : (
              <span>Play Game</span>
            )}
          </AnimatedButton>
        </section>
      </main>

      {/* Hidden connection web button */}
      <div className="hidden">
        <ConnectionWebButton />
      </div>

      {statsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={closeStats}
          role="dialog"
          aria-modal="true"
          aria-labelledby="stats-title"
        >
          <div
            className="bg-background p-3 sm:p-6 rounded-lg w-[95vw] sm:w-full sm:max-w-4xl max-h-[80vh] sm:max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <PlayerStats onClose={closeStats} mode="full" />
          </div>
        </div>
      )}
    </div>
  )
}
