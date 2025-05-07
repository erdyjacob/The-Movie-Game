"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { GameItem, ItemType, GameFilters, Difficulty } from "@/lib/types"
import { searchMoviesByActor, searchActorsByMovie } from "@/lib/tmdb-api"
import { Loader2, Film, User, Info, AlertTriangle } from "lucide-react"
import LiveGamePath from "./live-game-path"
import { toast } from "@/components/ui/use-toast"
import Image from "next/image"
import { TooltipProvider } from "@/components/ui/tooltip"

// Function to calculate string similarity (Levenshtein distance)
function stringSimilarity(s1: string, s2: string): number {
  s1 = s1.toLowerCase()
  s2 = s2.toLowerCase()

  const costs: number[] = []
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j
      } else if (j > 0) {
        let newValue = costs[j - 1]
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
        }
        costs[j - 1] = lastValue
        lastValue = newValue
      }
    }
    if (i > 0) {
      costs[s2.length] = lastValue
    }
  }

  // Return a similarity score between 0 and 1
  const maxLength = Math.max(s1.length, s2.length)
  if (maxLength === 0) return 1.0 // Both strings are empty

  return 1.0 - costs[s2.length] / maxLength
}

// Function to find the best match
function findBestMatch(
  input: string,
  options: Array<{ id: number; name: string }>,
): { id: number; name: string; similarity: number } | null {
  if (!options.length) return null

  let bestMatch = null
  let highestSimilarity = 0

  for (const option of options) {
    const similarity = stringSimilarity(input, option.name)
    if (similarity > highestSimilarity) {
      highestSimilarity = similarity
      bestMatch = { ...option, similarity }
    }
  }

  // Return the best match if it's similar enough (threshold: 0.8)
  return bestMatch && bestMatch.similarity >= 0.8 ? bestMatch : null
}

// Update the props interface to include difficulty
interface GameScreenProps {
  currentItem: GameItem
  score: number
  highScore: number
  onCorrectAnswer: (newItem: GameItem) => void
  onIncorrectAnswer: () => void
  onGameOver: () => void
  isComputerTurn: boolean
  history: GameItem[]
  usedIds: Set<number>
  filters: GameFilters
  strikes: number
  turnPhase: string
  difficulty: Difficulty
}

export default function GameScreen({
  currentItem,
  score,
  highScore,
  onCorrectAnswer,
  onIncorrectAnswer,
  onGameOver,
  isComputerTurn,
  history,
  usedIds,
  filters,
  strikes,
  turnPhase,
  difficulty,
}: GameScreenProps) {
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [playerUsedItems, setPlayerUsedItems] = useState<Set<string>>(new Set())

  // Determine what type of item the player needs to find based on the turn phase
  // This ensures we're asking for the right type based on the current item
  const expectedType: ItemType =
    turnPhase === "player-pick-actor"
      ? "actor"
      : turnPhase === "player-pick-movie"
        ? "movie"
        : currentItem.type === "movie"
          ? "actor"
          : "movie"

  // Reset player used items when the game resets
  useEffect(() => {
    if (history.length <= 1) {
      setPlayerUsedItems(new Set())
    }
  }, [history.length])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!search.trim() || isComputerTurn) return

    setLoading(true)
    setError(null)

    // Check if the player has already used this answer
    const normalizedSearch = search.toLowerCase().trim()
    if (playerUsedItems.has(normalizedSearch)) {
      setError(`You've already used "${search}" in this game!`)
      onIncorrectAnswer()
      setLoading(false)

      toast({
        title: "Duplicate Answer",
        description: "You can't use the same answer twice in one game!",
        variant: "destructive",
      })

      return
    }

    try {
      if (expectedType === "actor") {
        // Verify that the current item is a movie before searching for actors
        if (currentItem.type !== "movie") {
          setError("System error: Expected a movie to search for actors")
          setLoading(false)
          return
        }

        // User needs to enter an actor from the current movie
        const actors = await searchActorsByMovie(currentItem.id)

        // Filter out already used actors
        const availableActors = actors.filter((actor) => !usedIds.has(actor.id))

        if (availableActors.length === 0) {
          setError("There are no more unused actors for this movie!")
          setLoading(false)
          return
        }

        // Try exact match first
        const exactMatch = availableActors.find((actor) => actor.name.toLowerCase() === search.toLowerCase())

        // If no exact match, try fuzzy matching
        const bestMatch = exactMatch || findBestMatch(search, availableActors)

        if (bestMatch) {
          const matchedActor =
            typeof bestMatch === "object" && "id" in bestMatch ? actors.find((a) => a.id === bestMatch.id) : bestMatch

          // Add this answer to the player's used items
          setPlayerUsedItems((prev) => new Set(prev).add(normalizedSearch))

          onCorrectAnswer({
            id: matchedActor.id,
            name: matchedActor.name,
            image: matchedActor.profile_path ? `https://image.tmdb.org/t/p/w500${matchedActor.profile_path}` : null,
            type: "actor",
            details: matchedActor,
          })
          setSearch("")
        } else {
          setError(`${search} is not an actor in ${currentItem.name}`)
          onIncorrectAnswer()
        }
      } else {
        // Verify that the current item is an actor before searching for movies
        if (currentItem.type !== "actor") {
          setError("System error: Expected an actor to search for movies")
          setLoading(false)
          return
        }

        // User needs to enter a movie the current actor was in
        const movies = await searchMoviesByActor(currentItem.id, filters)

        // Filter out already used movies
        const availableMovies = movies.filter((movie) => !usedIds.has(movie.id))

        if (availableMovies.length === 0) {
          setError("There are no more unused movies for this actor!")
          setLoading(false)
          return
        }

        // Try exact match first
        const exactMatch = availableMovies.find((movie) => movie.title.toLowerCase() === search.toLowerCase())

        // If no exact match, try fuzzy matching
        const bestMatch =
          exactMatch ||
          findBestMatch(
            search,
            availableMovies.map((m) => ({ id: m.id, name: m.title })),
          )

        if (bestMatch) {
          const matchedMovie =
            typeof bestMatch === "object" && "id" in bestMatch ? movies.find((m) => m.id === bestMatch.id) : bestMatch

          // Add this answer to the player's used items
          setPlayerUsedItems((prev) => new Set(prev).add(normalizedSearch))

          onCorrectAnswer({
            id: matchedMovie.id,
            name: matchedMovie.title,
            image: matchedMovie.poster_path ? `https://image.tmdb.org/t/p/w500${matchedMovie.poster_path}` : null,
            type: "movie",
            details: matchedMovie,
          })
          setSearch("")
        } else {
          setError(`${search} is not a movie that ${currentItem.name} appeared in`)
          onIncorrectAnswer()
        }
      }
    } catch (error) {
      console.error("Error validating answer:", error)
      setError("Failed to validate your answer. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleGiveUp = () => {
    onGameOver()
  }

  // Get the appropriate instruction text based on the turn phase and current item
  const getInstructionText = () => {
    if (turnPhase === "player-pick-actor" && currentItem.type === "movie") {
      return "Name an actor who appears in this movie:"
    } else if (turnPhase === "player-pick-movie" && currentItem.type === "actor") {
      return "Name a movie this actor appears in:"
    }
    return ""
  }

  // Determine if we should show images based on difficulty
  const showImages = difficulty === "easy"

  return (
    <TooltipProvider>
      <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-center">
            Score: {score} {score > highScore && "(New High Score!)"}
          </CardTitle>
          <div className="flex justify-center items-center gap-2 mt-3">
            <span className="text-sm text-muted-foreground">Strikes:</span>
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full ${i < strikes ? "bg-destructive" : "bg-muted"}`}
                  aria-label={i < strikes ? "Strike" : "No strike"}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground ml-1">({3 - strikes} remaining)</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 px-6">
          {isComputerTurn ? (
            <div className="text-center p-6">
              <Loader2 size={24} className="animate-spin mx-auto mb-3" />
              <p>Computer is thinking...</p>
            </div>
          ) : (
            <>
              <div className="text-center mb-5">
                <p>{getInstructionText()}</p>
              </div>

              <div className="flex flex-col items-center justify-center gap-4">
                {showImages && currentItem.image ? (
                  <div className="relative h-40 w-28 overflow-hidden rounded-lg shadow-md">
                    <Image
                      src={currentItem.image || "/placeholder.svg"}
                      alt={currentItem.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-40 w-28 rounded-lg bg-muted flex items-center justify-center">
                    {currentItem.type === "movie" ? (
                      <Film size={36} className="text-muted-foreground" />
                    ) : (
                      <User size={36} className="text-muted-foreground" />
                    )}
                  </div>
                )}
                <h3 className="text-xl font-semibold">{currentItem.name}</h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3 mt-2">
                <Input
                  type="text"
                  placeholder={`Enter ${expectedType === "actor" ? "an actor" : "a movie"}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  disabled={loading || isComputerTurn}
                  className="text-center py-5 text-lg"
                />

                <div className="flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Info size={12} />
                    <span>Enter the name - spelling doesn't have to be perfect</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertTriangle size={12} />
                    <span>Using the same answer twice will count as a strike!</span>
                  </div>
                </div>

                {error && <p className="text-destructive text-center text-sm mt-2">{error}</p>}

                <div className="flex justify-center gap-4 mt-5">
                  <Button type="submit" disabled={loading || isComputerTurn} size="lg">
                    {loading ? (
                      <>
                        <Loader2 size={18} className="mr-2 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      "Submit"
                    )}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleGiveUp} size="lg">
                    Give Up
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* Add the live game path visualization */}
          {history.length > 1 && (
            <div className="mt-8 pt-5 border-t">
              <LiveGamePath history={history} difficulty={difficulty} />
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
