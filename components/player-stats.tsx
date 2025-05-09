"use client"

import Link from "next/link"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  Film,
  User,
  Clock,
  Trophy,
  BarChart,
  Star,
  Target,
  Calendar,
  X,
  Award,
  Medal,
  Globe,
  Search,
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
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { clearPlayerHistory, getMostUsedItems, getItemsByRarity } from "@/lib/player-history"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import type { PlayerHistoryItem, Rarity, AccountRank, AccountScore, GameItem } from "@/lib/types"
import { getRarityDisplayName } from "@/lib/rarity"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { RarityOverlay } from "./rarity-overlay"
import { getCompletedDailyChallengeItems } from "@/lib/daily-challenge"
import { updateAchievements, type Achievement, type AchievementCategory, getAllAchievements } from "@/lib/achievements"
import { Progress } from "@/components/ui/progress"

// Add this import at the top
import { resetAchievements } from "@/lib/achievements"

// Add these constants at the top of the file, after the imports
// These represent estimated totals of collectible items in the game
const TOTAL_COLLECTIBLE_MOVIES = 10000
const TOTAL_COLLECTIBLE_ACTORS = 5000

interface PlayerStatsProps {
  onClose: () => void
  mode?: "full" | "simple" // Add mode prop with default to full
}

// Helper function to get color for rarity
function getRarityColor(rarity: string): string {
  switch (rarity) {
    case "legendary":
      return "#F59E0B" // amber-500
    case "epic":
      return "#9333EA" // purple-600
    case "rare":
      return "#4F46E5" // indigo-600
    case "uncommon":
      return "#10B981" // emerald-500
    default:
      return "#6B7280" // gray-500
  }
}

// Helper function to get icon component
function getIconComponent(iconName: string, size = 16) {
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

export default function PlayerStats({ onClose, mode = "full" }: PlayerStatsProps) {
  const [activeTab, setActiveTab] = useState<"most-used" | "collection" | "challenges" | "achievements">("most-used")
  const [activeType, setActiveType] = useState<"movie" | "actor">("movie")
  const [mostUsedItems, setMostUsedItems] = useState<PlayerHistoryItem[]>([])
  const [collectionItems, setCollectionItems] = useState<PlayerHistoryItem[]>([])
  const [activeRarity, setActiveRarity] = useState<Rarity | "all">("all")
  const [accountScore, setAccountScore] = useState<AccountScore>({
    rank: "F",
    points: 0,
    legendaryCount: 0,
    epicCount: 0,
    rareCount: 0,
    uncommonCount: 0,
    commonCount: 0,
    totalItems: 0,
    dailyChallengesCompleted: 0,
    moviesPercentage: 0,
    actorsPercentage: 0,
    totalPercentage: 0,
    moviesCount: 0,
    actorsCount: 0,
  })
  const [dailyChallenges, setDailyChallenges] = useState<Record<string, GameItem>>({})
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [activeAchievementCategory, setActiveAchievementCategory] = useState<AchievementCategory | "all" | "completed">(
    "all",
  )
  const { toast } = useToast()
  const [collectionProgressOpen, setCollectionProgressOpen] = useState(false)

  // Add state for longest chain
  const [longestChain, setLongestChain] = useState(0)

  // Load longest chain from localStorage
  useEffect(() => {
    const storedLongestChain = localStorage.getItem("movieGameLongestChain")
    if (storedLongestChain) {
      setLongestChain(Number.parseInt(storedLongestChain))
    }
  }, [])

  // Then add this function inside the PlayerStats component
  const handleResetAchievements = () => {
    resetAchievements()

    toast({
      title: "Achievements Reset",
      description: "All achievements have been reset for debugging purposes.",
    })

    // Reload achievements
    const updatedAchievements = getAllAchievements()
    setAchievements(updatedAchievements)
  }

  // Load data when component mounts or when tabs change
  useEffect(() => {
    const loadData = async () => {
      try {
        if (activeTab === "most-used") {
          try {
            setMostUsedItems(getMostUsedItems(activeType, 20))
          } catch (error) {
            console.error("Error loading most used items:", error)
            setMostUsedItems([])
          }
        } else if (activeTab === "collection") {
          try {
            setCollectionItems(getItemsByRarity(activeType))
          } catch (error) {
            console.error("Error loading collection items:", error)
            setCollectionItems([])
          }
        } else if (activeTab === "challenges") {
          // Load daily challenges
          try {
            const challenges = await getCompletedDailyChallengeItems()
            setDailyChallenges(challenges || {})
          } catch (error) {
            console.error("Error loading daily challenges:", error)
            setDailyChallenges({})
          }
        } else if (activeTab === "achievements" && mode === "full") {
          // Update and load achievements - wrap in try/catch to prevent crashes
          try {
            // First try to get all achievements as a fallback
            let allAchievements = []
            try {
              allAchievements = getAllAchievements()
            } catch (error) {
              console.error("Error getting all achievements:", error)
              allAchievements = []
            }

            // Then try to update them
            let updatedAchievements = []
            try {
              updatedAchievements = updateAchievements()
            } catch (error) {
              console.error("Error updating achievements:", error)
              updatedAchievements = allAchievements
            }

            setAchievements(updatedAchievements)

            // Log achievement progress for debugging
            console.log("Loaded achievements:", updatedAchievements)

            // Specifically log legendary achievements
            const legendaryHunter = updatedAchievements.find((a) => a?.id === "legendary_hunter")
            const legendaryCollection = updatedAchievements.find((a) => a?.id === "legendary_collection")

            if (legendaryHunter && legendaryHunter.progress) {
              console.log(`Legendary Hunter: ${legendaryHunter.progress.current}/${legendaryHunter.progress.target}`)
            }

            if (legendaryCollection && legendaryCollection.progress) {
              console.log(
                `Legendary Collection: ${legendaryCollection.progress.current}/${legendaryCollection.progress.target}`,
              )
            }
          } catch (error) {
            console.error("Error loading achievements:", error)
            // Set default achievements to prevent UI crashes
            setAchievements([])
          }
        }

        // Calculate account score
        try {
          calculateAccountScore()
        } catch (error) {
          console.error("Error calculating account score:", error)
        }
      } catch (error) {
        console.error("Error loading data:", error)
      }
    }

    loadData()
  }, [activeTab, activeType, mode])

  // Update the calculateAccountScore function to include collection percentages
  const calculateAccountScore = async () => {
    try {
      const movies = getItemsByRarity("movie")
      const actors = getItemsByRarity("actor")
      const allItems = [...movies, ...actors]

      const legendaryCount = allItems.filter((item) => item.rarity === "legendary").length
      const epicCount = allItems.filter((item) => item.rarity === "epic").length
      const rareCount = allItems.filter((item) => item.rarity === "rare").length
      const uncommonCount = allItems.filter((item) => item.rarity === "uncommon").length
      const commonCount = allItems.filter((item) => item.rarity === "common").length
      const totalItems = allItems.length

      // Calculate collection percentages
      const moviesPercentage = ((movies.length / TOTAL_COLLECTIBLE_MOVIES) * 100).toFixed(2)
      const actorsPercentage = ((actors.length / TOTAL_COLLECTIBLE_ACTORS) * 100).toFixed(2)
      const totalPercentage = (
        ((movies.length + actors.length) / (TOTAL_COLLECTIBLE_MOVIES + TOTAL_COLLECTIBLE_ACTORS)) *
        100
      ).toFixed(2)

      // Calculate points
      const points = legendaryCount * 100 + epicCount * 50 + rareCount * 25 + uncommonCount * 10 + commonCount * 1

      // Calculate daily challenges completed
      const challenges = await getCompletedDailyChallengeItems()
      const dailyChallengesCompleted = Object.keys(challenges).length

      // Add bonus points for daily challenges
      const totalPoints = points + dailyChallengesCompleted * 50

      // Determine rank
      let rank: AccountRank = "F"
      if (totalPoints >= 10000) rank = "SS"
      else if (totalPoints >= 7500) rank = "S+"
      else if (totalPoints >= 5000) rank = "S"
      else if (totalPoints >= 4000) rank = "S-"
      else if (totalPoints >= 3000) rank = "A+"
      else if (totalPoints >= 2000) rank = "A"
      else if (totalPoints >= 1500) rank = "A-"
      else if (totalPoints >= 1200) rank = "B+"
      else if (totalPoints >= 900) rank = "B"
      else if (totalPoints >= 750) rank = "B-"
      else if (totalPoints >= 600) rank = "C+"
      else if (totalPoints >= 450) rank = "C"
      else if (totalPoints >= 350) rank = "C-"
      else if (totalPoints >= 250) rank = "D+"
      else if (totalPoints >= 200) rank = "D"
      else if (totalPoints >= 150) rank = "D-"
      else if (totalPoints >= 100) rank = "F+"
      else if (totalPoints >= 50) rank = "F"

      setAccountScore({
        rank,
        points: totalPoints,
        legendaryCount,
        epicCount,
        rareCount,
        uncommonCount,
        commonCount,
        totalItems,
        dailyChallengesCompleted,
        moviesPercentage: Number.parseFloat(moviesPercentage),
        actorsPercentage: Number.parseFloat(actorsPercentage),
        totalPercentage: Number.parseFloat(totalPercentage),
        moviesCount: movies.length,
        actorsCount: actors.length,
      })
    } catch (error) {
      console.error("Error calculating account score:", error)
    }
  }

  // Filter collection items by rarity - add null check
  const filteredCollectionItems =
    activeRarity === "all" ? collectionItems : collectionItems.filter((item) => item.rarity === activeRarity)

  // Filter achievements by category - add null checks and default to empty array
  const filteredAchievements =
    activeAchievementCategory === "all"
      ? achievements || []
      : activeAchievementCategory === "completed"
        ? (achievements || []).filter((achievement) => achievement.isUnlocked)
        : (achievements || []).filter((achievement) => achievement.category === activeAchievementCategory)

  // Add these computed values after the filteredAchievements definition - add null checks
  const completedAchievements = (achievements || []).filter((a) => a.isUnlocked)
  const filteredInProgressAchievements =
    activeAchievementCategory === "completed" ? [] : filteredAchievements.filter((a) => !a.isUnlocked)

  const handleClearHistory = () => {
    clearPlayerHistory()
    setMostUsedItems([])
    setCollectionItems([])

    toast({
      title: "History Cleared",
      description: "Your movie game history has been cleared.",
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Count items by rarity - add null check
  const rarityCount = {
    legendary: collectionItems.filter((item) => item.rarity === "legendary").length,
    epic: collectionItems.filter((item) => item.rarity === "epic").length,
    rare: collectionItems.filter((item) => item.rarity === "rare").length,
    uncommon: collectionItems.filter((item) => item.rarity === "uncommon").length,
    common: collectionItems.filter((item) => item.rarity === "common" || !item.rarity).length,
    all: collectionItems.length,
  }

  // Count achievements by category - add null check
  const achievementCounts = {
    all: achievements?.length || 0,
    rare: achievements?.filter((a) => a.category === "rare").length || 0,
    gameplay: achievements?.filter((a) => a.category === "gameplay").length || 0,
    genre: achievements?.filter((a) => a.category === "genre").length || 0,
    actor: achievements?.filter((a) => a.category === "actor").length || 0,
    unlocked: achievements?.filter((a) => a.isUnlocked).length || 0,
  }

  // Get rank color
  const getRankColor = (rank: AccountRank): string => {
    // Base colors for each rank tier
    switch (rank) {
      case "SS":
        return "text-rose-400 border-rose-400" // Special color for SS rank
      case "S+":
      case "S":
      case "S-":
        return "text-amber-500 border-amber-500" // Gold for S ranks
      case "A+":
      case "A":
      case "A-":
        return "text-purple-500 border-purple-500" // Purple for A ranks
      case "B+":
      case "B":
      case "B-":
        return "text-blue-500 border-blue-500" // Blue for B ranks
      case "C+":
      case "C":
      case "C-":
        return "text-green-500 border-green-500" // Green for C ranks
      case "D+":
      case "D":
      case "D-":
        return "text-orange-500 border-orange-500" // Orange for D ranks
      case "F+":
      case "F":
      case "F-":
        return "text-gray-500 border-gray-500" // Gray for F ranks
      default:
        return "text-gray-500 border-gray-500"
    }
  }

  // Get achievement rarity color
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

  return (
    <Card className="w-full border-0 rounded-none sm:rounded-lg sm:border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Your Movie Game Stats
          </span>
          <div className="flex items-center gap-2">
            {mode === "full" && (
              <Button variant="outline" size="sm" onClick={handleResetAchievements}>
                Reset Achievements
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  Clear History
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete your movie game history. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearHistory}>Clear History</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Account Score Card */}
        <div className="mb-6 p-4 border rounded-lg bg-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Collection Score</h3>
              <p className="text-sm text-muted-foreground">Based on your collection rarity</p>
            </div>
            <div
              className={`text-4xl font-bold w-14 h-14 rounded-full border-4 flex items-center justify-center ${getRankColor(accountScore.rank)}`}
              style={{
                background: accountScore.rank === "SS" ? "linear-gradient(135deg, #fef3c7, #f87171)" : "",
                boxShadow:
                  accountScore.rank === "SS" || accountScore.rank === "S+" ? "0 0 10px rgba(251, 191, 36, 0.6)" : "",
              }}
            >
              {accountScore.rank.includes("+") ? (
                <span className="flex items-center justify-center">
                  <span>{accountScore.rank.charAt(0)}</span>
                  <sup className="text-lg -ml-1">+</sup>
                </span>
              ) : accountScore.rank.includes("-") ? (
                <span className="flex items-center justify-center">
                  <span>{accountScore.rank.charAt(0)}</span>
                  <sup className="text-lg -ml-1">-</sup>
                </span>
              ) : (
                accountScore.rank
              )}
            </div>
          </div>

          {/* Stats layout with Longest Chain next to Legendary Pulls */}
          <div className="mt-4 grid grid-cols-1 gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="text-xl font-semibold">{accountScore.points}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pulls</p>
                <p className="text-xl font-semibold">{accountScore.totalItems}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Legendary Pulls</p>
                <p className="text-xl font-semibold text-amber-500">{accountScore.legendaryCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Longest Chain</p>
                <p className="text-xl font-semibold text-blue-500">{longestChain}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Achievements</p>
                <p className="text-xl font-semibold text-green-600">{achievementCounts.unlocked}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Daily Challenges</p>
                <p className="text-xl font-semibold text-red-500">{accountScore.dailyChallengesCompleted}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <button
              onClick={() => setCollectionProgressOpen(!collectionProgressOpen)}
              className="flex items-center justify-between w-full text-sm font-medium mb-2"
            >
              <span>Collection Progress</span>
              {collectionProgressOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>

            {collectionProgressOpen && (
              <div className="space-y-3 mt-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Total Collection ({accountScore.totalPercentage}%)</span>
                    <span>
                      {accountScore.totalItems} / {TOTAL_COLLECTIBLE_MOVIES + TOTAL_COLLECTIBLE_ACTORS}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                      style={{ width: `${accountScore.totalPercentage}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Movies ({accountScore.moviesPercentage}%)</span>
                    <span>
                      {accountScore.moviesCount} / {TOTAL_COLLECTIBLE_MOVIES}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-red-500"
                      style={{ width: `${accountScore.moviesPercentage}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Actors ({accountScore.actorsPercentage}%)</span>
                    <span>
                      {accountScore.actorsCount} / {TOTAL_COLLECTIBLE_ACTORS}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-600"
                      style={{ width: `${accountScore.actorsPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <Tabs
          defaultValue="most-used"
          onValueChange={(value) => setActiveTab(value as "most-used" | "collection" | "challenges" | "achievements")}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div className="overflow-x-auto pb-2 hide-scrollbar w-full sm:w-auto">
              <TabsList className="w-max min-w-full">
                <TabsTrigger value="most-used" className="flex items-center gap-1">
                  <Trophy className="h-4 w-4" />
                  <span>Most Used</span>
                </TabsTrigger>
                <TabsTrigger value="collection" className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  <span>Pulls</span>
                </TabsTrigger>
                <TabsTrigger value="challenges" className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  <span>Challenges</span>
                </TabsTrigger>
                {mode === "full" && (
                  <TabsTrigger value="achievements" className="flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    <span>Achievements</span>
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            {activeTab !== "challenges" && (mode === "simple" || activeTab !== "achievements") && (
              <div className="flex gap-2 w-full sm:w-auto justify-center sm:justify-start">
                <Button
                  size="sm"
                  variant={activeType === "movie" ? "default" : "outline"}
                  onClick={() => setActiveType("movie")}
                  className="flex items-center gap-1"
                >
                  <Film className="h-4 w-4" />
                  <span>Movies</span>
                </Button>
                <Button
                  size="sm"
                  variant={activeType === "actor" ? "default" : "outline"}
                  onClick={() => setActiveType("actor")}
                  className="flex items-center gap-1"
                >
                  <User className="h-4 w-4" />
                  <span>Actors</span>
                </Button>
              </div>
            )}
          </div>

          <TabsContent value="most-used" className="mt-0">
            {mostUsedItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {mostUsedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col items-center bg-muted/20 rounded-lg p-2 hover:bg-muted/40 transition-colors"
                  >
                    <div className="relative h-32 w-24 mb-2 rounded-md overflow-hidden shadow-sm">
                      {item.image ? (
                        <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="h-full w-full bg-muted flex items-center justify-center">
                          {activeType === "movie" ? (
                            <Film size={24} className="text-muted-foreground" />
                          ) : (
                            <User size={24} className="text-muted-foreground" />
                          )}
                        </div>
                      )}
                      {item.rarity && item.rarity !== "common" && (
                        <RarityOverlay rarity={item.rarity} showLabel={true} />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-sm truncate max-w-[120px]" title={item.name}>
                        {item.name}
                      </p>
                      <p className="text-xs font-medium">
                        Used {item.count} time{item.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No {activeType} usage data found.</p>
                <p className="text-sm mt-2">Play some games to see your most used {activeType}s.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="collection" className="mt-0">
            {/* Rarity filter buttons */}
            <div className="flex flex-wrap gap-2 mb-4 justify-center">
              <Button
                size="sm"
                variant={activeRarity === "all" ? "default" : "outline"}
                onClick={() => setActiveRarity("all")}
                className="text-xs"
              >
                All ({rarityCount.all})
              </Button>
              <Button
                size="sm"
                variant={activeRarity === "legendary" ? "default" : "outline"}
                onClick={() => setActiveRarity("legendary")}
                className="text-xs bg-gradient-to-r from-amber-500 to-amber-700 border-amber-600 hover:from-amber-600 hover:to-amber-800"
              >
                Legendary ({rarityCount.legendary})
              </Button>
              <Button
                size="sm"
                variant={activeRarity === "epic" ? "default" : "outline"}
                onClick={() => setActiveRarity("epic")}
                className="text-xs bg-gradient-to-r from-purple-500 to-purple-700 border-purple-600 hover:from-purple-600 hover:to-purple-800"
              >
                Epic ({rarityCount.epic})
              </Button>
              <Button
                size="sm"
                variant={activeRarity === "rare" ? "default" : "outline"}
                onClick={() => setActiveRarity("rare")}
                className="text-xs bg-gradient-to-r from-blue-500 to-indigo-700 border-indigo-600 hover:from-blue-600 hover:to-indigo-800"
              >
                Rare ({rarityCount.rare})
              </Button>
              <Button
                size="sm"
                variant={activeRarity === "uncommon" ? "default" : "outline"}
                onClick={() => setActiveRarity("uncommon")}
                className="text-xs bg-gradient-to-r from-green-500 to-green-700 border-green-600 hover:from-green-600 hover:to-green-800"
              >
                Uncommon ({rarityCount.uncommon})
              </Button>
              <Button
                size="sm"
                variant={activeRarity === "common" ? "default" : "outline"}
                onClick={() => setActiveRarity("common")}
                className="text-xs"
              >
                Common ({rarityCount.common})
              </Button>
            </div>

            {filteredCollectionItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredCollectionItems.map((item) => (
                  <div key={item.id} className="flex flex-col items-center rounded-lg p-2 border transition-colors">
                    <div className="relative h-32 w-24 mb-2 rounded-md overflow-hidden shadow-sm">
                      {item.image ? (
                        <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="h-full w-full bg-muted flex items-center justify-center">
                          {activeType === "movie" ? (
                            <Film size={24} className="text-muted-foreground" />
                          ) : (
                            <User size={24} className="text-muted-foreground" />
                          )}
                        </div>
                      )}
                      {item.rarity && item.rarity !== "common" && (
                        <RarityOverlay rarity={item.rarity} showLabel={true} />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-sm truncate max-w-[120px]" title={item.name}>
                        {item.name}
                      </p>
                      <p className="text-xs font-medium">
                        Found {item.count} time{item.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>
                  No {activeRarity !== "all" ? getRarityDisplayName(activeRarity as Rarity) : ""} {activeType}s found.
                </p>
                <p className="text-sm mt-2">Play more games to discover new {activeType} pulls.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="challenges" className="mt-0">
            <div className="mb-4 text-center">
              <h3 className="text-lg font-medium flex items-center justify-center gap-2">
                <Target className="h-5 w-5 text-red-500" />
                <span>Daily Challenges Completed</span>
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Find the daily challenge item in your games to earn bonus points!
              </p>
            </div>

            {Object.keys(dailyChallenges).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(dailyChallenges)
                  .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
                  .map(([date, item]) => (
                    <div key={date} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{formatDate(date)}</span>
                        </div>
                        <div className="bg-red-100 text-red-800 text-xs py-1 px-2 rounded-full">
                          Challenge Completed
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="relative h-24 w-20 rounded-md overflow-hidden shadow-md">
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
                                <Film size={20} className="text-muted-foreground" />
                              ) : (
                                <User size={20} className="text-muted-foreground" />
                              )}
                            </div>
                          )}
                          {item.rarity && (
                            <RarityOverlay rarity={item.rarity} showLabel={true} isDailyChallenge={true} />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-muted-foreground capitalize">{item.type}</p>
                          {item.rarity && (
                            <p className="text-sm font-medium mt-1" style={{ color: getRarityColor(item.rarity) }}>
                              {getRarityDisplayName(item.rarity)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No daily challenges completed yet.</p>
                <p className="text-sm mt-2">Complete daily challenges to see them here.</p>
              </div>
            )}
          </TabsContent>

          {mode === "full" && activeTab === "achievements" && (
            <div className="mb-4 text-center">
              <h3 className="text-lg font-medium flex items-center justify-center gap-2">
                <Award className="h-5 w-5 text-amber-500" />
                <span>Achievements</span>
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Unlock achievements by completing special tasks in the game!
              </p>
              <div className="mt-3 text-sm font-medium">
                <span className="text-green-600">{achievementCounts.unlocked}</span> of {achievementCounts.all}{" "}
                achievements unlocked
              </div>
            </div>
          )}

          {/* Add a try-catch wrapper around the achievement rendering */}
          {mode === "full" && activeTab === "achievements" && (
            <div className="flex flex-wrap gap-2 mb-4 justify-center">
              {(() => {
                try {
                  return (
                    <>
                      <Button
                        size="sm"
                        variant={activeAchievementCategory === "all" ? "default" : "outline"}
                        onClick={() => setActiveAchievementCategory("all")}
                        className="text-xs"
                      >
                        All ({achievementCounts.all})
                      </Button>
                      <Button
                        size="sm"
                        variant={activeAchievementCategory === "rare" ? "default" : "outline"}
                        onClick={() => setActiveAchievementCategory("rare")}
                        className="text-xs"
                      >
                        Rare ({achievementCounts.rare})
                      </Button>
                      <Button
                        size="sm"
                        variant={activeAchievementCategory === "gameplay" ? "default" : "outline"}
                        onClick={() => setActiveAchievementCategory("gameplay")}
                        className="text-xs"
                      >
                        Gameplay ({achievementCounts.gameplay})
                      </Button>
                      <Button
                        size="sm"
                        variant={activeAchievementCategory === "genre" ? "default" : "outline"}
                        onClick={() => setActiveAchievementCategory("genre")}
                        className="text-xs"
                      >
                        Genre ({achievementCounts.genre})
                      </Button>
                      <Button
                        size="sm"
                        variant={activeAchievementCategory === "actor" ? "default" : "outline"}
                        onClick={() => setActiveAchievementCategory("actor")}
                        className="text-xs"
                      >
                        Actor ({achievementCounts.actor})
                      </Button>
                      <Button
                        size="sm"
                        variant={activeAchievementCategory === "completed" ? "default" : "outline"}
                        onClick={() => setActiveAchievementCategory("completed")}
                        className="text-xs"
                      >
                        Completed ({achievementCounts.unlocked})
                      </Button>
                    </>
                  )
                } catch (error) {
                  console.error("Error rendering achievement buttons:", error)
                  return <p className="text-red-500">Error loading achievement categories</p>
                }
              })()}
            </div>
          )}

          {mode === "full" && (
            <TabsContent value="achievements" className="mt-0">
              {activeAchievementCategory === "completed" && completedAchievements.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="text-base font-medium mb-3 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <span>Completed Achievements</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {completedAchievements.map((achievement) => (
                      <div key={achievement.id} className="border rounded-lg p-3 bg-muted/20">
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
                            <div className="mt-1 pt-1 border-t text-xs text-green-600 font-medium flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              <span>Completed!</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : activeAchievementCategory === "completed" ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No completed achievements yet.</p>
                  <p className="text-sm mt-2">Keep playing to unlock achievements!</p>
                </div>
              ) : null}

              {/* In-Progress Achievements */}
              {filteredInProgressAchievements.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="text-base font-medium mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span>In Progress</span>
                  </h4>
                  {filteredInProgressAchievements.map((achievement) => (
                    <div key={achievement.id} className="border rounded-lg p-4 bg-muted/5">
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${getAchievementRarityColor(achievement.rarity)}`}
                        >
                          {getIconComponent(achievement.icon, 24)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{achievement.name}</h4>
                            <div
                              className={`text-xs px-2 py-1 rounded-full ${getAchievementRarityColor(achievement.rarity)} text-white`}
                            >
                              {getRarityDisplayName(achievement.rarity)}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>

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
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeAchievementCategory !== "completed" ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No in-progress achievements found in this category.</p>
                  <p className="text-sm mt-2">Play more games to make progress!</p>
                </div>
              ) : null}
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  )
}
