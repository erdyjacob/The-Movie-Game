"use client"

import { Input } from "@/components/ui/input"
import type React from "react"
import { useState, useEffect, useRef, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import type { GameItem, ItemType, GameFilters, Difficulty, GameMode } from "@/lib/types"
import { useMobile } from "@/hooks/use-mobile"
import LiveGamePath from "./live-game-path"
import { validateAnswer } from "@/lib/answer-validation"
import { AlertTriangle, Clock, Info } from "lucide-react"
import Image from "next/image"
import { searchActorsByMovie, searchMoviesByActor } from "@/lib/tmdb-api"
import { useDebounce } from "@/hooks/use-debounce"
import { PopcornLoader } from "./popcorn-loader"

// Format time function
function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

// Interface for suggestion items
interface SuggestionItem {
  id: number
  name: string
  image: string | null
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
export const GameScreen = memo(function GameScreen({
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
  // State management
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [availableOptions, setAvailableOptions] = useState<SuggestionItem[]>([])
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)

  // Refs
  const inputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const optionsLoadedRef = useRef<boolean>(false)
  const formRef = useRef<HTMLFormElement>(null)

  // Utilities
  const isMobile = useMobile()
  const debouncedSearch = useDebounce(search, 300)

  // Determine what type of item the player needs to find based on the turn phase
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
  const minCharsForSuggestions = 3

  // Handle click outside suggestions dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
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
  }, [])

  // Reset error when computer turn changes
  useEffect(() => {
    if (isComputerTurn) {
      setError(null)
    }
  }, [isComputerTurn])

  // Load available options when the current item changes
  const loadAvailableOptions = useCallback(async () => {
    // Don't load options during computer's turn
    if (isComputerTurn) return

    // Reset the options loaded flag
    optionsLoadedRef.current = false
    setIsLoadingOptions(true)
    setAvailableOptions([])

    try {
      let options: SuggestionItem[] = []

      // If we need to find an actor, load actors from the current movie
      if (expectedType === "actor" && currentItem.type === "movie") {
        const actors = await searchActorsByMovie(currentItem.id)
        options = actors
          .filter((actor) => !usedIds.has(actor.id))
          .map((actor) => ({
            id: actor.id,
            name: actor.name,
            image: actor.profile_path ? `https://image.tmdb.org/t/p/w500${actor.profile_path}` : null,
          }))
      }
      // If we need to find a movie, load movies from the current actor
      else if (expectedType === "movie" && currentItem.type === "actor") {
        const movies = await searchMoviesByActor(currentItem.id, filters)
        options = movies
          .filter((movie) => !usedIds.has(movie.id))
          .map((movie) => ({
            id: movie.id,
            name: movie.title || movie.name || "",
            image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
          }))
      }

      setAvailableOptions(options)
      optionsLoadedRef.current = true
      console.log(`Loaded ${options.length} available options for ${expectedType}`)
    } catch (error) {
      console.error(`Error loading available options for ${expectedType}:`, error)
      setAvailableOptions([])
    } finally {
      setIsLoadingOptions(false)
      optionsLoadedRef.current = true
    }
  }, [currentItem.id, currentItem.type, expectedType, filters, usedIds, isComputerTurn])

  useEffect(() => {
    loadAvailableOptions()
  }, [loadAvailableOptions])

  // Filter suggestions based on debounced search input
  useEffect(() => {
    if (!suggestionsEnabled || debouncedSearch.length < minCharsForSuggestions || !optionsLoadedRef.current) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const filteredSuggestions = availableOptions
      .filter((option) => option.name.toLowerCase().includes(debouncedSearch.toLowerCase()))
      .slice(0, 5) // Limit to 5 suggestions for performance

    setSuggestions(filteredSuggestions)
    setShowSuggestions(filteredSuggestions.length > 0)
  }, [debouncedSearch, suggestionsEnabled, availableOptions, minCharsForSuggestions])

  // Handle form submission
  const handleSubmit = useCallback(
    async (event: React.FormEvent, selectedItem?: SuggestionItem) => {
      event.preventDefault()

      if ((!search.trim() && !selectedItem) || loading || isComputerTurn) return

      setLoading(true)
      setError(null)
      setShowSuggestions(false)

      try {
        // Use the selected item if provided, otherwise find it in suggestions
        const selectedSuggestion =
          selectedItem || suggestions.find((suggestion) => suggestion.name.toLowerCase() === search.toLowerCase())

        // Log for debugging
        console.log("Validating answer:", {
          search: selectedItem?.name || search,
          currentItem: {
            id: currentItem.id,
            name: currentItem.name,
            type: currentItem.type,
          },
          expectedType,
          selectedItemId: selectedSuggestion?.id,
        })

        // Use our single validation path, passing the selected ID if available
        const validationResult = await validateAnswer(
          selectedItem?.name || search,
          currentItem,
          expectedType,
          usedIds,
          filters,
          selectedSuggestion?.id, // Pass the ID if selected from dropdown
        )

        // Log validation result for debugging
        console.log("Validation result:", validationResult)

        if (validationResult.valid && validationResult.item) {
          // Call the onCorrectAnswer callback
          onCorrectAnswer(validationResult.item)

          // Clear the search input
          setSearch("")
        } else {
          // Call the onIncorrectAnswer callback
          onIncorrectAnswer()

          // Set the error message
          setError(validationResult.error || "Incorrect answer. Please try again.")
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
      loading,
      isComputerTurn,
      suggestions,
      currentItem,
      expectedType,
      usedIds,
      filters,
      onCorrectAnswer,
      onIncorrectAnswer,
    ],
  )

  // Handle suggestion click - now auto-submits the form
  const handleSuggestionClick = useCallback(
    (suggestion: SuggestionItem) => {
      setSearch(suggestion.name)
      setShowSuggestions(false)

      // Auto-submit the form with the selected suggestion
      if (formRef.current) {
        handleSubmit(new Event("submit") as unknown as React.FormEvent, suggestion)
      }
    },
    [handleSubmit],
  )

  // Handle keyboard navigation for suggestions
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!showSuggestions || suggestions.length === 0) return

      const suggestionElements = suggestionsRef.current?.querySelectorAll('[role="option"]')
      if (!suggestionElements?.length) return

      const currentIndex = Array.from(suggestionElements).findIndex((el) => el === document.activeElement)

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault()
          if (currentIndex < 0 || currentIndex >= suggestionElements.length - 1) {
            // Focus first suggestion if none is focused or at the end
            ;(suggestionElements[0] as HTMLElement).focus()
          } else {
            // Focus next suggestion
            ;(suggestionElements[currentIndex + 1] as HTMLElement).focus()
          }
          break
        case "ArrowUp":
          event.preventDefault()
          if (currentIndex <= 0) {
            // Focus last suggestion if at the beginning or none is focused
            ;(suggestionElements[suggestionElements.length - 1] as HTMLElement).focus()
          } else {
            // Focus previous suggestion
            ;(suggestionElements[currentIndex - 1] as HTMLElement).focus()
          }
          break
        case "Enter":
          if (document.activeElement !== inputRef.current && currentIndex >= 0) {
            event.preventDefault()
            const suggestion = suggestions[currentIndex]
            handleSuggestionClick(suggestion)
          }
          break
        case "Escape":
          event.preventDefault()
          setShowSuggestions(false)
          inputRef.current?.focus()
          break
      }
    },
    [showSuggestions, suggestions, handleSuggestionClick],
  )

  // Determine instruction text based on the current item and expected type
  let instructionText = ""
  if (isComputerTurn) {
    instructionText = "Computer is thinking..."
  } else if (currentItem.type === "movie") {
    instructionText = "Name an actor who appears in this movie:"
  } else {
    instructionText = "Name a movie this actor appeared in:"
  }

  // Calculate time progress percentage for the progress bar
  const timeProgressPercentage =
    timeRemaining !== undefined && gameMode === "timed"
      ? (timeRemaining / 120) * 100 // Assuming 2 minutes total time
      : 100

  return (
    <div className="flex flex-col items-center min-h-screen bg-[#0f172a] text-white pt-4 pb-8 px-4">
      {/* Main Game Container */}
      <div className="w-full max-w-3xl bg-[#0a0f1c] rounded-lg p-8 shadow-xl">
        {/* Score Display */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold">Score: {score}</h2>
        </div>

        {/* Timer Display for Timed Mode */}
        {gameMode === "timed" && timeRemaining !== undefined && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={18} />
              <span className="font-medium">Time Remaining: {formatTime(timeRemaining)}</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2.5">
              <div className="bg-white h-2.5 rounded-full" style={{ width: `${timeProgressPercentage}%` }}></div>
            </div>
          </div>
        )}

        {/* Instruction Text */}
        <p className="text-center text-lg mb-4">{instructionText}</p>

        {/* Current Item Display - Reduced size by 30% */}
        <div className="flex flex-col items-center justify-center mb-6">
          {currentItem.image && (
            <div className="relative w-32 h-48 mb-3 rounded-xl overflow-hidden shadow-lg">
              <Image
                src={currentItem.image || "/placeholder.svg"}
                alt={currentItem.name}
                fill
                className="object-cover"
              />
            </div>
          )}
          <h3 className="text-xl font-semibold">{currentItem.name}</h3>
        </div>

        {/* Computer Turn Indicator or Input Form */}
        {isComputerTurn ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <PopcornLoader size="lg" text="Computer is making a selection..." />
          </div>
        ) : (
          <form ref={formRef} onSubmit={(e) => handleSubmit(e)} className="mb-4" onKeyDown={handleKeyDown}>
            <div className="relative">
              <Input
                type="text"
                placeholder={`Enter ${expectedType === "actor" ? "an actor" : "a movie"}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => {
                  if (search.length >= minCharsForSuggestions && suggestions.length > 0) {
                    setShowSuggestions(true)
                  }
                }}
                disabled={loading}
                ref={inputRef}
                className="w-full bg-[#0d1425] border-gray-700 h-12 text-white mb-4"
                aria-autocomplete="list"
                aria-controls={showSuggestions ? "suggestions-list" : undefined}
                aria-expanded={showSuggestions}
                role="combobox"
                aria-activedescendant={showSuggestions ? `suggestion-${suggestions[0]?.id}` : undefined}
              />

              {/* Loading indicator for options */}
              {isLoadingOptions && (
                <div className="absolute right-3 top-3">
                  <div className="animate-spin h-6 w-6 border-2 border-white border-opacity-20 border-t-white rounded-full"></div>
                </div>
              )}

              {/* Suggestions Dropdown */}
              {showSuggestions && (
                <div
                  ref={suggestionsRef}
                  id="suggestions-list"
                  className="absolute z-50 w-full mt-1 bg-[#0d1425] border border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto"
                  style={{ top: "100%" }}
                  role="listbox"
                >
                  {suggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      id={`suggestion-${suggestion.id}`}
                      className="flex items-center gap-2 p-2 hover:bg-[#1a2234] cursor-pointer focus:bg-[#1a2234] focus:outline-none"
                      onClick={() => handleSuggestionClick(suggestion)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          handleSuggestionClick(suggestion)
                        }
                      }}
                      role="option"
                      tabIndex={0}
                      aria-selected={search === suggestion.name}
                    >
                      {suggestion.image && (
                        <div className="relative h-8 w-8 overflow-hidden rounded flex-shrink-0">
                          <Image src={suggestion.image || "/placeholder.svg"} alt="" fill className="object-cover" />
                        </div>
                      )}
                      <span className="text-white truncate">{suggestion.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Helper Text - Now centered */}
            <div className="flex flex-col gap-1 mb-4 text-sm text-gray-400 text-center">
              <div className="flex items-center justify-center gap-1">
                <Info size={14} />
                <span>Enter the name - spelling doesn't have to be perfect</span>
              </div>
              <div className="flex items-center justify-center gap-1">
                <AlertTriangle size={14} />
                <span>Using the same answer twice will count as a strike!</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-red-500 mb-4 text-center" role="alert">
                {error}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Button type="submit" disabled={loading} className="bg-white text-[#0a0f1c] hover:bg-gray-200 px-8">
                {loading ? "Checking..." : "Submit"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onGameOver}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Give Up
              </Button>
            </div>
          </form>
        )}

        {/* Game Progress */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <h3 className="text-lg font-medium mb-4 text-center">Game Progress:</h3>
          <LiveGamePath history={history} difficulty={difficulty} />
        </div>
      </div>
    </div>
  )
})

export default GameScreen
