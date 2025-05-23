import type { Achievement, AccountScore } from "./types"
import { loadConnections } from "./connection-tracking"
import { loadPlayerHistory } from "./player-history"

export const ACHIEVEMENTS: Omit<Achievement, "progress" | "unlocked" | "unlockedAt">[] = [
  {
    id: "100k_club",
    name: "100,000 Club",
    description: "Reach a collection score of 100,000",
    requirement: 100000,
    rarity: "legendary",
    category: "milestone",
  },
  {
    id: "50k_club",
    name: "50,000 Club",
    description: "Reach a collection score of 50,000",
    requirement: 50000,
    rarity: "epic",
    category: "milestone",
  },
  {
    id: "top_dog",
    name: "Top Dog",
    description: "Reach the #1 leaderboard spot",
    requirement: 1,
    rarity: "legendary",
    category: "skill",
  },
  {
    id: "treasure_hunter",
    name: "Treasure Hunter",
    description: "Discover 50 legendary pulls",
    requirement: 50,
    rarity: "epic",
    category: "collection",
  },
  {
    id: "networker",
    name: "Networker",
    description: "Have an actor or movie with 10+ connections",
    requirement: 10,
    rarity: "rare",
    category: "discovery",
  },
  {
    id: "fully_cranked",
    name: "Fully Cranked",
    description: "Use Jason Statham 10 times",
    requirement: 10,
    rarity: "uncommon",
    category: "discovery",
  },
  {
    id: "power_user",
    name: "Power User",
    description: "Finish 10 games",
    requirement: 10,
    rarity: "uncommon",
    category: "milestone",
  },
  {
    id: "power_user_ii",
    name: "Power User II",
    description: "Play the game on 10 different days",
    requirement: 10,
    rarity: "rare",
    category: "milestone",
  },
  {
    id: "treasure_hunter_ii",
    name: "Treasure Hunter II",
    description: "Discover 100 legendary pulls",
    requirement: 100,
    rarity: "legendary",
    category: "collection",
  },
  {
    id: "collector",
    name: "Collector",
    description: "Reach a collection percentage of 5%",
    requirement: 5,
    rarity: "rare",
    category: "collection",
  },
]

export function initializeAchievements(): Achievement[] {
  return ACHIEVEMENTS.map((achievement) => ({
    ...achievement,
    progress: 0,
    unlocked: false,
    unlockedAt: undefined,
  }))
}

export function checkAchievements(
  achievements: Achievement[],
  accountScore: AccountScore,
  leaderboardRank: number | null,
): { achievements: Achievement[]; newlyUnlocked: Achievement[] } {
  const updated = [...achievements]
  const newlyUnlocked: Achievement[] = []

  // Check 50k Club
  const achievement50k = updated.find((a) => a.id === "50k_club")
  if (achievement50k) {
    achievement50k.progress = Math.min(accountScore.points, achievement50k.requirement)
    if (accountScore.points >= achievement50k.requirement && !achievement50k.unlocked) {
      achievement50k.unlocked = true
      achievement50k.unlockedAt = new Date().toISOString()
      newlyUnlocked.push(achievement50k)
    }
  }

  // Check 100k Club
  const achievement100k = updated.find((a) => a.id === "100k_club")
  if (achievement100k) {
    achievement100k.progress = Math.min(accountScore.points, achievement100k.requirement)
    if (accountScore.points >= achievement100k.requirement && !achievement100k.unlocked) {
      achievement100k.unlocked = true
      achievement100k.unlockedAt = new Date().toISOString()
      newlyUnlocked.push(achievement100k)
    }
  }

  // Check Top Dog
  const achievementTopDog = updated.find((a) => a.id === "top_dog")
  if (achievementTopDog && leaderboardRank !== null) {
    achievementTopDog.progress = leaderboardRank === 1 ? 1 : 0
    if (leaderboardRank === 1 && !achievementTopDog.unlocked) {
      achievementTopDog.unlocked = true
      achievementTopDog.unlockedAt = new Date().toISOString()
      newlyUnlocked.push(achievementTopDog)
    }
  }

  // Check Treasure Hunter
  const achievementTreasureHunter = updated.find((a) => a.id === "treasure_hunter")
  if (achievementTreasureHunter) {
    achievementTreasureHunter.progress = Math.min(accountScore.legendaryCount, achievementTreasureHunter.requirement)
    if (accountScore.legendaryCount >= achievementTreasureHunter.requirement && !achievementTreasureHunter.unlocked) {
      achievementTreasureHunter.unlocked = true
      achievementTreasureHunter.unlockedAt = new Date().toISOString()
      newlyUnlocked.push(achievementTreasureHunter)
    }
  }

  // Check Networker
  const achievementNetworker = updated.find((a) => a.id === "networker")
  if (achievementNetworker) {
    // Get the most connected node from the connection web
    const mostConnections = getMostConnectedNodeCount()
    achievementNetworker.progress = Math.min(mostConnections, achievementNetworker.requirement)

    if (mostConnections >= achievementNetworker.requirement && !achievementNetworker.unlocked) {
      achievementNetworker.unlocked = true
      achievementNetworker.unlockedAt = new Date().toISOString()
      newlyUnlocked.push(achievementNetworker)
    }
  }

  // Check Fully Cranked (Jason Statham usage)
  const achievementFullyCranked = updated.find((a) => a.id === "fully_cranked")
  if (achievementFullyCranked) {
    const jasonStathamUsage = getJasonStathamUsageCount()
    achievementFullyCranked.progress = Math.min(jasonStathamUsage, achievementFullyCranked.requirement)
    if (jasonStathamUsage >= achievementFullyCranked.requirement && !achievementFullyCranked.unlocked) {
      achievementFullyCranked.unlocked = true
      achievementFullyCranked.unlockedAt = new Date().toISOString()
      newlyUnlocked.push(achievementFullyCranked)
    }
  }

  // Check Power User (games completed)
  const achievementPowerUser = updated.find((a) => a.id === "power_user")
  if (achievementPowerUser) {
    const gamesCompleted = getCompletedGamesCount()
    achievementPowerUser.progress = Math.min(gamesCompleted, achievementPowerUser.requirement)
    if (gamesCompleted >= achievementPowerUser.requirement && !achievementPowerUser.unlocked) {
      achievementPowerUser.unlocked = true
      achievementPowerUser.unlockedAt = new Date().toISOString()
      newlyUnlocked.push(achievementPowerUser)
    }
  }

  // Check Power User II (unique days played)
  const achievementPowerUserII = updated.find((a) => a.id === "power_user_ii")
  if (achievementPowerUserII) {
    const uniqueDaysPlayed = getUniqueDaysPlayedCount()
    achievementPowerUserII.progress = Math.min(uniqueDaysPlayed, achievementPowerUserII.requirement)
    if (uniqueDaysPlayed >= achievementPowerUserII.requirement && !achievementPowerUserII.unlocked) {
      achievementPowerUserII.unlocked = true
      achievementPowerUserII.unlockedAt = new Date().toISOString()
      newlyUnlocked.push(achievementPowerUserII)
    }
  }

  // Check Treasure Hunter II
  const achievementTreasureHunterII = updated.find((a) => a.id === "treasure_hunter_ii")
  if (achievementTreasureHunterII) {
    achievementTreasureHunterII.progress = Math.min(
      accountScore.legendaryCount,
      achievementTreasureHunterII.requirement,
    )
    if (
      accountScore.legendaryCount >= achievementTreasureHunterII.requirement &&
      !achievementTreasureHunterII.unlocked
    ) {
      achievementTreasureHunterII.unlocked = true
      achievementTreasureHunterII.unlockedAt = new Date().toISOString()
      newlyUnlocked.push(achievementTreasureHunterII)
    }
  }

  // Check Collector (collection percentage)
  const achievementCollector = updated.find((a) => a.id === "collector")
  if (achievementCollector) {
    const collectionPercentage = accountScore.totalPercentage || 0
    achievementCollector.progress = Math.min(collectionPercentage, achievementCollector.requirement)
    if (collectionPercentage >= achievementCollector.requirement && !achievementCollector.unlocked) {
      achievementCollector.unlocked = true
      achievementCollector.unlockedAt = new Date().toISOString()
      newlyUnlocked.push(achievementCollector)
    }
  }

  return { achievements: updated, newlyUnlocked }
}

// Function to get the count of the most connected node in the connection web
function getMostConnectedNodeCount(): number {
  try {
    // Load all connections
    const connections = loadConnections()

    if (!connections || connections.length === 0) {
      return 0
    }

    // Count connections for each movie and actor
    const connectionCounts: Record<string, number> = {}

    // Count movie connections
    connections.forEach((connection) => {
      const movieKey = `movie-${connection.movieId}`
      connectionCounts[movieKey] = (connectionCounts[movieKey] || 0) + 1

      const actorKey = `actor-${connection.actorId}`
      connectionCounts[actorKey] = (connectionCounts[actorKey] || 0) + 1
    })

    // Find the highest connection count
    let maxConnections = 0
    Object.values(connectionCounts).forEach((count) => {
      maxConnections = Math.max(maxConnections, count)
    })

    return maxConnections
  } catch (error) {
    console.error("Error calculating most connected node:", error)
    return 0
  }
}

export function loadAchievements(): Achievement[] {
  try {
    const stored = localStorage.getItem("movieGameAchievements")
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error("Error loading achievements:", error)
  }
  return initializeAchievements()
}

export function saveAchievements(achievements: Achievement[]): void {
  try {
    localStorage.setItem("movieGameAchievements", JSON.stringify(achievements))
  } catch (error) {
    console.error("Error saving achievements:", error)
  }
}

export function getRarityColor(rarity: string): string {
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

// Helper function to get Jason Statham usage count
function getJasonStathamUsageCount(): number {
  try {
    const history = loadPlayerHistory()
    if (!history || !history.actors) return 0

    // Look for Jason Statham (TMDB ID: 976)
    const jasonStatham = history.actors.find(
      (actor) => actor.name.toLowerCase().includes("jason statham") || actor.id === 976,
    )

    return jasonStatham ? jasonStatham.count : 0
  } catch (error) {
    console.error("Error getting Jason Statham usage count:", error)
    return 0
  }
}

// Helper function to get completed games count
function getCompletedGamesCount(): number {
  try {
    const completedGames = localStorage.getItem("movieGameCompletedGames")
    if (!completedGames) return 0

    const games = JSON.parse(completedGames)
    return Array.isArray(games) ? games.length : 0
  } catch (error) {
    console.error("Error getting completed games count:", error)
    return 0
  }
}

// Helper function to get unique days played count
function getUniqueDaysPlayedCount(): number {
  try {
    const completedGames = localStorage.getItem("movieGameCompletedGames")
    if (!completedGames) return 0

    const games = JSON.parse(completedGames)
    if (!Array.isArray(games)) return 0

    const uniqueDates = new Set()
    games.forEach((game) => {
      if (game.timestamp) {
        const date = new Date(game.timestamp).toDateString()
        uniqueDates.add(date)
      }
    })

    return uniqueDates.size
  } catch (error) {
    console.error("Error getting unique days played count:", error)
    return 0
  }
}

// Preview mode functions for testing
export function getPreviewAchievements(): Achievement[] {
  const achievements = initializeAchievements()

  // Make some achievements unlocked for preview
  achievements[0].unlocked = true // 50k Club
  achievements[0].progress = achievements[0].requirement
  achievements[0].unlockedAt = new Date(Date.now() - 86400000).toISOString() // 1 day ago

  achievements[1].progress = 75000 // 100k Club - in progress

  achievements[2].unlocked = true // Top Dog
  achievements[2].progress = achievements[2].requirement
  achievements[2].unlockedAt = new Date(Date.now() - 3600000).toISOString() // 1 hour ago

  achievements[3].progress = 35 // Treasure Hunter - in progress

  // Networker - in progress
  achievements[4].progress = 7

  // Add these to the preview achievements
  achievements[5].progress = 7 // Fully Cranked - in progress
  achievements[6].unlocked = true // Power User - unlocked
  achievements[6].progress = achievements[6].requirement
  achievements[6].unlockedAt = new Date(Date.now() - 172800000).toISOString() // 2 days ago

  achievements[7].progress = 6 // Power User II - in progress
  achievements[8].progress = 75 // Treasure Hunter II - in progress
  achievements[9].unlocked = true // Collector - unlocked
  achievements[9].progress = achievements[9].requirement
  achievements[9].unlockedAt = new Date(Date.now() - 604800000).toISOString() // 1 week ago

  return achievements
}
