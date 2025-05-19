"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Film, User, Trophy, BarChart, Star, Target, Calendar, X, ChevronUp, ChevronDown } from "lucide-react"
import { getMostUsedItems, getItemsByRarity, loadPlayerHistory } from "@/lib/player-history"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import Link from "next/link"
import type { PlayerHistoryItem, Rarity, AccountScore, GameItem } from "@/lib/types"
import { getRarityDisplayName } from "@/lib/rarity"
import { RarityOverlay } from "./rarity-overlay"
import { getCompletedDailyChallengeItems } from "@/lib/daily-challenge"
import ConnectionWebButton from "./connection-web-button"
import { useUser } from "@/contexts/user-context"
import { updateLeaderboardWithTotalPoints, getPlayerLeaderboardRank } from "@/lib/leaderboard"

// Add the import for the rank calculator
import { calculateAccountScore, getRankColor } from "@/lib/rank-calculator"

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

export default function PlayerStats({ onClose, mode = "full" }: PlayerStatsProps) {
  const [activeTab, setActiveTab] = useState<"most-used" | "collection" | "challenges">("most-used")
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
  const { toast } = useToast()
  const [collectionProgressOpen, setCollectionProgressOpen] = useState(false)
  const { username } = useUser()

  // Add state for longest chain
  const [longestChain, setLongestChain] = useState(0)

  // Add state for player's leaderboard rank
  const [leaderboardRank, setLeaderboardRank] = useState<number | null>(null)

  // Load longest chain from localStorage
  useEffect(() => {
    const storedLongestChain = localStorage.getItem("movieGameLongestChain")
    if (storedLongestChain) {
      setLongestChain(Number.parseInt(storedLongestChain))
    }
  }, [])

  // Add this function to the PlayerStats component
  const syncHistoryToServer = async () => {
    if (!username) return

    try {
      const history = loadPlayerHistory()
      const userId = localStorage.getItem("movieGameUserId")

      if (!userId) {
        console.error("No user ID found in localStorage")
        return
      }

      const response = await fetch("/api/player/sync-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          username,
          playerHistory: history,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to sync history: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        // Refresh account score and leaderboard rank
        await calculatePlayerAccountScore()
      }
    } catch (error) {
      console.error("Error syncing history to server:", error)
    }
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
        }

        // Add this line to sync history to server
        if (username) {
          await syncHistoryToServer()
        }

        // Calculate account score
        try {
          await calculatePlayerAccountScore()
        } catch (error) {
          console.error("Error calculating account score:", error)
        }
      } catch (error) {
        console.error("Error loading data:", error)
      }
    }

    loadData()
  }, [activeTab, activeType, mode, username])

  // This function calculates scores but doesn't persist them to the server
  const calculatePlayerAccountScore = async () => {
    try {
      const movies = getItemsByRarity("movie")
      const actors = getItemsByRarity("actor")

      const allItems = [...movies, ...actors]

      const legendaryCount = allItems.filter((item) => item.rarity === "legendary").length
      const epicCount = allItems.filter((item) => item.rarity === "epic").length
      const rareCount = allItems.filter((item) => item.rarity === "rare").length
      const uncommonCount = allItems.filter((item) => item.rarity === "uncommon").length
      const commonCount = allItems.filter((item) => item.rarity === "common").length

      // Calculate daily challenges completed
      const challenges = await getCompletedDailyChallengeItems()
      const dailyChallengesCompleted = Object.keys(challenges).length

      // Use the utility function to calculate the account score
      const newAccountScore = calculateAccountScore(
        legendaryCount,
        epicCount,
        rareCount,
        uncommonCount,
        commonCount,
        dailyChallengesCompleted,
        movies.length,
        actors.length,
      )

      // Ensure rank is defined before setting the account score
      if (!newAccountScore.rank) {
        console.error("Account score rank is undefined, using default 'F'")
        newAccountScore.rank = "F"
      }

      setAccountScore(newAccountScore)

      // If the user has a username, update their leaderboard entry and get their rank
      if (username) {
        try {
          await updateLeaderboardWithTotalPoints(username, newAccountScore)
          const rank = await getPlayerLeaderboardRank(username)
          setLeaderboardRank(rank)
        } catch (error) {
          console.error("Error updating leaderboard:", error)
        }
      }
    } catch (error) {
      console.error("Error calculating account score:", error)
    }
  }

  // Filter collection items by rarity - add null check
  const filteredCollectionItems =
    activeRarity === "all" ? collectionItems : collectionItems.filter((item) => item.rarity === activeRarity)

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

  // Ensure rank is defined before using it
  const rankDisplay = accountScore?.rank || "F"
  const rankColorClass = getRankColor(rankDisplay)

  return (
    <Card className="w-full border-0 rounded-none sm:rounded-lg sm:border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Your Movie Game Stats
          </span>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Account Score Card */}
        <div className="mb-6 p-4 border rounded-lg bg-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Collection Score</h3>
              <p className="text-sm text-muted-foreground">Based on your collection rarity</p>

              {username && leaderboardRank !== null && (
                <div className="flex justify-between items-center mt-3">
                  <p className="text-base">
                    <span className="text-amber-500 font-semibold">#{leaderboardRank}</span> in the world
                  </p>
                  <div className="flex-grow"></div>
                  <Link href="/leaderboard" className="text-sm text-blue-600 hover:underline ml-8">
                    View Leaderboard
                  </Link>
                </div>
              )}
            </div>
            <div
              className={`text-4xl font-bold w-14 h-14 rounded-full border-4 flex items-center justify-center ${rankColorClass}`}
              style={{
                background: rankDisplay === "SS" ? "linear-gradient(135deg, #fef3c7, #f87171)" : "",
                boxShadow: rankDisplay === "SS" || rankDisplay === "S+" ? "0 0 10px rgba(251, 191, 36, 0.6)" : "",
              }}
            >
              {rankDisplay.includes("+") ? (
                <span className="flex items-center justify-center">
                  <span>{rankDisplay.charAt(0)}</span>
                  <sup className="text-lg -ml-1">+</sup>
                </span>
              ) : rankDisplay.includes("-") ? (
                <span className="flex items-center justify-center">
                  <span>{rankDisplay.charAt(0)}</span>
                  <sup className="text-lg -ml-1">-</sup>
                </span>
              ) : (
                rankDisplay
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
                <p className="text-sm text-muted-foreground">Daily Challenges</p>
                <p className="text-xl font-semibold text-red-500">{accountScore.dailyChallengesCompleted}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Collection %</p>
                <p className="text-xl font-semibold text-green-500">
                  {accountScore.totalPercentage?.toFixed(2) || "0.00"}%
                </p>
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
                    <span>Total Collection ({accountScore.totalPercentage?.toFixed(2) || "0.00"}%)</span>
                    <span>
                      {accountScore.totalItems} / {TOTAL_COLLECTIBLE_MOVIES + TOTAL_COLLECTIBLE_ACTORS}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                      style={{ width: `${accountScore.totalPercentage || 0}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Movies ({accountScore.moviesPercentage?.toFixed(2) || "0.00"}%)</span>
                    <span>
                      {accountScore.moviesCount || 0} / {TOTAL_COLLECTIBLE_MOVIES}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-red-500"
                      style={{ width: `${accountScore.moviesPercentage || 0}%` }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Actors ({accountScore.actorsPercentage?.toFixed(2) || "0.00"}%)</span>
                    <span>
                      {accountScore.actorsCount || 0} / {TOTAL_COLLECTIBLE_ACTORS}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-600"
                      style={{ width: `${accountScore.actorsPercentage || 0}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4">
              <ConnectionWebButton className="w-full" />
            </div>
          </div>
        </div>

        <Tabs
          defaultValue="most-used"
          onValueChange={(value) => setActiveTab(value as "most-used" | "collection" | "challenges")}
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
              </TabsList>
            </div>

            {activeTab !== "challenges" && (
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
        </Tabs>
      </CardContent>
    </Card>
  )
}
