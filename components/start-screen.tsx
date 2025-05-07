"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, ChevronDown, ChevronUp } from "lucide-react"
import type { Difficulty, GameFilters } from "@/lib/types"

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

  const handleFilterChange = (key: keyof GameFilters) => {
    setFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const toggleHowToPlay = () => {
    setHowToPlayOpen(!howToPlayOpen)
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-center text-2xl">The Movie Game</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8 px-6">
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
                  continues until you get 3 strikes or can't continue. Try to build the longest chain possible!
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
      <CardFooter className="flex justify-center gap-4 pt-2 pb-6">
        <Button onClick={() => onStart(difficulty, filters)} size="lg" disabled={loading}>
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
