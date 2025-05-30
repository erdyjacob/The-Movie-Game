"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Loader2, ChevronDown, ChevronUp, Target, Calendar, Film, User, BarChart, Network } from "lucide-react"
import type { Difficulty, GameFilters, GameItem } from "@/lib/types"
import PlayerStats from "./player-stats"
import Image from "next/image"
import { getDailyChallenge } from "@/lib/daily-challenge"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import ConnectionWebButton from "./connection-web-button"
import { LeaderboardPreview } from "./leaderboard-preview"
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
  const [howToPlayOpen, setHowToPlayOpen] = useState(false)
  const [gameModifiersOpen, setGameModifiersOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [dailyChallenge, setDailyChallenge] = useState<GameItem | null>(null)
  const [dailyChallengeLoading, setDailyChallengeLoading] = useState(true)
  const [dailyChallengeAttempted, setDailyChallengeAttempted] = useState(false)
  const [logoError, setLogoError] = useState(false)

  useEffect(() => {
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
  }, [])

  const toggleHowToPlay = () => {
    setHowToPlayOpen(!howToPlayOpen)
  }

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

  // Format date for daily challenge
  const formatDate = () => {
    const today = new Date()
    return today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  }

  // Start daily challenge mode
  const startDailyChallenge = () => {
    // Set today's date as the attempt date
    const today = new Date().toISOString().split("T")[0]
    localStorage.setItem("dailyChallengeAttemptDate", today)

    // Start game with daily challenge settings and pass the daily challenge item
    onStart(
      "easy",
      {
        includeAnimated: true,
        includeSequels: true,
        includeForeign: false,
      },
      "dailyChallenge",
      dailyChallenge, // Pass the daily challenge item
    )

    setDailyChallengeAttempted(true)
  }

  // Start regular game mode
  const startRegularGame = () => {
    onStart(difficulty, filters, "timed")
  }

  // Replace the openConnectionWeb function with this direct navigation approach
  const openConnectionWeb = () => {
    // Navigate directly to the connection web page
    window.location.href = "/connection-web"
  }

  return (
    <>
      {/* Reset Banner */}
      <ResetBanner />

      {/* Header/Hero Section */}
      <div className="text-center mb-10">
        {/* SVG Logo instead of text title - exact copy from game-container.tsx */}
        <div className="w-80 h-20 relative mx-auto mb-3">
          <Image src="/images/TheMovieGame.svg" alt="The Movie Game" fill className="object-contain" priority />
        </div>
        <p className="text-muted-foreground">Name an actor from the movie or a movie the actor was in!</p>
      </div>
      <Card className="w-full">
        <CardHeader className="pt-2 sm:pt-4 pb-2 sm:pb-4">
          {/* How to Play dropdown */}
          <div className="w-full">
            <Button
              variant="ghost"
              className="flex w-full justify-between py-1 sm:py-2 font-medium text-sm sm:text-base"
              onClick={toggleHowToPlay}
              type="button"
            >
              How to Play
              {howToPlayOpen ? (
                <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>

            {howToPlayOpen && (
              <div className="px-2 sm:px-4 pb-2 sm:pb-4 pt-1">
                <div className="text-xs sm:text-sm space-y-2 sm:space-y-3 bg-muted/30 p-2 sm:p-3 rounded-md">
                  <p>
                    The game starts with a movie. You name an actor from that movie, then a movie the actor was in. The
                    computer then continues by naming an actor from that movie and another movie they were in. This
                    continues until the 2-minute timer runs out!
                  </p>
                  <p>
                    <strong>Collect Rare Pulls:</strong> Discover and collect actors and movies of different rarities to
                    build your collection.
                  </p>
                  <p>
                    <strong>Daily Challenge:</strong> Try the special daily challenge mode - 100 turns maximum, 3
                    strikes, unlimited time, but only one attempt per day.
                  </p>
                  <p>
                    <strong>Leaderboard:</strong> As you play, your collection score increases with each new discovery.
                    The global leaderboard ranks players based on their collection score. Rare items and daily challenge
                    completions add more points to your score. Set a username to appear on the leaderboard!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Game Modifiers dropdown removed - code preserved for future implementation */}
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-8 px-3 sm:px-6">
          {/* Redesigned Daily Challenge - Now a Game Mode */}
          <div className="border-t border-b py-3 sm:py-4 bg-muted/20 rounded-lg">
            <div className="flex items-center justify-between mb-2 sm:mb-3 px-2 sm:px-4">
              <div className="flex items-center gap-1 sm:gap-2">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                <h3 className="text-base sm:text-lg font-medium">Daily Challenge</h3>
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>{formatDate()}</span>
              </div>
            </div>

            {dailyChallengeLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-muted-foreground" />
              </div>
            ) : dailyChallenge ? (
              <div className="flex flex-col items-center px-2 sm:px-4 py-2">
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 max-w-md">
                  <div className="relative h-32 w-24 sm:h-40 sm:w-28 flex-shrink-0 rounded-lg overflow-hidden shadow-md">
                    {dailyChallenge.image ? (
                      <Image
                        src={dailyChallenge.image || "/placeholder.svg"}
                        alt="Daily Challenge"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-muted flex items-center justify-center">
                        {dailyChallenge.type === "movie" ? (
                          <Film size={24} className="text-muted-foreground" />
                        ) : (
                          <User size={24} className="text-muted-foreground" />
                        )}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <div className="bg-red-600 text-white text-xs py-0.5 px-2 rounded-full inline-flex items-center">
                        <Target className="h-3 w-3 mr-1" />
                        <span>Daily Target</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <div className="space-y-2 sm:space-y-3">
                      <h4 className="font-medium text-sm sm:text-base">{dailyChallenge.name}</h4>

                      <p className="text-xs sm:text-sm text-muted-foreground">3 strikes, 1 attempt per day</p>

                      <AnimatedButton
                        onClick={startDailyChallenge}
                        disabled={dailyChallengeAttempted || loading}
                        className="w-full mt-1 sm:mt-2 bg-gradient-to-r from-red-500 to-amber-600 hover:from-red-600 hover:to-amber-700 text-white"
                        size={isMobile ? "sm" : "default"}
                      >
                        {dailyChallengeAttempted ? "Already Attempted Today" : "Start Daily Challenge"}
                      </AnimatedButton>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-4">
                <p className="text-center text-xs sm:text-sm text-muted-foreground">
                  No daily challenge available. Check back tomorrow!
                </p>
              </div>
            )}
          </div>

          {/* Leaderboard Preview Section */}
          <div className="border-t pt-4">
            <LeaderboardPreview />
          </div>

          {/* Regular Game Mode Section */}
          <div className="border-t pt-3 sm:pt-4">
            <div className="space-y-4">
              {/* High Score */}
              {highScore > 0 && (
                <div className="text-center p-2 sm:p-3 bg-muted rounded-md">
                  <p className="text-sm sm:text-base">
                    Your High Score: <span className="font-bold">{highScore}</span>
                  </p>
                </div>
              )}

              {/* Updated button layout to match game over screen exactly */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                {/* View Stats Button */}
                <AnimatedButton
                  variant="outline"
                  size="lg"
                  onClick={openStats}
                  className="flex items-center justify-center gap-2 h-12"
                >
                  <BarChart size={16} />
                  <span>View Stats</span>
                </AnimatedButton>

                {/* Connection Web Button */}
                <AnimatedButton
                  variant="outline"
                  size="lg"
                  onClick={openConnectionWeb}
                  className="flex items-center justify-center gap-2 h-12"
                >
                  <Network size={16} />
                  <span>Connection Web</span>
                </AnimatedButton>

                {/* Start Game Button */}
                <AnimatedButton
                  size="lg"
                  disabled={loading}
                  onClick={startRegularGame}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white flex items-center justify-center gap-2 h-12"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <span>Play Game</span>
                  )}
                </AnimatedButton>

                {/* Hidden connection web button that will be triggered programmatically */}
                <div className="hidden">
                  <ConnectionWebButton />
                </div>
              </div>
            </div>
          </div>
        </CardContent>

        {/* Add the stats dialog outside the main component structure */}
        {statsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={closeStats}>
            <div
              className="bg-background p-3 sm:p-6 rounded-lg w-[95vw] sm:w-full sm:max-w-4xl max-h-[80vh] sm:max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <PlayerStats onClose={closeStats} mode="full" />
            </div>
          </div>
        )}
      </Card>
    </>
  )
}
