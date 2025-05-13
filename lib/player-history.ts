import type { GameItem, PlayerHistory, PlayerHistoryItem } from "./types"
import { calculateActorRarity, calculateMovieRarity } from "./rarity"
import { fetchAndCacheCredits } from "./tmdb-api"

// Maximum number of items to store in history
const MAX_HISTORY_ITEMS = 100

// Load player history from localStorage
export function loadPlayerHistory(): PlayerHistory {
  if (typeof window === "undefined") {
    return { movies: [], actors: [] }
  }

  try {
    const savedHistory = localStorage.getItem("movieGamePlayerHistory")
    if (savedHistory) {
      return JSON.parse(savedHistory)
    }
  } catch (error) {
    console.error("Error loading player history:", error)
  }

  return { movies: [], actors: [] }
}

// Save player history to localStorage
export function savePlayerHistory(history: PlayerHistory): void {
  if (typeof window === "undefined") {
    return
  }

  try {
    localStorage.setItem("movieGamePlayerHistory", JSON.stringify(history))
  } catch (error) {
    console.error("Error saving player history:", error)
  }
}

// Check if an item is new (not in player history)
export function isNewItem(item: GameItem): boolean {
  if (typeof window === "undefined" || !item) {
    return false
  }

  const history = loadPlayerHistory()

  if (item.type === "movie") {
    return !history.movies.some((m) => m.id === item.id)
  } else if (item.type === "actor") {
    return !history.actors.some((a) => a.id === item.id)
  }

  return false
}

// Add an item to player history
export function addToPlayerHistory(item: GameItem): void {
  if (typeof window === "undefined" || !item) {
    return
  }

  try {
    const history = loadPlayerHistory()
    const now = new Date().toISOString()

    // Calculate rarity if not already set
    const rarity =
      item.rarity || (item.type === "movie" ? calculateMovieRarity(item.details) : calculateActorRarity(item.details))

    if (item.type === "movie") {
      // Check if movie already exists in history
      const existingIndex = history.movies.findIndex((m) => m.id === item.id)

      if (existingIndex >= 0) {
        // Update existing entry
        history.movies[existingIndex].count += 1
        history.movies[existingIndex].date = now
        // Make sure rarity is set
        if (!history.movies[existingIndex].rarity) {
          history.movies[existingIndex].rarity = rarity
        }

        // Move to the beginning of the array (most recent)
        const movie = history.movies.splice(existingIndex, 1)[0]
        history.movies.unshift(movie)
      } else {
        // Add new entry
        history.movies.unshift({
          id: item.id,
          name: item.name,
          date: now,
          count: 1,
          image: item.image,
          rarity: rarity,
        })

        // Trim if exceeding max size
        if (history.movies.length > MAX_HISTORY_ITEMS) {
          history.movies = history.movies.slice(0, MAX_HISTORY_ITEMS)
        }
      }
    } else if (item.type === "actor") {
      // Check if actor already exists in history
      const existingIndex = history.actors.findIndex((a) => a.id === item.id)

      if (existingIndex >= 0) {
        // Update existing entry
        history.actors[existingIndex].count += 1
        history.actors[existingIndex].date = now
        // Make sure rarity is set
        if (!history.actors[existingIndex].rarity) {
          history.actors[existingIndex].rarity = rarity
        }

        // Move to the beginning of the array (most recent)
        const actor = history.actors.splice(existingIndex, 1)[0]
        history.actors.unshift(actor)
      } else {
        // Add new entry
        history.actors.unshift({
          id: item.id,
          name: item.name,
          date: now,
          count: 1,
          image: item.image,
          rarity: rarity,
        })

        // Trim if exceeding max size
        if (history.actors.length > MAX_HISTORY_ITEMS) {
          history.actors = history.actors.slice(0, MAX_HISTORY_ITEMS)
        }
      }
    }

    savePlayerHistory(history)

    // Fetch and cache credits data for the item to enable connection inference
    if (typeof window !== "undefined") {
      // Use setTimeout to avoid blocking the UI
      setTimeout(() => {
        fetchAndCacheCredits({ id: item.id, type: item.type }).catch((err) =>
          console.error("Error fetching credits data:", err),
        )
      }, 100)
    }
  } catch (error) {
    console.error("Error adding to player history:", error)
  }
}

// Get most used items from player history
export function getMostUsedItems(type: "movie" | "actor", limit = 10): PlayerHistoryItem[] {
  const history = loadPlayerHistory()
  const items = type === "movie" ? history.movies : history.actors

  // Sort by count (descending) and take the top 'limit' items
  return [...items].sort((a, b) => b.count - a.count).slice(0, limit)
}

// Get recently used items from player history
export function getRecentItems(type: "movie" | "actor", limit = 10): PlayerHistoryItem[] {
  const history = loadPlayerHistory()
  const items = type === "movie" ? history.movies : history.actors

  // Items are already sorted by recency (most recent first)
  return items.slice(0, limit)
}

// Get items by rarity
export function getItemsByRarity(type: "movie" | "actor", rarity?: string): PlayerHistoryItem[] {
  const history = loadPlayerHistory()
  const items = type === "movie" ? history.movies : history.actors

  if (rarity) {
    return items.filter((item) => item.rarity === rarity)
  }

  // Group by rarity and sort (legendary first, then epic, etc.)
  const rarityOrder = ["legendary", "epic", "rare", "uncommon", "common"]
  return [...items].sort((a, b) => {
    const rarityA = a.rarity || "common"
    const rarityB = b.rarity || "common"
    return rarityOrder.indexOf(rarityA) - rarityOrder.indexOf(rarityB)
  })
}

// Clear player history
export function clearPlayerHistory(): void {
  if (typeof window === "undefined") {
    return
  }

  localStorage.removeItem("movieGamePlayerHistory")
}
