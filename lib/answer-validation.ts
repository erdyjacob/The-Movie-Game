import type { GameFilters, GameItem, ItemType } from "@/lib/types"
import { searchActorsByMovie, searchMoviesByActor } from "@/lib/tmdb-api"

// Define error types for better error handling
export type ValidationErrorCode = "NOT_FOUND" | "NO_OPTIONS" | "SYSTEM_ERROR" | "API_ERROR" | "INVALID_TYPE"

export type ValidationError = {
  code: ValidationErrorCode
  message: string
  context?: Record<string, any>
}

// Function to calculate string similarity (Levenshtein distance)
export function stringSimilarity(s1: string, s2: string): number {
  s1 = s1.toLowerCase()
  s2 = s2.toLowerCase()

  const costs: number[] = []
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j
      } else if (j > 0) {
        let newValue = costs[j - 1]
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
        }
        costs[j - 1] = lastValue
        lastValue = newValue
      }
    }
    if (i > 0) {
      costs[s2.length] = lastValue
    }
  }

  // Return a similarity score between 0 and 1
  const maxLength = Math.max(s1.length, s2.length)
  if (maxLength === 0) return 1.0 // Both strings are empty

  return 1.0 - costs[s2.length] / maxLength
}

// Function to find the best match
export function findBestMatch(
  input: string,
  options: Array<{ id: number; name: string }>,
): { id: number; name: string; similarity: number } | null {
  if (!options.length) return null

  let bestMatch = null
  let highestSimilarity = 0

  for (const option of options) {
    const similarity = stringSimilarity(input, option.name)
    if (similarity > highestSimilarity) {
      highestSimilarity = similarity
      bestMatch = { ...option, similarity }
    }
  }

  // Return the best match if it's similar enough (threshold: 0.8)
  return bestMatch && bestMatch.similarity >= 0.8 ? bestMatch : null
}

// Get available actors for a movie
export async function getAvailableActorsForMovie(
  movieId: number,
  usedIds: Set<number>,
): Promise<{ actors: any[]; error?: ValidationError }> {
  try {
    const actors = await searchActorsByMovie(movieId)

    // Filter out already used actors
    const availableActors = actors.filter((actor) => !usedIds.has(actor.id))

    if (availableActors.length === 0) {
      return {
        actors: [],
        error: {
          code: "NO_OPTIONS",
          message: "No more actors available for this movie!",
        },
      }
    }

    return { actors: availableActors }
  } catch (error) {
    console.error("Error fetching actors for movie:", error)
    return {
      actors: [],
      error: {
        code: "API_ERROR",
        message: "Failed to fetch actors. Please try again.",
      },
    }
  }
}

// Get available movies for an actor
export async function getAvailableMoviesForActor(
  actorId: number,
  usedIds: Set<number>,
  filters: GameFilters,
): Promise<{ movies: any[]; error?: ValidationError }> {
  try {
    const movies = await searchMoviesByActor(actorId, filters)

    // Filter out already used movies
    const availableMovies = movies.filter((movie) => !usedIds.has(movie.id))

    if (availableMovies.length === 0) {
      return {
        movies: [],
        error: {
          code: "NO_OPTIONS",
          message: "There are no more unused movies for this actor!",
        },
      }
    }

    return { movies: availableMovies }
  } catch (error) {
    console.error("Error fetching movies for actor:", error)
    return {
      movies: [],
      error: {
        code: "API_ERROR",
        message: "Failed to fetch movies. Please try again.",
      },
    }
  }
}

// Convert API actor to GameItem
function actorToGameItem(actor: any): GameItem {
  return {
    id: actor.id,
    name: actor.name,
    image: actor.profile_path ? `https://image.tmdb.org/t/p/w500${actor.profile_path}` : null,
    type: "actor",
    details: actor,
  }
}

// Convert API movie to GameItem
function movieToGameItem(movie: any): GameItem {
  return {
    id: movie.id,
    name: movie.title || movie.name || "",
    image: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
    type: "movie",
    details: movie,
  }
}

// Find item by ID or name
function findItemById(items: any[], itemId: number): any | null {
  return items.find((item) => item.id === itemId) || null
}

function findItemByName(items: any[], name: string): any | null {
  // Try exact match first (case insensitive)
  const exactMatch = items.find((item) => {
    const itemName = item.name || item.title || ""
    return itemName.toLowerCase() === name.toLowerCase()
  })

  if (exactMatch) return exactMatch

  // If no exact match, try fuzzy matching
  const itemsForMatching = items.map((item) => ({
    id: item.id,
    name: item.name || item.title || "",
  }))

  const bestMatch = findBestMatch(name, itemsForMatching)
  if (!bestMatch) return null

  return items.find((item) => item.id === bestMatch.id) || null
}

// Generate appropriate error message based on expected type and context
export function generateNotFoundErrorMessage(search: string, expectedType: ItemType, currentItem: GameItem): string {
  if (expectedType === "actor") {
    return `${search} is not an actor in ${currentItem.name}`
  } else {
    return `${search} is not a movie that ${currentItem.name} appeared in`
  }
}

// Main validation function - single source of truth for all validations
export async function validateAnswer(
  search: string,
  currentItem: GameItem,
  expectedType: ItemType,
  usedIds: Set<number>,
  filters: GameFilters,
  selectedItemId?: number, // Optional ID if selected from dropdown
): Promise<{ valid: boolean; error?: string; item?: GameItem }> {
  try {
    // Type validation - ensure we have the correct item type for the expected answer
    const isValidTypeCombo =
      (expectedType === "actor" && currentItem.type === "movie") ||
      (expectedType === "movie" && currentItem.type === "actor")

    if (!isValidTypeCombo) {
      const errorMessage =
        expectedType === "actor"
          ? "System error: Expected a movie to search for actors"
          : "System error: Expected an actor to search for movies"

      return {
        valid: false,
        error: errorMessage,
      }
    }

    // Validate based on expected type
    if (expectedType === "actor") {
      // Get available actors for this movie
      const { actors, error } = await getAvailableActorsForMovie(currentItem.id, usedIds)

      if (error) {
        return {
          valid: false,
          error: error.message,
        }
      }

      // If we have a selected item ID (from dropdown), find that actor
      let matchedActor = null
      if (selectedItemId) {
        matchedActor = findItemById(actors, selectedItemId)
      } else {
        // Otherwise search by name
        matchedActor = findItemByName(actors, search)
      }

      if (matchedActor) {
        return {
          valid: true,
          item: actorToGameItem(matchedActor),
        }
      } else {
        return {
          valid: false,
          error: generateNotFoundErrorMessage(search, "actor", currentItem),
        }
      }
    } else {
      // Validate movie answer
      // Get available movies for this actor
      const { movies, error } = await getAvailableMoviesForActor(currentItem.id, usedIds, filters)

      if (error) {
        return {
          valid: false,
          error: error.message,
        }
      }

      // If we have a selected item ID (from dropdown), find that movie
      let matchedMovie = null
      if (selectedItemId) {
        matchedMovie = findItemById(movies, selectedItemId)
      } else {
        // Otherwise search by name
        matchedMovie = findItemByName(movies, search)
      }

      if (matchedMovie) {
        return {
          valid: true,
          item: movieToGameItem(matchedMovie),
        }
      } else {
        return {
          valid: false,
          error: generateNotFoundErrorMessage(search, "movie", currentItem),
        }
      }
    }
  } catch (error) {
    console.error("Error in validateAnswer:", error)
    return {
      valid: false,
      error: "An unexpected error occurred. Please try again.",
    }
  }
}
