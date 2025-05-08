"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, ChevronDown, ChevronUp, Clock, BarChart, Target, Calendar, Film, User } from "lucide-react"
import type { Difficulty, GameFilters, GameItem } from "@/lib/types"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import PlayerStats from "./player-stats"
import Image from "next/image"
import { getDailyChallenge } from "@/lib/daily-challenge"

interface StartScreenProps {
  onStart: (difficulty: Difficulty, filters: GameFilters) => void
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

  useEffect(() => {
    const loadDailyChallenge = async () => {
      try {
        const challenge = await getDailyChallenge()
        setDailyChallenge(challenge)
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

  // Format date for daily challenge
  const formatDate = () => {
    const today = new Date()
    return today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-center text-2xl">The Movie Game</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8 px-6">
        {/* Game Mode Info */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-medium">2-Minute Timed Mode</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            How many connections can you make in 2 minutes? Race against the clock!
          </p>
        </div>

        {/* Daily Challenge */}
        <div className="space-y-3 border-t border-b py-4">
          <div className="flex items-center justify-center gap-2">
            <Target className="h-5 w-5 text-red-500" />
            <h3 className="text-lg font-medium">Daily Challenge</h3>
          </div>

          <div className="flex items-center justify-center">
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
            <div className="flex flex-col items-center py-2">
              <div className="relative h-32 w-24 rounded-lg overflow-hidden shadow-md mb-2">
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
              <p className="text-sm font-medium">Today's Challenge:</p>
              <p className="text-sm font-bold mt-1">
                Find the {dailyChallenge.type} "{dailyChallenge.name}"
              </p>
              <p className="text-xs text-muted-foreground mt-1">Complete the challenge to earn bonus points</p>
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">
              No daily challenge available. Check back tomorrow!
            </p>
          )}
        </div>

        {/* Difficulty Selector */}
        <div className="space-y-3">
          <h3 className="text-center font-medium text-lg">Select Difficulty</h3>
          <div className="flex justify-center gap-4 flex-wrap">
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
        <div className="space-y-5">
          <h3 className="text-center font-medium text-lg">Movie Filters</h3>

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
              <p className="text-sm text-muted-foreground">Toggle to include or exclude movie sequels and franchises</p>
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

        {/* How to Play Dropdown - Using a simpler implementation */}
        <div className="w-full">
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
                  <strong>Daily Challenge:</strong> Try to find the daily challenge item in your games for bonus points!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* High Score */}
        {highScore > 0 && (
          <div className="text-center p-3 bg-muted rounded-md">
            <p>
              Your High Score: <span className="font-bold">{highScore}</span>
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between pt-2 pb-6">
        <Dialog open={statsOpen} onOpenChange={setStatsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <BarChart size={16} />
              <span>View Your Stats</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <PlayerStats />
          </DialogContent>
        </Dialog>

        <Button
          onClick={() => onStart(difficulty, filters)}
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
      </CardFooter>
    </Card>
  )
}
