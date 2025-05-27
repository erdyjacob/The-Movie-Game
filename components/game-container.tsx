"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import StartScreen from "./start-screen"
import { GameScreen } from "./game-screen" // Update to use named import
import GameOverScreen from "./game-over-screen"
import type { GameState, GameItem, Difficulty, GameFilters } from "@/lib/types"
import { getRandomMovie, searchMoviesByActor, searchActorsByMovie, prefetchGameData } from "@/lib/tmdb-api"
import { addToPlayerHistory, isNewItem } from "@/lib/player-history"
import { toast } from "@/components/ui/use-toast"
import { calculateActorRarity, calculateMovieRarity } from "@/lib/rarity"
import {
  checkDailyChallenge,
  saveDailyChallengeItem,
  markDailyChallengeCompleted,
  getDailyChallenge,
} from "@/lib/daily-challenge"

// Add this import at the top of the file
import { initializeCache, setupCachePersistence } from "@/lib/api-cache"

// Add this import at the top
import { DailyChallengeToast } from "./daily-challenge-toast"

// Add the track import at the top of the file with other imports
import { track } from "@vercel/analytics/react"

// Add this import near the top of the file
import { makeComputerSelection } from "@/lib/computer-selection"

// Time limit for timed mode in seconds
const TIME_LIMIT = 120 // 2 minutes

// Turn limit for daily challenge mode
const DAILY_CHALLENGE_TURN_LIMIT = 100

// Import the saveConnection function at the top of the file
import { saveConnection } from "@/lib/connection-tracking"

import Image from "next/image"

export default function GameContainer() {
  const [gameState, setGameState] = useState<GameState>({
    status: "start",
    currentItem: null,
    history: [],
    usedIds: new Set(),
    score: 0,
    highScore: 0,
    difficulty: "medium",
    gameMode: "timed", // Default to timed mode
    filters: {
      includeAnimated: true,
      includeSequels: true,
      includeForeign: true,
    },
    isComputerTurn: false,
    strikes: 0,
    turnPhase: "player-pick-actor", // Start with player picking an actor from a movie
    timeRemaining: TIME_LIMIT, // Set time remaining for timed mode
    newUnlocks: {
      actors: [],
      movies: [],
    },
    dailyChallengeCompleted: false,
  })

  const [loading, setLoading] = useState(false)
  const [dataPreloaded, setDataPreloaded] = useState(false)
  const [dailyChallenge, setDailyChallenge] = useState<GameItem | null>(null)

  // Add this state variable
  const [showDailyChallengeToast, setShowDailyChallengeToast] = useState(false)
  const [completedChallengeItem, setCompletedChallengeItem] = useState<GameItem | null>(null)

  // Inside the GameContainer component, add this effect to initialize the cache
  useEffect(() => {
    // Initialize the API cache
    initializeCache()

    // Set up cache persistence
    const cleanup = setupCachePersistence()

    return cleanup
  }, [])

  // Load high score from localStorage on initial render
  useEffect(() => {
    const savedHighScore = localStorage.getItem("movieGameHighScore")
    if (savedHighScore) {
      setGameState((prev) => ({ ...prev, highScore: Number.parseInt(savedHighScore) }))
    }
  }, [])

  // Save high score to localStorage when it changes
  useEffect(() => {
    if (gameState.score > gameState.highScore) {
      const newHighScore = gameState.score
      localStorage.setItem("movieGameHighScore", newHighScore.toString())
      setGameState((prev) => ({ ...prev, highScore: newHighScore }))
    }
  }, [gameState.score, gameState.highScore])

  // Timer for timed mode
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null

    if (gameState.status === "playing" && gameState.gameMode === "timed" && gameState.timeRemaining !== undefined) {
      timer = setInterval(() => {
        setGameState((prev) => {
          const newTimeRemaining = (prev.timeRemaining || 0) - 1

          // End game when time runs out
          if (newTimeRemaining <= 0) {
            clearInterval(timer as NodeJS.Timeout)
            return {
              ...prev,
              timeRemaining: 0,
              status: "gameOver",
            }
          }

          return {
            ...prev,
            timeRemaining: newTimeRemaining,
          }
        })
      }, 1000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [gameState.status, gameState.timeRemaining, gameState.gameMode])

  // Load daily challenge - with better caching and error handling
  useEffect(() => {
    const loadDailyChallenge = async () => {
      try {
        // Use a specific cache key for today's date to ensure consistency
        const today = new Date().toISOString().split("T")[0]
        const cacheKey = `dailyChallenge_${today}`

        // Check if we already have the challenge in localStorage
        const cachedChallenge = localStorage.getItem(cacheKey)

        if (cachedChallenge) {
          // Use cached challenge if available
          setDailyChallenge(JSON.parse(cachedChallenge))
          console.log("Using cached daily challenge")
        } else {
          // Otherwise fetch a new one
          console.log("Fetching new daily challenge")
          const challenge = await getDailyChallenge()

          // Cache the challenge with today's date as key
          localStorage.setItem(cacheKey, JSON.stringify(challenge))
          setDailyChallenge(challenge)
        }
      } catch (error) {
        console.error("Error loading daily challenge:", error)
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
      }
    }

    loadDailyChallenge()
  }, [])

  // Memoize the current game state to prevent unnecessary re-renders
  const { status, currentItem, isComputerTurn, turnPhase, gameMode } = useMemo(
    () => ({
      status: gameState.status,
      currentItem: gameState.currentItem,
      isComputerTurn: gameState.isComputerTurn,
      turnPhase: gameState.turnPhase,
      gameMode: gameState.gameMode,
    }),
    [gameState.status, gameState.currentItem, gameState.isComputerTurn, gameState.turnPhase, gameState.gameMode],
  )

  // Handle computer's turn with useCallback to prevent unnecessary re-renders
  const makeComputerMove = useCallback(async () => {
    if (status === "playing" && isComputerTurn && currentItem) {
      try {
        // Add a small delay to make it feel more natural
        await new Promise((resolve) => setTimeout(resolve, 1000))

        let nextItem: GameItem | null = null
        const usedIds = gameState.usedIds
        const filters = gameState.filters

        if (turnPhase === "computer-pick-actor") {
          // Computer needs to find an actor from the current movie
          // Current item should be a movie
          if (currentItem.type !== "movie") {
            console.error("Expected a movie for computer to pick an actor from, but got:", currentItem.type)
            endGame()
            return
          }

          const actors = await searchActorsByMovie(currentItem.id)

          if (actors.length > 0) {
            // Filter out already used actors
            const availableActors = actors.filter((actor) => !usedIds.has(actor.id))

            if (availableActors.length === 0) {
              console.log("No unused actors available, game over")

              // Show a toast to explain why the game is ending
              toast({
                title: "Game Over",
                description: "No more actors available for this movie. The game has ended.",
                variant: "default",
              })

              endGame()
              return
            }

            // Use our new selection algorithm instead of the old sorting and selection
            const selectedActor = makeComputerSelection(
              availableActors,
              gameState.difficulty,
              {
                history: gameState.history,
                score: gameState.score,
                usedIds: gameState.usedIds,
              },
              "actor",
            )

            if (selectedActor) {
              nextItem = {
                id: selectedActor.id,
                name: selectedActor.name,
                image: selectedActor.profile_path
                  ? `https://image.tmdb.org/t/p/w500${selectedActor.profile_path}`
                  : null,
                type: "actor",
                details: selectedActor,
                selectedBy: "computer",
              }
            }
          }
        } else if (turnPhase === "computer-pick-movie") {
          // Computer needs to find a movie this actor was in
          // Current item should be an actor
          if (currentItem.type !== "actor") {
            console.error("Expected an actor for computer to pick a movie from, but got:", currentItem.type)
            endGame()
            return
          }

          const movies = await searchMoviesByActor(currentItem.id, filters)

          if (movies.length > 0) {
            // Filter out already used movies
            const availableMovies = movies.filter((movie) => !usedIds.has(movie.id))

            if (availableMovies.length === 0) {
              console.log("No unused movies available, game over")

              // Show a toast to explain why the game is ending
              toast({
                title: "Game Over",
                description: "No more movies available for this actor. The game has ended.",
                variant: "default",
              })

              endGame()
              return
            }

            // Use our new selection algorithm instead of the old sorting and selection
            const selectedMovie = makeComputerSelection(
              availableMovies,
              gameState.difficulty,
              {
                history: gameState.history,
                score: gameState.score,
                usedIds: gameState.usedIds,
              },
              "movie",
            )

            if (selectedMovie) {
              nextItem = {
                id: selectedMovie.id,
                name: selectedMovie.title,
                image: selectedMovie.poster_path ? `https://image.tmdb.org/t/p/w500${selectedMovie.poster_path}` : null,
                type: "movie",
                details: selectedMovie,
                selectedBy: "computer",
              }
            }
          }
        }

        if (nextItem) {
          // Add the new item's ID to the used IDs set
          const newUsedIds = new Set(gameState.usedIds)
          newUsedIds.add(nextItem.id)

          // Determine the next turn phase
          let nextTurnPhase = turnPhase
          if (turnPhase === "computer-pick-actor") {
            nextTurnPhase = "computer-pick-movie" // Computer will pick a movie next
          } else if (turnPhase === "computer-pick-movie") {
            nextTurnPhase = "player-pick-actor" // Player will pick an actor next
          }

          setGameState((prev) => ({
            ...prev,
            currentItem: nextItem,
            history: [...prev.history, nextItem],
            usedIds: newUsedIds,
            score: prev.score + 1,
            isComputerTurn: turnPhase === "computer-pick-actor", // Stay computer's turn if we just picked an actor
            turnPhase: nextTurnPhase,
          }))
        } else {
          // Computer couldn't find a valid move
          endGame()
        }
      } catch (error) {
        console.error("Computer move error:", error)
        endGame()
      }
    }
  }, [
    status,
    isComputerTurn,
    currentItem,
    turnPhase,
    gameState.difficulty,
    gameState.usedIds,
    gameState.filters,
    gameState.history,
    gameState.score,
  ])

  // Execute computer move when it's the computer's turn
  useEffect(() => {
    if (status === "playing" && isComputerTurn && currentItem) {
      makeComputerMove()
    }
  }, [status, isComputerTurn, currentItem, makeComputerMove])

  // In the startGame function, add tracking right after setting the game state
  // Find the startGame useCallback function and add this code right after the setGameState call:

  const startGame = useCallback(
    async (difficulty: Difficulty, filters: GameFilters, gameMode = "timed", dailyChallengeItem?: GameItem) => {
      try {
        setLoading(true)

        // Preload data for the selected difficulty if not already done
        if (!dataPreloaded) {
          try {
            await prefetchGameData(difficulty)
          } catch (error) {
            console.error("Error preloading data:", error)
            // Continue even if preloading fails
          }
        }

        // For daily challenge mode, use the provided daily challenge item
        let startItem: GameItem

        if (gameMode === "dailyChallenge") {
          try {
            // Use the provided daily challenge item if available
            if (dailyChallengeItem) {
              setDailyChallenge(dailyChallengeItem)
            }

            // For daily challenge, we start with a random movie (not the challenge item)
            const movie = await getRandomMovie(difficulty, filters)
            startItem = {
              id: movie.id,
              name: movie.title,
              image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
              type: "movie",
              details: movie,
              selectedBy: "computer",
            }
          } catch (error) {
            console.error("Failed to get movie for daily challenge:", error)
            toast({
              title: "Error Starting Daily Challenge",
              description: "There was a problem starting the daily challenge. Please try again later.",
              variant: "destructive",
            })
            resetGame()
            setLoading(false)
            return
          }
        } else {
          // Regular game mode - start with a random movie
          try {
            const movie = await getRandomMovie(difficulty, filters)
            startItem = {
              id: movie.id,
              name: movie.title,
              image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
              type: "movie",
              details: movie,
              selectedBy: "computer",
            }
          } catch (error) {
            console.error("Failed to get random movie:", error)
            toast({
              title: "Error Starting Game",
              description: "There was a problem starting the game. Please try again or adjust your filters.",
              variant: "destructive",
            })
            resetGame()
            setLoading(false)
            return
          }
        }

        // Initialize with the first item's ID in the used IDs set
        const usedIds = new Set([startItem.id])

        setGameState({
          status: "playing",
          currentItem: startItem,
          history: [startItem],
          usedIds,
          score: 0,
          highScore: gameState.highScore,
          difficulty,
          gameMode: gameMode,
          filters,
          isComputerTurn: false,
          strikes: 0,
          turnPhase: "player-pick-actor",
          timeRemaining: gameMode === "timed" ? TIME_LIMIT : undefined,
          turnsRemaining: gameMode === "dailyChallenge" ? DAILY_CHALLENGE_TURN_LIMIT : undefined,
          maxTurns: gameMode === "dailyChallenge" ? DAILY_CHALLENGE_TURN_LIMIT : undefined,
          newUnlocks: {
            actors: [],
            movies: [],
          },
          dailyChallengeCompleted: false,
        })

        // Track game start event with properties
        track("game_started", {
          difficulty,
          gameMode,
          includeAnimated: filters.includeAnimated,
          includeSequels: filters.includeSequels,
          includeForeign: filters.includeForeign,
          startItemId: startItem.id,
          startItemName: startItem.name,
        })
      } catch (error) {
        console.error("Failed to start game:", error)
        toast({
          title: "Error Starting Game",
          description: "There was a problem starting the game. Please try again or adjust your filters.",
          variant: "destructive",
        })
        resetGame()
      } finally {
        setLoading(false)
      }
    },
    [dataPreloaded, gameState.highScore],
  )

  // Update the endGame function to avoid potential state update issues
  const endGame = useCallback(() => {
    // Only update state if we're not already in gameOver state
    setGameState((prev) => {
      if (prev.status !== "gameOver") {
        // Track game end event
        track("game_completed", {
          score: prev.score,
          gameMode: prev.gameMode,
          difficulty: prev.difficulty,
          duration: prev.gameMode === "timed" ? TIME_LIMIT - (prev.timeRemaining || 0) : undefined,
          historyLength: prev.history.length,
          dailyChallengeCompleted: prev.dailyChallengeCompleted,
        })

        return {
          ...prev,
          status: "gameOver",
        }
      }
      return prev
    })
  }, [])

  const resetGame = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      status: "start",
      currentItem: null,
      history: [],
      usedIds: new Set(),
      score: 0,
      strikes: 0,
      turnPhase: "player-pick-actor",
      timeRemaining: TIME_LIMIT,
      turnsRemaining: undefined,
      maxTurns: undefined,
      newUnlocks: {
        actors: [],
        movies: [],
      },
      dailyChallengeCompleted: false,
    }))

    // Achievement tracking removed for stability
  }, [])

  const restartGame = useCallback(() => {
    resetGame()
  }, [resetGame])

  // Add tracking for incorrect answers
  // Find the handleIncorrectAnswer function and add tracking:

  const handleIncorrectAnswer = useCallback(() => {
    // Track incorrect answer
    track("incorrect_answer", {
      gameMode: gameMode,
      score: gameState.score,
      turnPhase: gameState.turnPhase,
    })

    // In daily challenge mode, count strikes
    if (gameMode === "dailyChallenge") {
      setGameState((prev) => {
        const newStrikes = prev.strikes + 1

        // If three strikes, end the game
        if (newStrikes >= 3) {
          // Track game over due to strikes
          track("game_over_strikes", {
            score: prev.score,
            movesCount: prev.history.length,
            dailyChallengeCompleted: prev.dailyChallengeCompleted,
          })

          return {
            ...prev,
            strikes: newStrikes,
            status: "gameOver",
          }
        }

        return {
          ...prev,
          strikes: newStrikes,
        }
      })
    }
    // In timed mode, we don't count strikes
  }, [gameMode, gameState.score, gameState.turnPhase, gameState.history.length])

  const updateGameState = useCallback(
    async (newItem: GameItem) => {
      // Add the new item's ID to the used IDs set
      const newUsedIds = new Set(gameState.usedIds)
      newUsedIds.add(newItem.id)

      // Mark this item as selected by the player
      newItem.selectedBy = "player"

      // Calculate rarity
      if (newItem.type === "movie") {
        newItem.rarity = calculateMovieRarity(newItem.details)
      } else {
        newItem.rarity = calculateActorRarity(newItem.details)
      }

      // Check if this is a new unlock
      const isNewItemUnlock = isNewItem(newItem)
      newItem.isNewUnlock = isNewItemUnlock

      // Add to player history
      addToPlayerHistory(newItem)

      // Record the connection between the current item and the new item
      if (gameState.currentItem && gameState.currentItem.type !== newItem.type) {
        const movieItem = gameState.currentItem.type === "movie" ? gameState.currentItem : newItem
        const actorItem = gameState.currentItem.type === "actor" ? gameState.currentItem : newItem

        // Save the connection
        saveConnection(movieItem.id, actorItem.id, movieItem.name, actorItem.name)
      }

      // Check if this is the daily challenge item
      let isDailyChallenge = false
      if (dailyChallenge && !gameState.dailyChallengeCompleted) {
        isDailyChallenge = await checkDailyChallenge(newItem)
        if (isDailyChallenge) {
          // Mark the daily challenge as completed
          await saveDailyChallengeItem(newItem)
          await markDailyChallengeCompleted()

          // Set state to show the toast
          setCompletedChallengeItem(newItem)
          setShowDailyChallengeToast(true)

          // Add the daily challenge flag to the item
          newItem.isDailyChallenge = true

          // Track daily challenge completion
          track("daily_challenge_completed", {
            itemId: newItem.id,
            itemName: newItem.name,
            itemType: newItem.type,
            score: gameState.score,
            movesCount: gameState.history.length,
            strikes: gameState.strikes,
          })

          // NEW CODE: End the game immediately when daily challenge is completed
          setGameState((prev) => ({
            ...prev,
            currentItem: newItem,
            history: [...prev.history, newItem],
            usedIds: newUsedIds,
            score: prev.score + 1,
            dailyChallengeCompleted: true,
            status: "gameOver", // End the game
          }))

          // Return early to prevent the normal state update below
          return
        }
      }

      // Determine the next turn phase based on the current phase
      let nextTurnPhase = gameState.turnPhase
      let isNextComputerTurn = false

      if (gameState.turnPhase === "player-pick-actor") {
        // Player just found an actor, now they need to find a movie
        nextTurnPhase = "player-pick-movie"
        isNextComputerTurn = false
      } else if (gameState.turnPhase === "player-pick-movie") {
        // Player just found a movie, now computer needs to find an actor
        nextTurnPhase = "computer-pick-actor"
        isNextComputerTurn = true
      }

      setGameState((prev) => {
        // Update the new unlocks list if this is a new item
        const newUnlocks = { ...prev.newUnlocks }
        if (isNewItemUnlock) {
          if (newItem.type === "actor") {
            newUnlocks.actors = [...newUnlocks.actors, newItem]
          } else {
            newUnlocks.movies = [...newUnlocks.movies, newItem]
          }
        }

        // Calculate remaining turns for daily challenge
        const newTurnsRemaining =
          prev.gameMode === "dailyChallenge" && prev.turnsRemaining !== undefined
            ? prev.turnsRemaining - 1
            : prev.turnsRemaining

        // Check if we've reached the turn limit in daily challenge mode
        const turnLimitReached =
          prev.gameMode === "dailyChallenge" && newTurnsRemaining !== undefined && newTurnsRemaining <= 0

        return {
          ...prev,
          currentItem: newItem,
          history: [...prev.history, newItem],
          usedIds: newUsedIds,
          score: prev.score + 1,
          isComputerTurn: isNextComputerTurn,
          turnPhase: nextTurnPhase,
          turnsRemaining: newTurnsRemaining,
          newUnlocks,
          dailyChallengeCompleted: prev.dailyChallengeCompleted || isDailyChallenge,
          status: turnLimitReached ? "gameOver" : prev.status, // End game if turn limit reached
        }
      })

      // If turn limit reached, track the event and return early
      if (
        gameState.gameMode === "dailyChallenge" &&
        gameState.turnsRemaining !== undefined &&
        gameState.turnsRemaining <= 1
      ) {
        track("daily_challenge_turn_limit_reached", {
          score: gameState.score + 1,
          turnsUsed: gameState.maxTurns || DAILY_CHALLENGE_TURN_LIMIT,
          dailyChallengeCompleted: isDailyChallenge,
        })
        return
      }
    },
    [
      gameState.turnPhase,
      gameState.usedIds,
      gameState.dailyChallengeCompleted,
      dailyChallenge,
      gameState.history.length,
      gameState.score,
      gameState.strikes,
      gameState.gameMode,
      gameState.currentItem,
      gameState.turnsRemaining,
      gameState.maxTurns,
    ],
  )

  // Find the startRegularGame function - around line 420
  // Replace this function:
  const startRegularGame = () => {
    // Use default settings (medium difficulty, all filters enabled)
    const defaultDifficulty = "medium"
    const defaultFilters = {
      includeAnimated: true,
      includeSequels: true,
      includeForeign: true,
    }
    onStart(defaultDifficulty, defaultFilters, "timed")
  }

  // Define onStart here, before it's used
  const onStart = startGame

  return (
    <div className="w-full max-w-3xl">
      {/* Header with logo when not on start screen */}
      {gameState.status !== "start" && (
        <div className="text-center mb-10">
          {/* SVG Logo instead of text title */}
          <div className="w-80 h-20 relative mx-auto mb-3">
            <Image src="/images/TheMovieGame.svg" alt="The Movie Game" fill className="object-contain" priority />
          </div>
          <p className="text-muted-foreground">
            {gameState.gameMode === "dailyChallenge"
              ? "Daily Challenge: Unlimited time, three strikes, find the daily target!"
              : "Name an actor from the movie or a movie the actor was in!"}
          </p>
        </div>
      )}

      {gameState.status === "start" && (
        <StartScreen onStart={startGame} highScore={gameState.highScore} loading={loading} />
      )}

      {/* Remove or comment out this line: */}
      {/* {loading && <PopcornLoader />} */}

      {gameState.status === "playing" && gameState.currentItem && (
        <GameScreen
          currentItem={gameState.currentItem}
          score={gameState.score}
          highScore={gameState.highScore}
          onCorrectAnswer={updateGameState}
          onIncorrectAnswer={handleIncorrectAnswer}
          onGameOver={endGame}
          isComputerTurn={gameState.isComputerTurn}
          history={gameState.history}
          usedIds={gameState.usedIds}
          filters={gameState.filters}
          strikes={gameState.strikes}
          turnPhase={gameState.turnPhase}
          difficulty={gameState.difficulty}
          gameMode={gameState.gameMode}
          timeRemaining={gameState.timeRemaining}
          turnsRemaining={gameState.turnsRemaining}
          maxTurns={gameState.maxTurns}
          dailyChallenge={dailyChallenge}
          dailyChallengeCompleted={gameState.dailyChallengeCompleted}
        />
      )}

      {gameState.status === "gameOver" && (
        <GameOverScreen
          history={gameState.history}
          score={gameState.score}
          highScore={gameState.highScore}
          onRestart={restartGame}
          gameMode={gameState.gameMode}
          newUnlocks={gameState.newUnlocks}
          dailyChallengeCompleted={gameState.dailyChallengeCompleted}
        />
      )}

      {/* Daily Challenge Toast */}
      {completedChallengeItem && <DailyChallengeToast item={completedChallengeItem} show={showDailyChallengeToast} />}
    </div>
  )
}
