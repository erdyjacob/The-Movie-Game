"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { GameItem, ItemType, GameFilters, Difficulty, GameMode } from "@/lib/types"
import { searchMoviesByActor, searchActorsByMovie } from "@/lib/tmdb-api"
import { Film, User, Info, AlertTriangle, Clock, Target } from "lucide-react"
import LiveGamePath from "./live-game-path"
import { toast } from "@/components/ui/use-toast"
import Image from "next/image"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"

// Import the PopcornLoader at the top of the file
import { PopcornLoader } from "./popcorn-loader"
import { Loader2 } from "lucide-react"

// Custom animated button component
const AnimatedButton = ({
  children,
  onClick,
  variant = "default",
  size = "default",
  className,
  disabled = false,
  type = "button",
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  disabled?: boolean
  type?: "button" | "submit" | "reset"
}) => {
  return (
    <Button
      onClick={onClick}
      variant={variant}
      size={size}
      disabled={disabled}
      type={type}
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

// Format time function
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

// Update the props interface to include daily challenge information
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
  gameMode: GameMode
  timeRemaining?: number
  dailyChallenge?: GameItem | null
  dailyChallengeCompleted?: boolean
}

// Memoize the GameScreen component to prevent unnecessary re-renders
const GameScreen = memo(function GameScreen({
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
  gameMode,
  timeRemaining,
  dailyChallenge,
  dailyChallengeCompleted,
}: GameScreenProps) {
  const isMobile = useMobile()
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [playerUsedItems, setPlayerUsedItems] = useState<Set<string>>(new Set())
  const [suggestions, setSuggestions] = useState<Array<{ id: number; name: string; image: string | null }>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [availableOptions, setAvailableOptions] = useState<Array<any>>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const optionsLoadedRef = useRef<boolean>(false)

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

  // Flag to determine if suggestions should be enabled (for easy and medium difficulty)
  const suggestionsEnabled = difficulty === "easy" || difficulty === "medium"

  // Minimum characters required before showing suggestions
  const minCharsForSuggestions = difficulty === "medium" ? 3 : 2

  // Reset player used items when the game resets
  useEffect(() => {
    if (history.length <= 1) {
      setPlayerUsedItems(new Set())
      optionsLoadedRef.current = false
    }
  }, [history.length])

  // Load available options when the current item changes
  useEffect(() => {
    const loadOptions = async () => {
      if (isComputerTurn || optionsLoadedRef.current) return

      // Only load options for suggestions if on easy or medium difficulty
      if (suggestionsEnabled || !optionsLoadedRef.current) {
        try {
          setLoading(true)
          let options: any[] = []

          if (expectedType === "actor" && currentItem.type === "movie") {
            const actors = await searchActorsByMovie(currentItem.id)
            options = actors.filter((actor) => !usedIds.has(actor.id))
          } else if (expectedType === "movie" && currentItem.type === "actor") {
            const movies = await searchMoviesByActor(currentItem.id, filters)
            options = movies.filter((movie) => !usedIds.has(movie.id))
          }

          setAvailableOptions(options)
          optionsLoadedRef.current = true
        } catch (error) {
          console.error("Error loading options:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    loadOptions()
  }, [currentItem, expectedType, filters, isComputerTurn, usedIds, suggestionsEnabled])

  // Update suggestions when search changes
  useEffect(() => {
    // Skip if suggestions are not enabled
    if (!suggestionsEnabled) return

    if (!search.trim() || search.length < minCharsForSuggestions) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const searchLower = search.toLowerCase()

    // Filter available options based on search
    const filteredOptions = availableOptions
      .filter((item) => {
        const name = expectedType === "actor" ? item.name : item.title
        return name.toLowerCase().includes(searchLower)
      })
      .slice(0, 5) // Limit to 5 suggestions
      .map((item) => ({
        id: item.id,
        name: expectedType === "actor" ? item.name : item.title,
        image:
          expectedType === "actor"
            ? item.profile_path
              ? `https://image.tmdb.org/t/p/w500${item.profile_path}`
              : null
            : item.poster_path
              ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
              : null,
      }))

    setSuggestions(filteredOptions)
    setShowSuggestions(filteredOptions.length > 0)
  }, [search, availableOptions, expectedType, suggestionsEnabled, minCharsForSuggestions])

  // Close suggestions when clicking outside
  useEffect(() => {
    // Skip if suggestions are not enabled
    if (!suggestionsEnabled) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [suggestionsEnabled])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
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
          description: "You can't use the same answer twice in one game.",
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
            setError("No more actors available for this movie!")
            setLoading(false)

            // Show a toast with more helpful information
            toast({
              title: "No More Actors Available",
              description:
                "All actors for this movie have been used or don't meet the game criteria. Try using the 'Give Up' button to end this game.",
              variant: "destructive",
            })

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
            optionsLoadedRef.current = false
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

            // Show a toast with more helpful information
            toast({
              title: "No More Movies Available",
              description:
                "All movies for this actor have been used or don't meet the game criteria. Try using the 'Give Up' button to end this game.",
              variant: "destructive",
            })

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
            optionsLoadedRef.current = false
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
    },
    [
      search,
      isComputerTurn,
      expectedType,
      currentItem,
      usedIds,
      filters,
      onCorrectAnswer,
      onIncorrectAnswer,
      playerUsedItems,
    ],
  )

  const handleSuggestionClick = useCallback(
    (suggestion: { id: number; name: string; image: string | null }) => {
      // Find the full item details from availableOptions
      const fullItem = availableOptions.find((item) => item.id === suggestion.id)

      if (!fullItem) return

      // Create the game item
      const gameItem: GameItem = {
        id: suggestion.id,
        name: suggestion.name,
        image: suggestion.image,
        type: expectedType,
        details: fullItem,
      }

      // Add this answer to the player's used items
      setPlayerUsedItems((prev) => new Set(prev).add(suggestion.name.toLowerCase().trim()))

      // Submit the answer
      onCorrectAnswer(gameItem)

      // Reset the search and hide suggestions
      setSearch("")
      setShowSuggestions(false)
      optionsLoadedRef.current = false
    },
    [availableOptions, expectedType, onCorrectAnswer],
  )

  const handleGiveUp = useCallback(() => {
    onGameOver()
  }, [onGameOver])

  // Get the appropriate instruction text based on the turn phase and current item
  const getInstructionText = useCallback(() => {
    if (turnPhase === "player-pick-actor" && currentItem.type === "movie") {
      return "Name an actor who appears in this movie:"
    } else if (turnPhase === "player-pick-movie" && currentItem.type === "actor") {
      return "Name a movie this actor appears in:"
    }
    return ""
  }, [turnPhase, currentItem.type])

  // Determine if we should show images based on difficulty
  const showImages = difficulty === "easy" || difficulty === "medium"

  // Calculate progress percentage for timed mode
  const timeProgress = timeRemaining !== undefined ? (timeRemaining / 120) * 100 : 100

  // Logo dimensions - matching the start page
  const logoWidth = 200
  const logoHeight = 100
  const logoSrc = "/images/TheMovieGame.svg"

  return (
    <Card className="w-full">
      <CardHeader className="pb-2 sm:pb-4">
        {/* Add the logo at the top of the card */}
        <div className="flex justify-center mb-4">
          <Image
            src={logoSrc || "/placeholder.svg"}
            alt="The Movie Game Logo"
            width={logoWidth}
            height={logoHeight}
            priority
            className="h-auto"
          />
        </div>

        <CardTitle className="text-center text-lg sm:text-xl">
          Score: {score} {score > highScore && "(New High Score!)"}
        </CardTitle>

        {/* Show timer for timed mode */}
        {gameMode === "timed" && timeRemaining !== undefined && (
          <div className="mt-2 sm:mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs sm:text-sm font-medium flex items-center">
                <Clock size={isMobile ? 12 : 14} className="mr-1" /> Time Remaining: {formatTime(timeRemaining)}
              </span>
            </div>
            <Progress value={timeProgress} className="h-1.5 sm:h-2" />
          </div>
        )}

        {/* Show strikes for classic and daily challenge modes */}
        {(gameMode === "classic" || gameMode === "dailyChallenge") && (
          <div className="flex justify-center items-center gap-1 sm:gap-2 mt-2 sm:mt-3">
            <span className="text-xs sm:text-sm text-muted-foreground">Strikes:</span>
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${i < strikes ? "bg-destructive" : "bg-muted"}`}
                  aria-label={i < strikes ? "Strike" : "No strike"}
                />
              ))}
            </div>
            <span className="text-xs sm:text-sm text-muted-foreground ml-1">({3 - strikes} remaining)</span>
          </div>
        )}

        {/* Daily Challenge Indicator */}
        {gameMode === "dailyChallenge" && dailyChallenge && (
          <div className="mt-2 sm:mt-3 flex justify-center">
            <div
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium ${
                dailyChallengeCompleted
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
              }`}
            >
              <Target size={isMobile ? 10 : 12} />
              <span>
                {dailyChallengeCompleted
                  ? "Daily Challenge Completed! 🎉"
                  : `Target: Find ${dailyChallenge.type === "movie" ? "movie" : "actor"} "${dailyChallenge.name}"`}
              </span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
        {isComputerTurn ? (
          <div className="text-center p-4 sm:p-6">
            <PopcornLoader size={isMobile ? "sm" : "md"} />
            <p className="text-sm sm:text-base mt-2 text-muted-foreground">Computer is thinking...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-3 sm:mb-5">
              <p className="text-sm sm:text-base">{getInstructionText()}</p>
            </div>

            <div className="flex flex-col items-center justify-center gap-3 sm:gap-4">
              {showImages && currentItem.image ? (
                <div className="relative h-32 w-24 sm:h-40 sm:w-28 overflow-hidden rounded-lg shadow-md">
                  <Image
                    src={currentItem.image || "/placeholder.svg"}
                    alt={currentItem.name}
                    fill
                    className={cn(
                      "object-cover",
                      // Apply blur filter for medium difficulty
                      difficulty === "medium" && "filter blur-[2px]",
                    )}
                    loading="eager"
                    priority
                  />
                </div>
              ) : (
                <div className="h-32 w-24 sm:h-40 sm:w-28 rounded-lg bg-muted flex items-center justify-center">
                  {currentItem.type === "movie" ? (
                    <Film size={isMobile ? 28 : 36} className="text-muted-foreground" />
                  ) : (
                    <User size={isMobile ? 28 : 36} className="text-muted-foreground" />
                  )}
                </div>
              )}
              <h3 className="text-base sm:text-xl font-semibold">{currentItem.name}</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3 mt-1 sm:mt-2">
              <div className="relative">
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder={`Enter ${expectedType === "actor" ? "an actor" : "a movie"}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  disabled={loading || isComputerTurn}
                  className="text-center py-3 sm:py-5 text-base sm:text-lg"
                  onFocus={() => {
                    if (suggestionsEnabled && suggestions.length > 0) {
                      setShowSuggestions(true)
                    }
                  }}
                />

                {/* Suggestions dropdown - only shown for easy and medium difficulty */}
                {suggestionsEnabled && showSuggestions && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg max-h-48 sm:max-h-60 overflow-auto"
                  >
                    {suggestions.map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="flex items-center gap-2 sm:gap-3 p-2 hover:bg-muted cursor-pointer"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <div className="relative h-8 w-8 sm:h-10 sm:w-10 overflow-hidden rounded">
                          {suggestion.image ? (
                            <Image
                              src={suggestion.image || "/placeholder.svg"}
                              alt={suggestion.name}
                              fill
                              className={cn(
                                "object-cover",
                                // Apply blur filter for medium difficulty
                                difficulty === "medium" && "filter blur-[2px]",
                              )}
                            />
                          ) : (
                            <div className="h-full w-full bg-muted flex items-center justify-center">
                              {expectedType === "movie" ? (
                                <Film size={isMobile ? 12 : 16} className="text-muted-foreground" />
                              ) : (
                                <User size={isMobile ? 12 : 16} className="text-muted-foreground" />
                              )}
                            </div>
                          )}
                        </div>
                        <span className="text-sm sm:text-base truncate">{suggestion.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center justify-center gap-1 sm:gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Info size={10} className="hidden sm:inline" />
                  <span>Enter the name - spelling doesn't have to be perfect</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertTriangle size={10} className="hidden sm:inline" />
                  <span>Using the same answer twice will count as a strike!</span>
                </div>
              </div>

              {error && <p className="text-destructive text-center text-xs sm:text-sm mt-1 sm:mt-2">{error}</p>}

              <div className="flex justify-center gap-2 sm:gap-4 mt-3 sm:mt-5">
                <AnimatedButton type="submit" disabled={loading || isComputerTurn} size={isMobile ? "sm" : "lg"}>
                  {loading ? (
                    <>
                      <Loader2 size={isMobile ? 14 : 18} className="mr-1 sm:mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    "Submit"
                  )}
                </AnimatedButton>
                <AnimatedButton variant="outline" onClick={handleGiveUp} size={isMobile ? "sm" : "lg"}>
                  Give Up
                </AnimatedButton>
              </div>
            </form>
          </>
        )}

        {/* Add the live game path visualization */}
        {history.length > 1 && (
          <div className="mt-4 sm:mt-8 pt-3 sm:pt-5 border-t">
            <LiveGamePath history={history} difficulty={difficulty} />
          </div>
        )}
      </CardContent>
    </Card>
  )
})

export default GameScreen
