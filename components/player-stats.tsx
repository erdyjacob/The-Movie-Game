"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Film, User, Clock, Trophy, BarChart, Star, Target, Calendar, X } from "lucide-react"
import { clearPlayerHistory, getMostUsedItems, getRecentItems, getItemsByRarity } from "@/lib/player-history"
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

// Add these constants at the top of the file, after the imports
// These represent estimated totals of collectible items in the game
const TOTAL_COLLECTIBLE_MOVIES = 10000
const TOTAL_COLLECTIBLE_ACTORS = 5000

interface PlayerStatsProps {
  onClose: () => void
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

export default function PlayerStats({ onClose }: PlayerStatsProps) {
  const [activeTab, setActiveTab] = useState<"recent" | "most-used" | "collection" | "challenges">("recent")
  const [activeType, setActiveType] = useState<"movie" | "actor">("movie")
  const [recentItems, setRecentItems] = useState<PlayerHistoryItem[]>([])
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

  // Load data when component mounts or when tabs change
  useEffect(() => {
    const loadData = async () => {
      if (activeTab === "recent") {
        setRecentItems(getRecentItems(activeType, 20))
      } else if (activeTab === "most-used") {
        setMostUsedItems(getMostUsedItems(activeType, 20))
      } else if (activeTab === "collection") {
        setCollectionItems(getItemsByRarity(activeType))
      } else if (activeTab === "challenges") {
        // Load daily challenges
        const challenges = await getCompletedDailyChallengeItems()
        setDailyChallenges(challenges)
      }

      // Calculate account score
      calculateAccountScore()
    }

    loadData()
  }, [activeTab, activeType])

  // Update the calculateAccountScore function to include collection percentages
  const calculateAccountScore = async () => {
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
    if (totalPoints >= 2000) rank = "S"
    else if (totalPoints >= 1000) rank = "A"
    else if (totalPoints >= 500) rank = "B"
    else if (totalPoints >= 250) rank = "C"
    else if (totalPoints >= 100) rank = "D"

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
  }

  // Filter collection items by rarity
  const filteredCollectionItems =
    activeRarity === "all" ? collectionItems : collectionItems.filter((item) => item.rarity === activeRarity)

  const handleClearHistory = () => {
    clearPlayerHistory()
    setRecentItems([])
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

  // Count items by rarity
  const rarityCount = {
    legendary: collectionItems.filter((item) => item.rarity === "legendary").length,
    epic: collectionItems.filter((item) => item.rarity === "epic").length,
    rare: collectionItems.filter((item) => item.rarity === "rare").length,
    uncommon: collectionItems.filter((item) => item.rarity === "uncommon").length,
    all: collectionItems.length,
  }

  // Get rank color
  const getRankColor = (rank: AccountRank): string => {
    switch (rank) {
      case "S":
        return "text-amber-500 border-amber-500"
      case "A":
        return "text-purple-500 border-purple-500"
      case "B":
        return "text-blue-500 border-blue-500"
      case "C":
        return "text-green-500 border-green-500"
      case "D":
        return "text-orange-500 border-orange-500"
      case "F":
        return "text-gray-500 border-gray-500"
      default:
        return "text-gray-500 border-gray-500"
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
            >
              {accountScore.rank}
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Points</p>
              <p className="text-xl font-semibold">{accountScore.points}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Pulls</p>
              <p className="text-xl font-semibold">{accountScore.totalItems}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Legendary Pulls</p>
              <p className="text-xl font-semibold text-amber-500">{accountScore.legendaryCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Daily Challenges</p>
              <p className="text-xl font-semibold text-red-500">{accountScore.dailyChallengesCompleted}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Collection Progress</h4>
            <div className="space-y-3">
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
          </div>
        </div>

        <Tabs
          defaultValue="recent"
          onValueChange={(value) => setActiveTab(value as "recent" | "most-used" | "collection" | "challenges")}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div className="overflow-x-auto pb-2 hide-scrollbar w-full sm:w-auto">
              <TabsList className="w-max min-w-full">
                <TabsTrigger value="recent" className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Recent</span>
                </TabsTrigger>
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

          <TabsContent value="recent" className="mt-0">
            {recentItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {recentItems.map((item) => (
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
                      <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No recent {activeType}s found.</p>
                <p className="text-sm mt-2">Play some games to see your history.</p>
              </div>
            )}
          </TabsContent>

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
