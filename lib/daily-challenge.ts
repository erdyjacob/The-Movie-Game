"use server"

import type { GameItem } from "@/lib/types"
import { getRandomMovie, getRandomActor, searchActorsByMovie } from "@/lib/tmdb-api"
import { calculateMovieRarity, calculateActorRarity } from "@/lib/rarity"

// In-memory cache for the daily challenge
let dailyChallengeCache: {
  item: GameItem | null
  date: string
  completions: string[] // Array of dates when challenges were completed
} = {
  item: null,
  date: "",
  completions: [],
}

// Fallback daily challenge items in case the API fails
const FALLBACK_DAILY_CHALLENGES: GameItem[] = [
  {
    id: 101,
    name: "The Matrix",
    image: null,
    type: "movie",
    details: {
      id: 101,
      title: "The Matrix",
      poster_path: null,
      release_date: "1999-03-31",
      overview: "A computer hacker learns about the true nature of reality.",
      vote_count: 20000,
      popularity: 60.5,
    },
    rarity: "rare",
    isDailyChallenge: true,
  },
  {
    id: 102,
    name: "Keanu Reeves",
    image: null,
    type: "actor",
    details: {
      id: 102,
      name: "Keanu Reeves",
      profile_path: null,
      popularity: 50.2,
    },
    rarity: "uncommon",
    isDailyChallenge: true,
  },
  {
    id: 103,
    name: "Inception",
    image: null,
    type: "movie",
    details: {
      id: 103,
      title: "Inception",
      poster_path: null,
      release_date: "2010-07-16",
      overview: "A thief who steals corporate secrets through the use of dream-sharing technology.",
      vote_count: 18000,
      popularity: 55.8,
    },
    rarity: "rare",
    isDailyChallenge: true,
  },
]

// Function to get today's date in YYYY-MM-DD format
function getTodayDateString(): string {
  const today = new Date()
  return today.toISOString().split("T")[0]
}

// Function to check if the daily challenge has been completed today
export async function isDailyChallengeCompleted(): Promise<boolean> {
  if (typeof window === "undefined") return false

  try {
    const completions = localStorage.getItem("dailyChallengeCompletions")
    if (!completions) return false

    const completionDates = JSON.parse(completions) as string[]
    return completionDates.includes(getTodayDateString())
  } catch (error) {
    console.error("Error checking daily challenge completion:", error)
    return false
  }
}

// Function to mark the daily challenge as completed
export async function markDailyChallengeCompleted(): Promise<void> {
  if (typeof window === "undefined") return

  try {
    const today = getTodayDateString()
    let completions: string[] = []

    const savedCompletions = localStorage.getItem("dailyChallengeCompletions")
    if (savedCompletions) {
      completions = JSON.parse(savedCompletions)
    }

    if (!completions.includes(today)) {
      completions.push(today)
      localStorage.setItem("dailyChallengeCompletions", JSON.stringify(completions))
    }
  } catch (error) {
    console.error("Error marking daily challenge as completed:", error)
  }
}

// Function to get all completed daily challenges
export async function getCompletedDailyChallenges(): Promise<string[]> {
  if (typeof window === "undefined") return []

  try {
    const completions = localStorage.getItem("dailyChallengeCompletions")
    if (!completions) return []

    return JSON.parse(completions) as string[]
  } catch (error) {
    console.error("Error getting completed daily challenges:", error)
    return []
  }
}

// Helper function to check if a movie has at least two rare actors
async function hasAtLeastTwoRareActors(movieId: number): Promise<boolean> {
  try {
    const actors = await searchActorsByMovie(movieId)

    // Calculate rarity for each actor
    const rareActors = actors.filter((actor) => {
      const rarity = calculateActorRarity(actor)
      return rarity === "rare" || rarity === "epic" || rarity === "legendary"
    })

    return rareActors.length >= 2
  } catch (error) {
    console.error("Error checking movie for rare actors:", error)
    return false
  }
}

// Function to get the daily challenge
export async function getDailyChallenge(): Promise<GameItem> {
  const today = getTodayDateString()

  // If we already have today's challenge cached, return it
  if (dailyChallengeCache.date === today && dailyChallengeCache.item) {
    return dailyChallengeCache.item
  }

  try {
    // Use the date to seed the random selection
    // This ensures the same item is selected for everyone on the same day
    const dateSeed = new Date(today).getTime()
    const isMovie = dateSeed % 2 === 0 // Alternate between movies and actors

    let item: GameItem

    if (isMovie) {
      // For movies, we now need to find one with at least two rare actors
      let movie = null
      let attempts = 0
      const maxAttempts = 5 // Limit attempts to avoid infinite loops

      while (!movie && attempts < maxAttempts) {
        attempts++
        const candidateMovie = await getRandomMovie("medium", {
          includeAnimated: true,
          includeSequels: true,
          includeForeign: true,
        })

        // Check if this movie has at least two rare actors
        const hasRareActors = await hasAtLeastTwoRareActors(candidateMovie.id)

        if (hasRareActors) {
          movie = candidateMovie
        }
      }

      // If we couldn't find a suitable movie after max attempts, just use the last one we tried
      if (!movie) {
        movie = await getRandomMovie("medium", {
          includeAnimated: true,
          includeSequels: true,
          includeForeign: true,
        })
      }

      item = {
        id: movie.id,
        name: movie.title,
        image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
        type: "movie",
        details: movie,
        rarity: calculateMovieRarity(movie),
        isDailyChallenge: true,
      }
    } else {
      // For actors, keep the existing logic
      const actor = await getRandomActor("medium")

      item = {
        id: actor.id,
        name: actor.name,
        image: actor.profile_path ? `https://image.tmdb.org/t/p/w500${actor.profile_path}` : null,
        type: "actor",
        details: actor,
        rarity: calculateActorRarity(actor),
        isDailyChallenge: true,
      }
    }

    // Cache the result
    dailyChallengeCache = {
      item,
      date: today,
      completions: dailyChallengeCache.completions,
    }

    return item
  } catch (error) {
    console.error("Error generating daily challenge:", error)

    // Use a fallback challenge if the API fails
    const fallbackIndex = new Date(today).getDate() % FALLBACK_DAILY_CHALLENGES.length
    const fallbackItem = FALLBACK_DAILY_CHALLENGES[fallbackIndex]

    // Cache the fallback
    dailyChallengeCache = {
      item: fallbackItem,
      date: today,
      completions: dailyChallengeCache.completions,
    }

    return fallbackItem
  }
}

// Function to check if an item matches the daily challenge
export async function checkDailyChallenge(item: GameItem): Promise<boolean> {
  if (!dailyChallengeCache.item) return false

  return item.id === dailyChallengeCache.item.id && item.type === dailyChallengeCache.item.type
}

// Function to save a completed daily challenge
export async function saveDailyChallengeItem(item: GameItem): Promise<void> {
  if (typeof window === "undefined") return

  try {
    const today = getTodayDateString()
    let challenges: Record<string, GameItem> = {}

    const savedChallenges = localStorage.getItem("dailyChallengeItems")
    if (savedChallenges) {
      challenges = JSON.parse(savedChallenges)
    }

    challenges[today] = item
    localStorage.setItem("dailyChallengeItems", JSON.stringify(challenges))

    // Mark as completed
    await markDailyChallengeCompleted()
  } catch (error) {
    console.error("Error saving daily challenge item:", error)
  }
}

// Function to get all completed daily challenge items
export async function getCompletedDailyChallengeItems(): Promise<Record<string, GameItem>> {
  if (typeof window === "undefined") return {}

  try {
    const savedChallenges = localStorage.getItem("dailyChallengeItems")
    if (!savedChallenges) return {}

    return JSON.parse(savedChallenges) as Record<string, GameItem>
  } catch (error) {
    console.error("Error getting completed daily challenge items:", error)
    return {}
  }
}
