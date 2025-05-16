"use client"

import type React from "react"

import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { GameItem, GameMode } from "@/lib/types"
import GamePath from "./game-path"
import { Clock, Film, Unlock, User, BarChart } from "lucide-react"
import Image from "next/image"
import { RarityOverlay } from "./rarity-overlay"
import { cn } from "@/lib/utils"
import ErrorBoundary from "./error-boundary"
import PlayerStats from "./player-stats"

// Add the track import at the top of the file
import { track } from "@vercel/analytics/react"
import ConnectionWebButton from "./connection-web-button"

// Update the props interface to remove achievement progress
interface GameOverScreenProps {
  history: GameItem[]
  score: number
  highScore: number
  onRestart: () => void
  gameMode: GameMode
  newUnlocks: {
    actors: GameItem[]
    movies: GameItem[]
  }
  dailyChallengeCompleted?: boolean
}

// Custom animated button component
const AnimatedButton = ({
  children,
  onClick,
  variant = "default",
  size = "default",
  className,
}: {
  children: React.ReactNode
  onClick: () => void
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}) => {
  return (
    <Button
      onClick={onClick}
      variant={variant}
      size={size}
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

// New component for flip card animation
const LegendaryFlipCard = ({ item }: { item: GameItem }) => {
  const [flipped, setFlipped] = useState(false)

  return (
    <div className="legendary-card-container" onMouseEnter={() => setFlipped(true)}>
      <div className={`legendary-card ${flipped ? "flipped" : ""}`}>
        <div className="legendary-card-inner">
          {/* Front side - Gold card with stars */}
          <div className="legendary-card-front">
            <div className="legendary-card-content">
              <div className="stars-container">
                <div className="star small left"></div>
                <div className="star large center"></div>
                <div className="star small right"></div>
              </div>
              <div className="legendary-label">LEGENDARY</div>
            </div>
          </div>

          {/* Back side - Actual item */}
          <div className="legendary-card-back">
            <div className="legendary-card-content">
              {item.image ? (
                <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
              ) : (
                <div className="h-full w-full bg-muted flex items-center justify-center">
                  {item.type === "movie" ? (
                    <Film size={24} className="text-muted-foreground" />
                  ) : (
                    <User size={24} className="text-muted-foreground" />
                  )}
                </div>
              )}
              <div className="legendary-badge">
                <div className="legendary-star"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Only show the name after the card is flipped */}
      <p
        className={`text-xs text-center mt-2 truncate max-w-[80px] font-medium transition-opacity duration-500 ${flipped ? "opacity-100" : "opacity-0"}`}
        title={item.name}
      >
        {item.name}
      </p>

      {/* Add CSS for the legendary flip card animation */}
      <style jsx>{`
        .legendary-card-container {
          perspective: 1000px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .legendary-card {
          width: 64px;
          height: 88px;
          cursor: pointer;
          transform-style: preserve-3d;
          transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .legendary-card.flipped {
          transform: rotateY(180deg);
        }
        .legendary-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          text-align: center;
          transform-style: preserve-3d;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          border-radius: 10px;
        }
        .legendary-card-front, .legendary-card-back {
          position: absolute;
          width: 100%;
          height: 100%;
          -webkit-backface-visibility: hidden;
          backface-visibility: hidden;
          border-radius: 10px;
          overflow: hidden;
        }
        .legendary-card-front {
          background: linear-gradient(135deg, #f7c52b, #e6a600);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .legendary-label {
          position: absolute;
          bottom: 8px;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 8px;
          font-weight: bold;
          color: white;
          letter-spacing: 0.5px;
        }
        .legendary-card-back {
          transform: rotateY(180deg);
          background-color: white;
        }
        .legendary-card-content {
          width: 100%;
          height: 100%;
          position: relative;
        }
        .stars-container {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
        }
        .star {
          position: absolute;
          background-color: white;
          clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
        }
        .star.small {
          width: 16px;
          height: 16px;
        }
        .star.large {
          width: 24px;
          height: 24px;
        }
        .star.left {
          transform: translateX(-20px);
        }
        .star.right {
          transform: translateX(20px);
        }
        .legendary-badge {
          position: absolute;
          bottom: 4px;
          right: 4px;
          width: 20px;
          height: 20px;
          background-color: #f7c52b;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }
        .legendary-star {
          width: 12px;
          height: 12px;
          background-color: white;
          clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
        }
      `}</style>
    </div>
  )
}

export default function GameOverScreen({
  history,
  score,
  highScore,
  onRestart,
  gameMode,
  newUnlocks,
  dailyChallengeCompleted,
}: GameOverScreenProps) {
  const isNewHighScore = score > highScore
  const totalNewUnlocks = newUnlocks.actors.length + newUnlocks.movies.length
  const [statsOpen, setStatsOpen] = useState(false)

  useEffect(() => {
    // Update longest chain if this game's chain is longer than the stored one
    const currentChainLength = history.length
    const storedLongestChain = localStorage.getItem("movieGameLongestChain")
    const longestChain = storedLongestChain ? Number.parseInt(storedLongestChain) : 0

    if (currentChainLength > longestChain) {
      localStorage.setItem("movieGameLongestChain", currentChainLength.toString())
    }
  }, [history.length])

  const openStats = () => {
    setStatsOpen(true)
  }

  const closeStats = () => {
    setStatsOpen(false)
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-center text-2xl">Game Over</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8 px-6">
        <div className="text-center py-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <h3 className="text-xl">Connections Made: {score}</h3>
          </div>
          {isNewHighScore ? (
            <p className="text-green-600 font-semibold">New High Score</p>
          ) : (
            <p>High Score: {highScore}</p>
          )}

          <p className="mt-2 text-sm text-muted-foreground">You made {score} connections in 2 minutes!</p>
        </div>

        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-center mb-4">Your Movie Path</h3>
          <div className="bg-muted/30 p-5 rounded-lg">
            <GamePath history={history} />
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">
            You connected {history.length} items in your movie journey!
          </p>
        </div>

        {/* New Pulls Section */}
        {totalNewUnlocks > 0 && (
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-center gap-2">
              <Unlock className="h-5 w-5 text-green-500" />
              <h3 className="text-xl font-semibold text-center">
                You unlocked {totalNewUnlocks} new {totalNewUnlocks === 1 ? "pull" : "pulls"}
              </h3>
            </div>

            {/* New Actors */}
            {newUnlocks.actors.length > 0 && (
              <div className="space-y-2">
                <h4 className="flex items-center gap-1 text-lg font-medium">
                  <User className="h-4 w-4" />
                  <span>
                    {newUnlocks.actors.length} New {newUnlocks.actors.length === 1 ? "Actor Pull" : "Actor Pulls"}
                  </span>
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {newUnlocks.actors.map((actor) => (
                    <div key={actor.id} className="flex flex-col items-center">
                      {actor.rarity === "legendary" ? (
                        <LegendaryFlipCard item={actor} />
                      ) : (
                        <>
                          <div className="relative h-20 w-16 rounded-md overflow-hidden shadow-sm">
                            {actor.image ? (
                              <Image
                                src={actor.image || "/placeholder.svg"}
                                alt={actor.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-muted flex items-center justify-center">
                                <User size={20} className="text-muted-foreground" />
                              </div>
                            )}
                            {actor.rarity && <RarityOverlay rarity={actor.rarity} showLabel={true} size="sm" />}
                          </div>
                          <p className="text-xs text-center mt-1 truncate max-w-[80px]" title={actor.name}>
                            {actor.name}
                          </p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Movies */}
            {newUnlocks.movies.length > 0 && (
              <div className="space-y-2">
                <h4 className="flex items-center gap-1 text-lg font-medium">
                  <Film className="h-4 w-4" />
                  <span>
                    {newUnlocks.movies.length} New {newUnlocks.movies.length === 1 ? "Movie Pull" : "Movie Pulls"}
                  </span>
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {newUnlocks.movies.map((movie) => (
                    <div key={movie.id} className="flex flex-col items-center">
                      {movie.rarity === "legendary" ? (
                        <LegendaryFlipCard item={movie} />
                      ) : (
                        <>
                          <div className="relative h-20 w-16 rounded-md overflow-hidden shadow-sm">
                            {movie.image ? (
                              <Image
                                src={movie.image || "/placeholder.svg"}
                                alt={movie.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-muted flex items-center justify-center">
                                <Film size={20} className="text-muted-foreground" />
                              </div>
                            )}
                            {movie.rarity && <RarityOverlay rarity={movie.rarity} showLabel={true} size="sm" />}
                          </div>
                          <p className="text-xs text-center mt-1 truncate max-w-[80px]" title={movie.name}>
                            {movie.name}
                          </p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-center gap-3 pt-4 pb-6">
        {/* Updated to stack buttons on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-md">
          <AnimatedButton
            variant="outline"
            size="lg"
            onClick={openStats}
            className="flex items-center justify-center gap-2 w-full"
          >
            <BarChart size={16} />
            <span>View Stats</span>
          </AnimatedButton>

          <ConnectionWebButton className="flex items-center justify-center w-full" />

          <AnimatedButton
            size="lg"
            onClick={() => {
              // Track game restart
              track("game_restart", {
                score,
                highScore,
                gameMode,
                dailyChallengeCompleted,
              })
              onRestart()
            }}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white w-full"
          >
            Play Again
          </AnimatedButton>
        </div>
      </CardFooter>
      {/* Stats modal - Use the simplified version */}
      {statsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80" onClick={closeStats}>
          <div
            className="bg-background p-3 sm:p-6 rounded-lg w-[95vw] sm:w-full sm:max-w-4xl max-h-[80vh] sm:max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <ErrorBoundary>
              <PlayerStats onClose={closeStats} mode="simple" />
            </ErrorBoundary>
          </div>
        </div>
      )}
    </Card>
  )
}
