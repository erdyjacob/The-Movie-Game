import { loadPlayerHistory } from "./player-history"

// Achievement types
export type AchievementCategory = "rare" | "gameplay" | "genre" | "actor"
export type AchievementRarity = "common" | "uncommon" | "rare" | "epic" | "legendary"

export interface Achievement {
  id: string
  name: string
  description: string
  category: AchievementCategory
  rarity: AchievementRarity
  icon: string // Lucide icon name
  isUnlocked: boolean
  progress?: {
    current: number
    target: number
  }
}

// Achievement definitions
export const ACHIEVEMENTS: Achievement[] = [
  // Rare Achievements
  {
    id: "cinephile_supreme",
    name: "Cinephile Supreme",
    description: "Collected 1000 unique movies",
    category: "rare",
    rarity: "legendary",
    icon: "Trophy",
    isUnlocked: false,
    progress: {
      current: 0,
      target: 1000,
    },
  },
  {
    id: "hollywood_rolodex",
    name: "Hollywood Rolodex",
    description: "Found 500 different actors",
    category: "rare",
    rarity: "epic",
    icon: "Users",
    isUnlocked: false,
    progress: {
      current: 0,
      target: 500,
    },
  },
  {
    id: "legendary_collection",
    name: "Legendary Collection",
    description: "Found 10 legendary rarity items",
    category: "rare",
    rarity: "epic",
    icon: "Star",
    isUnlocked: false,
    progress: {
      current: 0,
      target: 10,
    },
  },
  {
    id: "foreign_film_buff",
    name: "Foreign Film Buff",
    description: "Collected movies in 10 different languages",
    category: "rare",
    rarity: "rare",
    icon: "Globe",
    isUnlocked: false,
    progress: {
      current: 0,
      target: 10,
    },
  },

  // Gameplay Achievements
  {
    id: "chain_reaction",
    name: "Chain Reaction",
    description: "Made a chain of 15+ connections in one game",
    category: "gameplay",
    rarity: "uncommon",
    icon: "Link",
    isUnlocked: false,
    progress: {
      current: 0,
      target: 15,
    },
  },
  {
    id: "legendary_hunter",
    name: "Legendary Hunter",
    description: "Found 5 legendary rarity actors or movies",
    category: "gameplay",
    rarity: "rare",
    icon: "Search",
    isUnlocked: false,
    progress: {
      current: 0,
      target: 5,
    },
  },
  {
    id: "speed_demon",
    name: "Speed Demon",
    description: "Answered correctly within 3 seconds 10 times",
    category: "gameplay",
    rarity: "uncommon",
    icon: "Timer",
    isUnlocked: false,
    progress: {
      current: 0,
      target: 10,
    },
  },
  {
    id: "daily_devotion",
    name: "Daily Devotion",
    description: "Completed 7 daily challenges in a row",
    category: "gameplay",
    rarity: "rare",
    icon: "Calendar",
    isUnlocked: false,
    progress: {
      current: 0,
      target: 7,
    },
  },
  {
    id: "perfect_game",
    name: "Perfect Game",
    description: "Finished a game with no incorrect answers",
    category: "gameplay",
    rarity: "uncommon",
    icon: "CheckCircle",
    isUnlocked: false,
  },

  // Genre Achievements
  {
    id: "aw_cute",
    name: "Aw Cute",
    description: "Unlocked 10 Rom-Coms",
    category: "genre",
    rarity: "common",
    icon: "Heart",
    isUnlocked: false,
    progress: {
      current: 0,
      target: 10,
    },
  },
  {
    id: "screamer",
    name: "Screamer",
    description: "Collected 15 horror movies",
    category: "genre",
    rarity: "common",
    icon: "Skull",
    isUnlocked: false,
    progress: {
      current: 0,
      target: 15,
    },
  },
  {
    id: "space_race",
    name: "Space Race",
    description: "Found 20 sci-fi movies",
    category: "genre",
    rarity: "common",
    icon: "Rocket",
    isUnlocked: false,
    progress: {
      current: 0,
      target: 20,
    },
  },
  {
    id: "locked_n_loaded",
    name: "Locked n' Loaded",
    description: "Collected 25 action movies",
    category: "genre",
    rarity: "common",
    icon: "Zap",
    isUnlocked: false,
    progress: {
      current: 0,
      target: 25,
    },
  },
  {
    id: "mr_funny",
    name: "Mr. Funny",
    description: "Unlocked 30 comedy films",
    category: "genre",
    rarity: "common",
    icon: "Laugh",
    isUnlocked: false,
    progress: {
      current: 0,
      target: 30,
    },
  },

  // Actor-Based Achievements
  {
    id: "fully_cranked",
    name: "Fully Cranked",
    description: "Used Jason Statham 10 times",
    category: "actor",
    rarity: "uncommon",
    icon: "Dumbbell",
    isUnlocked: false,
    progress: {
      current: 0,
      target: 10,
    },
  },
  {
    id: "the_rock_star",
    name: "The Rock Star",
    description: "Used Dwayne Johnson in 15 games",
    category: "actor",
    rarity: "uncommon",
    icon: "Mountain",
    isUnlocked: false,
    progress: {
      current: 0,
      target: 15,
    },
  },
  {
    id: "cage_match",
    name: "Cage Match",
    description: "Used Nicolas Cage 10 times in one week",
    category: "actor",
    rarity: "rare",
    icon: "Box",
    isUnlocked: false,
    progress: {
      current: 0,
      target: 10,
    },
  },
  {
    id: "six_degrees",
    name: "Six Degrees of Bacon",
    description: "Connected to Kevin Bacon in under 6 steps",
    category: "actor",
    rarity: "uncommon",
    icon: "Network",
    isUnlocked: false,
    progress: {
      current: 0,
      target: 6,
    },
  },
  {
    id: "method_actor",
    name: "Method Actor",
    description: "Used the same actor in 3 consecutive games",
    category: "actor",
    rarity: "uncommon",
    icon: "Repeat",
    isUnlocked: false,
    progress: {
      current: 0,
      target: 3,
    },
  },
]

// Load achievements from localStorage
export function loadAchievements(): Achievement[] {
  if (typeof window === "undefined") {
    return ACHIEVEMENTS
  }

  try {
    const savedAchievements = localStorage.getItem("movieGameAchievements")
    if (savedAchievements) {
      try {
        const parsed = JSON.parse(savedAchievements)
        // Validate the parsed data
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id) {
          return parsed
        }
      } catch (error) {
        console.error("Error parsing achievements:", error)
      }
    }
  } catch (error) {
    console.error("Error loading achievements:", error)
  }

  // Return default achievements if anything goes wrong
  return ACHIEVEMENTS
}

// Save achievements to localStorage
export function saveAchievements(achievements: Achievement[]): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    localStorage.setItem("movieGameAchievements", JSON.stringify(achievements))
  } catch (error) {
    console.error("Error saving achievements:", error)
  }
}

// Check and update achievements based on player history
export function updateAchievements(): Achievement[] {
  try {
    // Load achievements with a fallback
    let achievements = []
    try {
      achievements = loadAchievements()
    } catch (error) {
      console.error("Error loading achievements, using defaults:", error)
      achievements = [...ACHIEVEMENTS]
    }

    // Load player history with a fallback
    let playerHistory = { movies: [], actors: [] }
    try {
      playerHistory = loadPlayerHistory()
    } catch (error) {
      console.error("Error loading player history:", error)
    }

    // Count unique movies and actors - with defensive programming
    const uniqueMovies = new Set(
      Array.isArray(playerHistory.movies) ? playerHistory.movies.map((movie) => movie?.id).filter(Boolean) : [],
    )

    const uniqueActors = new Set(
      Array.isArray(playerHistory.actors) ? playerHistory.actors.map((actor) => actor?.id).filter(Boolean) : [],
    )

    // Count legendary items - with defensive programming
    const legendaryItems = [
      ...(Array.isArray(playerHistory.movies)
        ? playerHistory.movies.filter((movie) => movie?.rarity === "legendary")
        : []),
      ...(Array.isArray(playerHistory.actors)
        ? playerHistory.actors.filter((actor) => actor?.rarity === "legendary")
        : []),
    ]

    // Log the legendary items for debugging
    console.log(`Found ${legendaryItems.length} legendary items in player history`)

    // Update achievement progress
    achievements.forEach((achievement) => {
      if (!achievement) return // Skip if achievement is undefined

      switch (achievement.id) {
        case "cinephile_supreme":
          if (achievement.progress) {
            achievement.progress.current = uniqueMovies.size
            achievement.isUnlocked = uniqueMovies.size >= achievement.progress.target
          }
          break
        case "hollywood_rolodex":
          if (achievement.progress) {
            achievement.progress.current = uniqueActors.size
            achievement.isUnlocked = uniqueActors.size >= achievement.progress.target
          }
          break
        case "legendary_collection":
          if (achievement.progress) {
            achievement.progress.current = legendaryItems.length
            achievement.isUnlocked = legendaryItems.length >= achievement.progress.target
            console.log(`Legendary Collection: ${achievement.progress.current}/${achievement.progress.target}`)
          }
          break
        case "legendary_hunter":
          // Make sure legendary_hunter is updated from player history too
          if (achievement.progress) {
            achievement.progress.current = legendaryItems.length
            achievement.isUnlocked = legendaryItems.length >= achievement.progress.target
            console.log(`Legendary Hunter: ${achievement.progress.current}/${achievement.progress.target}`)
          }
          break
        // Other achievements would be updated based on game events
        // We'll implement those in the game logic
      }
    })

    try {
      saveAchievements(achievements)
    } catch (error) {
      console.error("Error saving achievements:", error)
    }

    return achievements
  } catch (error) {
    console.error("Error updating achievements:", error)
    return ACHIEVEMENTS
  }
}

// Get achievements by category
export function getAchievementsByCategory(category: AchievementCategory): Achievement[] {
  try {
    const achievements = loadAchievements()
    return achievements.filter((achievement) => achievement.category === category)
  } catch (error) {
    console.error("Error getting achievements by category:", error)
    return ACHIEVEMENTS.filter((achievement) => achievement.category === category)
  }
}

// Get all achievements
export function getAllAchievements(): Achievement[] {
  try {
    return loadAchievements()
  } catch (error) {
    console.error("Error getting all achievements:", error)
    return ACHIEVEMENTS
  }
}

// Unlock a specific achievement
export function unlockAchievement(id: string): void {
  try {
    const achievements = loadAchievements()
    const achievement = achievements.find((a) => a.id === id)

    if (achievement && !achievement.isUnlocked) {
      achievement.isUnlocked = true
      console.log(`Achievement unlocked: ${achievement.name}`)
      saveAchievements(achievements)
    }
  } catch (error) {
    console.error("Error unlocking achievement:", error)
  }
}

// Update achievement progress - FIXED to increment instead of set
export function updateAchievementProgress(id: string, incrementBy: number): void {
  try {
    const achievements = loadAchievements()
    const achievement = achievements.find((a) => a.id === id)

    if (achievement && achievement.progress) {
      // Increment the current progress instead of setting it
      achievement.progress.current += incrementBy

      // Log the update for debugging
      console.log(`Achievement ${id} progress updated: ${achievement.progress.current}/${achievement.progress.target}`)

      // Check if the achievement should be unlocked
      if (achievement.progress.current >= achievement.progress.target) {
        achievement.isUnlocked = true
        console.log(`Achievement ${id} unlocked!`)
      }

      saveAchievements(achievements)
    }
  } catch (error) {
    console.error("Error updating achievement progress:", error)
  }
}

// Track legendary items specifically
export function trackLegendaryItem(item: any): void {
  try {
    if (item && item.rarity === "legendary") {
      console.log(`Tracking legendary item: ${item.name}`)

      const achievements = loadAchievements()

      // Find the legendary hunter achievement
      const legendaryHunter = achievements.find((a) => a.id === "legendary_hunter")

      if (legendaryHunter && legendaryHunter.progress) {
        // Increment the progress
        legendaryHunter.progress.current += 1

        console.log(`Legendary Hunter progress: ${legendaryHunter.progress.current}/${legendaryHunter.progress.target}`)

        // Check if the achievement should be unlocked
        if (legendaryHunter.progress.current >= legendaryHunter.progress.target) {
          legendaryHunter.isUnlocked = true
          console.log("Legendary Hunter achievement unlocked!")
        }
      }

      // Also update the legendary collection achievement
      const legendaryCollection = achievements.find((a) => a.id === "legendary_collection")

      if (legendaryCollection && legendaryCollection.progress) {
        // Increment the progress
        legendaryCollection.progress.current += 1

        console.log(
          `Legendary Collection progress: ${legendaryCollection.progress.current}/${legendaryCollection.progress.target}`,
        )

        // Check if the achievement should be unlocked
        if (legendaryCollection.progress.current >= legendaryCollection.progress.target) {
          legendaryCollection.isUnlocked = true
          console.log("Legendary Collection achievement unlocked!")
        }
      }

      saveAchievements(achievements)
    }
  } catch (error) {
    console.error("Error tracking legendary item:", error)
  }
}

// Get achievement progress
export function getAchievementProgress(id: string): number {
  try {
    const achievements = loadAchievements()
    const achievement = achievements.find((a) => a.id === id)

    if (achievement && achievement.progress) {
      return achievement.progress.current
    }
  } catch (error) {
    console.error("Error getting achievement progress:", error)
  }

  return 0
}

// Reset all achievements (for testing)
export function resetAchievements(): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    localStorage.removeItem("movieGameAchievements")
    console.log("All achievements have been reset")
  } catch (error) {
    console.error("Error resetting achievements:", error)
  }
}
