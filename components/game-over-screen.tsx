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
import { unlockAchievement, getAllAchievements, type Achievement, updateAchievementProgress } from "@/lib/achievements"
import {
  CheckCircle,
  Trophy,
  Star,
  Globe,
  Link,
  Search,
  Calendar,
  Heart,
  Skull,
  Rocket,
  Zap,
  Laugh,
  Dumbbell,
  Mountain,
  Box,
  Network,
  Repeat,
  Award,
  Medal,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"
import ErrorBoundary from "./error-boundary"
import PlayerStats from "./player-stats"

// Add the track import at the top of the file
import { track } from "@vercel/analytics/react"

// Update the props interface to include achievement progress
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
  achievementProgress: Record<string, number>
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
  achievementProgress,
}: GameOverScreenProps) {
  const isNewHighScore = score > highScore
  const totalNewUnlocks = newUnlocks.actors.length + newUnlocks.movies.length
  const [statsOpen, setStatsOpen] = useState(false)
  const [newlyCompletedAchievements, setNewlyCompletedAchievements] = useState<Achievement[]>([])

  useEffect(() => {
    // Check for perfect game achievement
    if (score > 0 && history.length > 0) {
      // If there were no strikes, unlock the perfect game achievement
      if (gameMode === "classic" && history.every((item) => !item.isIncorrect)) {
        unlockAchievement("perfect_game")
      }
    }

    // Update longest chain if this game's chain is longer than the stored one
    const currentChainLength = history.length
    const storedLongestChain = localStorage.getItem("movieGameLongestChain")
    const longestChain = storedLongestChain ? Number.parseInt(storedLongestChain) : 0

    if (currentChainLength > longestChain) {
      localStorage.setItem("movieGameLongestChain", currentChainLength.toString())
    }

    // Track newly completed achievements
    const completedInThisGame: Achievement[] = []

    // Update achievement progress with contributing items
    if (achievementProgress && Object.keys(achievementProgress).length > 0) {
      Object.entries(achievementProgress).forEach(([achievementId, progress]) => {
        // Find the contributing items for this achievement from the current game
        const contributingItems = findContributingItemsFromCurrentGame(achievementId, history, newUnlocks)

        // Update the achievement progress with the contributing items
        if (progress > 0) {
          // If we have multiple contributing items, update with each one
          if (contributingItems.length > 0) {
            contributingItems.forEach((item) => {
              // We divide the progress by the number of items to avoid double counting
              const progressPerItem = progress / contributingItems.length
              updateAchievementProgress(achievementId, progressPerItem, item)
            })
          } else {
            // If no specific items contributed, just update the progress
            updateAchievementProgress(achievementId, progress)
          }

          // Check if this achievement was completed in this game
          const achievement = getAllAchievements().find((a) => a.id === achievementId)
          if (
            achievement &&
            achievement.progress &&
            achievement.progress.current >= achievement.progress.target &&
            !achievement.isUnlocked
          ) {
            completedInThisGame.push(achievement)
          }
        }
      })
    }

    // Set newly completed achievements
    setNewlyCompletedAchievements(completedInThisGame)
  }, [score, history, gameMode, achievementProgress, newUnlocks])

  const openStats = () => {
    setStatsOpen(true)
  }

  const closeStats = () => {
    setStatsOpen(false)
  }

  // Add this function inside the component to get the achievements with progress in this game
  const getInProgressAchievementsWithProgress = (progress: Record<string, number>): Achievement[] => {
    if (!progress || Object.keys(progress).length === 0) return []

    const allAchievements = getAllAchievements()

    // Map achievements with their progress in this game
    const achievementsWithProgress = allAchievements
      .filter((a) => {
        // Only include achievements that:
        // 1. Have progress in this game
        // 2. Are not already unlocked/completed
        // 3. Have not reached their target yet
        return (
          progress[a.id] &&
          progress[a.id] > 0 &&
          !a.isUnlocked &&
          (a.progress ? a.progress.current < a.progress.target : true)
        )
      })
      .map((a) => ({
        ...a,
        gameProgress: progress[a.id] || 0,
      }))
      .sort((a, b) => {
        // Sort by percentage of progress made in this game
        const aPercentage = a.progress ? a.gameProgress / a.progress.target : 0
        const bPercentage = b.progress ? b.gameProgress / b.progress.target : 0
        return bPercentage - aPercentage
      })

    return achievementsWithProgress
  }

  // Get achievements that made progress in this game but are not yet completed
  const inProgressAchievements = getInProgressAchievementsWithProgress(achievementProgress)

  // Add this helper function to get achievement rarity color
  const getAchievementRarityColor = (rarity: string): string => {
    switch (rarity) {
      case "legendary":
        return "bg-gradient-to-r from-amber-500 to-amber-700 border-amber-600"
      case "epic":
        return "bg-gradient-to-r from-purple-500 to-purple-700 border-purple-600"
      case "rare":
        return "bg-gradient-to-r from-blue-500 to-indigo-700 border-indigo-600"
      case "uncommon":
        return "bg-gradient-to-r from-green-500 to-green-700 border-green-600"
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-700 border-gray-600"
    }
  }

  // Add this helper function to get icon component
  const getIconComponent = (iconName: string, size = 16) => {
    const icons: Record<string, any> = {
      Trophy,
      Users: User,
      Star,
      Globe,
      Link,
      Search,
      Timer: Clock,
      Calendar,
      CheckCircle,
      Heart,
      Skull,
      Rocket,
      Zap,
      Laugh,
      Dumbbell,
      Mountain,
      Box,
      Network,
      Repeat,
      Award,
      Medal,
    }

    const IconComponent = icons[iconName] || Award
    return <IconComponent size={size} />
  }

  // Add this helper function to get rarity display name
  const getRarityDisplayName = (rarity: string): string => {
    return rarity.charAt(0).toUpperCase() + rarity.slice(1)
  }

  // Helper function to find items from the current game that contributed to an achievement
  const findContributingItemsFromCurrentGame = (
    achievementId: string,
    gameHistory: GameItem[],
    newUnlocks: { actors: GameItem[]; movies: GameItem[] },
  ): GameItem[] => {
    const contributingItems: GameItem[] = []

    // Different logic based on achievement type
    switch (achievementId) {
      case "chain_reaction":
        // For chain reaction, all items in the history contributed
        if (gameHistory.length >= 15) {
          return gameHistory
        }
        break

      case "legendary_hunter":
      case "legendary_collection":
        // For legendary achievements, any legendary items from this game
        return [...newUnlocks.actors, ...newUnlocks.movies].filter((item) => item.rarity === "legendary")

      case "cinephile_supreme":
        // For movie collection, any new movies unlocked
        return newUnlocks.movies

      case "hollywood_rolodex":
        // For actor collection, any new actors unlocked
        return newUnlocks.actors

      case "perfect_game":
        // For perfect game, all items in the history contributed
        if (gameHistory.every((item) => !item.isIncorrect)) {
          return gameHistory
        }
        break

      // Genre-based achievements
      case "aw_cute":
        // Rom-com movies
        return newUnlocks.movies.filter(
          (movie) =>
            movie.genres?.some((genre) => genre.toLowerCase().includes("romance")) &&
            movie.genres?.some((genre) => genre.toLowerCase().includes("comedy")),
        )
      case "screamer":
        // Horror movies
        return newUnlocks.movies.filter((movie) =>
          movie.genres?.some((genre) => genre.toLowerCase().includes("horror")),
        )
      case "space_race":
        // Sci-fi movies
        return newUnlocks.movies.filter((movie) =>
          movie.genres?.some(
            (genre) => genre.toLowerCase().includes("sci-fi") || genre.toLowerCase().includes("science fiction"),
          ),
        )
      case "locked_n_loaded":
        // Action movies
        return newUnlocks.movies.filter((movie) =>
          movie.genres?.some((genre) => genre.toLowerCase().includes("action")),
        )
      case "mr_funny":
        // Comedy movies
        return newUnlocks.movies.filter((movie) =>
          movie.genres?.some((genre) => genre.toLowerCase().includes("comedy")),
        )

      // Actor-specific achievements
      case "fully_cranked":
        // Jason Statham
        return newUnlocks.actors.filter((actor) => actor.name.toLowerCase().includes("jason statham"))
      case "the_rock_star":
        // Dwayne Johnson
        return newUnlocks.actors.filter(
          (actor) =>
            actor.name.toLowerCase().includes("dwayne johnson") || actor.name.toLowerCase().includes("the rock"),
        )
      case "method_actor":
        // Same actor in consecutive games - this is handled elsewhere
        return []

      default:
        return []
    }

    return contributingItems
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

        {/* Newly Completed Achievements Section */}
        {newlyCompletedAchievements.length > 0 && (
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <h3 className="text-xl font-semibold text-center">Achievements Completed!</h3>
            </div>

            <div className="space-y-4">
              {newlyCompletedAchievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="border rounded-lg p-4 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border-amber-200 dark:border-amber-800"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${getAchievementRarityColor(achievement.rarity)}`}
                    >
                      {getIconComponent(achievement.icon, 20)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{achievement.name}</h4>
                        <div
                          className={`text-xs px-2 py-0.5 rounded-full ${getAchievementRarityColor(achievement.rarity)} text-white`}
                        >
                          {getRarityDisplayName(achievement.rarity)}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
                      <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mt-2">
                        Achievement Unlocked! 🎉
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievement Progress Section - Only show if there are in-progress achievements with progress */}
        {inProgressAchievements.length > 0 && (
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-center gap-2">
              <Award className="h-5 w-5 text-blue-500" />
              <h3 className="text-xl font-semibold text-center">Achievement Progress</h3>
            </div>

            <div className="space-y-6">
              {inProgressAchievements.map((achievement) => {
                // Get contributing items for this achievement
                const contributingItems = findContributingItemsFromCurrentGame(achievement.id, history, newUnlocks)

                return (
                  <div key={achievement.id} className="border rounded-lg p-4 bg-muted/5">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${getAchievementRarityColor(achievement.rarity)}`}
                      >
                        {getIconComponent(achievement.icon, 20)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{achievement.name}</h4>
                          <div
                            className={`text-xs px-2 py-0.5 rounded-full ${getAchievementRarityColor(achievement.rarity)} text-white`}
                          >
                            {getRarityDisplayName(achievement.rarity)}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>

                        {achievement.progress && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Progress</span>
                              <span>
                                {achievement.progress.current} / {achievement.progress.target}
                              </span>
                            </div>
                            <Progress
                              value={(achievement.progress.current / achievement.progress.target) * 100}
                              className="h-2"
                            />
                            <p className="text-xs text-green-600 mt-1">
                              +{achievement.gameProgress} progress this game!
                            </p>
                          </div>
                        )}

                        {/* Contributing Items Section - Always visible */}
                        {contributingItems.length > 0 && (
                          <div className="mt-3">
                            <h5 className="text-xs font-medium mb-2">Contributing Items:</h5>
                            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                              {contributingItems.slice(0, 8).map((item) => (
                                <div key={`${item.id}-${item.type}`} className="flex flex-col items-center">
                                  <div className="relative h-12 w-10 rounded-md overflow-hidden shadow-sm">
                                    {item.image ? (
                                      <Image
                                        src={item.image || "/placeholder.svg"}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                      />
                                    ) : (
                                      <div className="h-full w-full bg-muted flex items-center justify-center">
                                        {item.type === "movie" ? (
                                          <Film size={16} className="text-muted-foreground" />
                                        ) : (
                                          <User size={16} className="text-muted-foreground" />
                                        )}
                                      </div>
                                    )}
                                    {item.rarity && <RarityOverlay rarity={item.rarity} showLabel={false} size="xs" />}
                                  </div>
                                  <p className="text-xs text-center mt-1 truncate max-w-[60px]" title={item.name}>
                                    {item.name}
                                  </p>
                                </div>
                              ))}
                              {contributingItems.length > 8 && (
                                <div className="flex flex-col items-center justify-center">
                                  <div className="h-12 w-10 rounded-md bg-muted flex items-center justify-center">
                                    <p className="text-xs font-medium">+{contributingItems.length - 8}</p>
                                  </div>
                                  <p className="text-xs text-center mt-1">more</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-center gap-3 pt-4 pb-6">
        {/* Make both buttons the same width with grid */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-md">
          <AnimatedButton
            variant="outline"
            size="lg"
            onClick={openStats}
            className="flex items-center justify-center gap-2 w-full"
          >
            <BarChart size={16} />
            <span>View Stats</span>
          </AnimatedButton>

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
