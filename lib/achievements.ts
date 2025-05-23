import type { Achievement, AccountScore } from "./types"
import { loadConnections } from "./connection-tracking"

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

  return achievements
}
