"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import StartScreen from "./start-screen"
import GameScreen from "./game-screen"
import GameOverScreen from "./game-over-screen"
import type { GameState, GameItem, Difficulty, GameFilters } from "@/lib/types"
import { getRandomMovie, searchMoviesByActor, searchActorsByMovie, prefetchGameData } from "@/lib/tmdb-api"
import { addToPlayerHistory, isNewItem } from "@/lib/player-history"
import { toast } from "@/components/ui/use-toast"
import { calculateActorRarity, calculateMovieRarity } from "@/lib/rarity"
import {
  getDailyChallenge,
  checkDailyChallenge,
  saveDailyChallengeItem,
  markDailyChallengeCompleted,
} from "@/lib/daily-challenge"

// Add this import at the top of the file
import { initializeCache, setupCachePersistence } from "@/lib/api-cache"

// Time limit for timed mode in seconds
const TIME_LIMIT = 120 // 2 minutes

export default function GameContainer() {
  const [gameState, setGameState] = useState<GameState>({
    status: "start",
    currentItem: null,
    history: [],
    usedIds: new Set(),
    score: 0,
    highScore: 0,
    difficulty: "medium",
    gameMode: "timed", // Always timed mode
    filters: {
      includeAnimated: true,
      includeSequels: true,
      includeForeign: true,
    },
    isComputerTurn: false,
    strikes: 0,
    turnPhase: "player-pick-actor", // Start with player picking an actor from a movie
    timeRemaining: TIME_LIMIT, // Always set time remaining
    newUnlocks: {
      actors: [],
      movies: [],
    },
    dailyChallengeCompleted: false,
  })

  const [loading, setLoading] = useState(false)
  const [dataPreloaded, setDataPreloaded] = useState(false)
  const [dailyChallenge, setDailyChallenge] = useState<GameItem | null>(null)

  // Inside the GameContainer component, add this effect to initialize the cache
  useEffect(() => {
    // Initialize the API cache
    initializeCache()

    // Set up cache persistence
    const cleanup = setupCachePersistence()

    return cleanup
  }, [])

  // Preload data when component mounts
  useEffect(() => {
    const preloadData = async () => {
      try {
        await prefetchGameData("medium") // Preload data for medium difficulty (default)
        setDataPreloaded(true)

        // Load daily challenge
        const challenge = await getDailyChallenge()
        setDailyChallenge(challenge)
      } catch (error) {
        console.error("Error preloading data:", error)
        // Continue even if preloading fails
        setDataPreloaded(true)
      }
    }

    preloadData()
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

    if (gameState.status === "playing" && gameState.timeRemaining !== undefined) {
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
  }, [gameState.status, gameState.timeRemaining])

  // Memoize the current game state to prevent unnecessary re-renders
  const { status, currentItem, isComputerTurn, turnPhase } = useMemo(
    () => ({
      status: gameState.status,
      currentItem: gameState.currentItem,
      isComputerTurn: gameState.isComputerTurn,
      turnPhase: gameState.turnPhase,
    }),
    [gameState.status, gameState.currentItem, gameState.isComputerTurn, gameState.turnPhase],
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

            // Sort actors by popularity (descending)
            const sortedActors = [...availableActors].sort((a, b) => (b.popularity || 0) - (a.popularity || 0))

            // For easy mode, only use the top 5 most popular actors
            // For medium, use top 10, for hard use any
            const difficulty = gameState.difficulty
            const actorPool =
              difficulty === "easy"
                ? sortedActors.slice(0, Math.min(5, sortedActors.length))
                : difficulty === "medium"
                  ? sortedActors.slice(0, Math.min(10, sortedActors.length))
                  : sortedActors

            // Pick a random actor from the filtered pool
            const randomActor = actorPool[Math.floor(Math.random() * actorPool.length)]

            nextItem = {
              id: randomActor.id,
              name: randomActor.name,
              image: randomActor.profile_path ? `https://image.tmdb.org/t/p/w500${randomActor.profile_path}` : null,
              type: "actor",
              details: randomActor,
              selectedBy: "computer",
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

            // Sort movies by popularity (descending)
            const sortedMovies = [...availableMovies].sort((a, b) => (b.popularity || 0) - (a.popularity || 0))

            // For easy mode, only use the top 5 most popular movies
            // For medium, use top 10, for hard use any
            const difficulty = gameState.difficulty
            const moviePool =
              difficulty === "easy"
                ? sortedMovies.slice(0, Math.min(5, sortedMovies.length))
                : difficulty === "medium"
                  ? sortedMovies.slice(0, Math.min(10, sortedMovies.length))
                  : sortedMovies

            // Pick a random movie from the filtered pool
            const randomMovie = moviePool[Math.floor(Math.random() * moviePool.length)]

            nextItem = {
              id: randomMovie.id,
              name: randomMovie.title,
              image: randomMovie.poster_path ? `https://image.tmdb.org/t/p/w500${randomMovie.poster_path}` : null,
              type: "movie",
              details: randomMovie,
              selectedBy: "computer",
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
  }, [status, isComputerTurn, currentItem, turnPhase, gameState.difficulty, gameState.usedIds, gameState.filters])

  // Execute computer move when it's the computer's turn
  useEffect(() => {
    if (status === "playing" && isComputerTurn && currentItem) {
      makeComputerMove()
    }
  }, [status, isComputerTurn, currentItem, makeComputerMove])

  const startGame = useCallback(
    async (difficulty: Difficulty, filters: GameFilters) => {
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

        // Always start with a movie from the computer
        let startItem: GameItem

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
          gameMode: "timed", // Always timed mode
          filters,
          isComputerTurn: false,
          strikes: 0,
          turnPhase: "player-pick-actor", // Player needs to find an actor from the computer's movie
          timeRemaining: TIME_LIMIT, // Always set time limit
          newUnlocks: {
            actors: [],
            movies: [],
          },
          dailyChallengeCompleted: false,
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

  const endGame = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      status: "gameOver",
    }))
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
      newUnlocks: {
        actors: [],
        movies: [],
      },
      dailyChallengeCompleted: false,
    }))
  }, [])

  const restartGame = useCallback(() => {
    resetGame()
  }, [resetGame])

  const handleIncorrectAnswer = useCallback(() => {
    // In timed mode, we don't count strikes, but we might want to add a time penalty
    // For now, we'll just do nothing
  }, [])

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
      const isNewUnlock = isNewItem(newItem)
      newItem.isNewUnlock = isNewUnlock

      // Add to player history
      addToPlayerHistory(newItem)

      // Check if this is the daily challenge item
      let isDailyChallenge = false
      if (dailyChallenge && !gameState.dailyChallengeCompleted) {
        isDailyChallenge = await checkDailyChallenge(newItem)
        if (isDailyChallenge) {
          // Mark the daily challenge as completed
          await saveDailyChallengeItem(newItem)
          await markDailyChallengeCompleted()

          // Show a toast notification
          toast({
            title: "Daily Challenge Completed!",
            description: "You found today's challenge item! +50 bonus points added to your account score.",
            variant: "default",
          })

          // Add the daily challenge flag to the item
          newItem.isDailyChallenge = true
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
        if (isNewUnlock) {
          if (newItem.type === "actor") {
            newUnlocks.actors = [...newUnlocks.actors, newItem]
          } else {
            newUnlocks.movies = [...newUnlocks.movies, newItem]
          }
        }

        return {
          ...prev,
          currentItem: newItem,
          history: [...prev.history, newItem],
          usedIds: newUsedIds,
          score: prev.score + 1,
          isComputerTurn: isNextComputerTurn,
          turnPhase: nextTurnPhase,
          newUnlocks,
          dailyChallengeCompleted: prev.dailyChallengeCompleted || isDailyChallenge,
        }
      })
    },
    [gameState.turnPhase, gameState.usedIds, gameState.dailyChallengeCompleted, dailyChallenge],
  )

  return (
    <div className="w-full max-w-3xl">
      {/* Remove the header when on the start screen */}
      {gameState.status !== "start" && (
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3">The Movie Game</h1>
          <p className="text-muted-foreground">Name an actor from the movie or a movie the actor was in!</p>
        </div>
      )}

      {gameState.status === "start" && (
        <StartScreen onStart={startGame} highScore={gameState.highScore} loading={loading} />
      )}

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
    </div>
  )
}
