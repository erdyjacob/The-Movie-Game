"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  Target,
  Calendar,
  Film,
  User,
  BarChart,
  X,
  Clock,
  AlertTriangle,
} from "lucide-react"
import type { Difficulty, GameFilters, GameItem } from "@/lib/types"
import PlayerStats from "./player-stats"
import Image from "next/image"
import { getDailyChallenge } from "@/lib/daily-challenge"
import Link from "next/link"

interface StartScreenProps {
  onStart: (difficulty: Difficulty, filters: GameFilters, gameMode: string) => void
  highScore: number
  loading?: boolean
}

export default function StartScreen({ onStart, highScore, loading = false }: StartScreenProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy")
  const [filters, setFilters] = useState<GameFilters>({
    includeAnimated: true,
    includeSequels: true,
    includeForeign: true,
  })
  const [howToPlayOpen, setHowToPlayOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [dailyChallenge, setDailyChallenge] = useState<GameItem | null>(null)
  const [dailyChallengeLoading, setDailyChallengeLoading] = useState(true)
  const [dailyChallengeAttempted, setDailyChallengeAttempted] = useState(false)

  useEffect(() => {
    const loadDailyChallenge = async () => {
      try {
        const challenge = await getDailyChallenge()
        setDailyChallenge(challenge)

        // Check if daily challenge has been attempted today
        const today = new Date().toISOString().split("T")[0]
        const attemptedDate = localStorage.getItem("dailyChallengeAttemptDate")
        setDailyChallengeAttempted(attemptedDate === today)
      } catch (error) {
        console.error("Failed to load daily challenge:", error)
      } finally {
        setDailyChallengeLoading(false)
      }
    }

    loadDailyChallenge()
  }, [])

  const handleFilterChange = (key: keyof GameFilters) => {
    setFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const toggleHowToPlay = () => {
    setHowToPlayOpen(!howToPlayOpen)
  }

  const openStats = () => {
    setStatsOpen(true)
  }

  const closeStats = () => {
    setStatsOpen(false)
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

    // Start game with daily challenge settings
    onStart(
      "easy",
      {
        includeAnimated: false,
        includeSequels: false,
        includeForeign: false,
      },
      "dailyChallenge",
    )

    setDailyChallengeAttempted(true)
  }

  // Start regular game mode
  const startRegularGame = () => {
    onStart(difficulty, filters, "timed")
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-center text-2xl">The Movie Game</CardTitle>

        {/* Move How to Play here */}
        <div className="w-full mt-4">
          <Button
            variant="ghost"
            className="flex w-full justify-between py-2 font-medium"
            onClick={toggleHowToPlay}
            type="button"
          >
            How to Play
            {howToPlayOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
          </Button>

          {howToPlayOpen && (
            <div className="px-4 pb-4 pt-1">
              <div className="text-sm space-y-3 bg-muted/30 p-3 rounded-md">
                <p>
                  The game starts with a movie. You name an actor from that movie, then a movie the actor was in. The
                  computer then continues by naming an actor from that movie and another movie they were in. This
                  continues until the 2-minute timer runs out. Try to make as many connections as possible!
                </p>
                <p>
                  <strong>Collect Rare Items:</strong> Discover and collect actors and movies of different rarities to
                  build your collection!
                </p>
                <p>
                  <strong>Daily Challenge:</strong> Try the special daily challenge mode - unlimited time, but only one
                  attempt per day!
                </p>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-8 px-6">
        {/* Redesigned Daily Challenge - Now a Game Mode */}
        <div className="border-t border-b py-4 bg-muted/20 rounded-lg">
          <div className="flex items-center justify-between mb-3 px-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-red-500" />
              <h3 className="text-lg font-medium">Daily Challenge</h3>
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatDate()}</span>
            </div>
          </div>

          {dailyChallengeLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : dailyChallenge ? (
            <div className="flex flex-col items-center px-4 py-2">
              <div className="flex items-center gap-6 max-w-md">
                <div className="relative h-40 w-28 flex-shrink-0 rounded-lg overflow-hidden shadow-md">
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
                        <Film size={28} className="text-muted-foreground" />
                      ) : (
                        <User size={28} className="text-muted-foreground" />
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
                <div className="flex-1">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <p className="font-medium text-sm">Unlimited Time</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <p className="font-medium text-sm">Three Strikes</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-green-500" />
                      <p className="font-medium text-sm">One Attempt Per Day</p>
                    </div>

                    <Button
                      onClick={startDailyChallenge}
                      disabled={dailyChallengeAttempted || loading}
                      className="w-full mt-2 bg-gradient-to-r from-red-500 to-amber-600 hover:from-red-600 hover:to-amber-700"
                    >
                      {dailyChallengeAttempted ? "Already Attempted Today" : "Start Daily Challenge"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-4">
              <p className="text-center text-sm text-muted-foreground">
                No daily challenge available. Check back tomorrow!
              </p>
            </div>
          )}
        </div>

        {/* Regular Game Mode Section */}
        <div className="border-t pt-4">
          {/* Difficulty Selector */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 w-full">
              <Button
                variant={difficulty === "easy" ? "default" : "outline"}
                onClick={() => setDifficulty("easy")}
                disabled={loading}
                size="lg"
              >
                Easy
              </Button>
              <Button
                variant={difficulty === "medium" ? "default" : "outline"}
                onClick={() => setDifficulty("medium")}
                disabled={loading}
                size="lg"
              >
                Medium
              </Button>
              <Button
                variant={difficulty === "hard" ? "default" : "outline"}
                onClick={() => setDifficulty("hard")}
                disabled={loading}
                size="lg"
              >
                Hard
              </Button>
            </div>
          </div>

          {/* Movie Filters */}
          <div className="space-y-5 mt-6">
            <h4 className="text-center font-medium">Movie Filters</h4>

            <div className="flex items-center justify-between py-1">
              <div className="space-y-0.5">
                <Label htmlFor="animated">Include Animated Movies</Label>
                <p className="text-sm text-muted-foreground">Toggle to include or exclude animated films</p>
              </div>
              <Switch
                id="animated"
                checked={filters.includeAnimated}
                onCheckedChange={() => handleFilterChange("includeAnimated")}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="space-y-0.5">
                <Label htmlFor="sequels">Include Movie Sequels</Label>
                <p className="text-sm text-muted-foreground">
                  Toggle to include or exclude movie sequels and franchises
                </p>
              </div>
              <Switch
                id="sequels"
                checked={filters.includeSequels}
                onCheckedChange={() => handleFilterChange("includeSequels")}
                disabled={loading}
              />
            </div>

            <div className="flex items-center justify-between py-1">
              <div className="space-y-0.5">
                <Label htmlFor="foreign">Include Foreign Films</Label>
                <p className="text-sm text-muted-foreground">Toggle to include or exclude non-English language films</p>
              </div>
              <Switch
                id="foreign"
                checked={filters.includeForeign}
                onCheckedChange={() => handleFilterChange("includeForeign")}
                disabled={loading}
              />
            </div>
          </div>

          {/* High Score */}
          {highScore > 0 && (
            <div className="text-center p-3 bg-muted rounded-md mt-6">
              <p>
                Your High Score: <span className="font-bold">{highScore}</span>
              </p>
            </div>
          )}

          {/* Start Regular Game Button */}
          <div className="flex justify-between items-center mt-6 gap-3">
            <Button variant="outline" className="flex items-center gap-2" onClick={openStats} size="lg">
              <BarChart size={16} />
              <span>View Your Stats</span>
            </Button>

            <Button
              onClick={startRegularGame}
              size="lg"
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                "Start Game"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col pt-2 pb-6">
        {/* Add survey link at the bottom */}
        <div className="w-full text-center mt-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Having fun?{" "}
            <Link href="https://forms.gle/ppmQ7XcoX6i4xUEz9" className="text-blue-500 hover:underline" target="_blank">
              Take our survey
            </Link>
          </p>
        </div>
      </CardFooter>

      {/* Add the stats dialog outside the main component structure */}
      {statsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={closeStats}>
          <div
            className="bg-background p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Your Stats</h2>
              <Button variant="ghost" size="sm" onClick={closeStats}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <PlayerStats />
          </div>
        </div>
      )}
    </Card>
  )
}
