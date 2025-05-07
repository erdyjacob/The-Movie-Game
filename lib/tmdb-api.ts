"use server"

import type { TMDBMovie, TMDBActor, Difficulty, GameFilters } from "@/lib/types"

const API_KEY = process.env.TMDB_API_KEY
const BASE_URL = "https://api.themoviedb.org/3"

// Animation genre ID in TMDB
const ANIMATION_GENRE_ID = 16

// Common franchise keywords to avoid repetition
const COMMON_FRANCHISES = [
  "avengers",
  "marvel",
  "star wars",
  "harry potter",
  "fast and furious",
  "mission impossible",
  "james bond",
  "jurassic",
  "transformers",
  "batman",
  "superman",
  "spider-man",
  "x-men",
]

// Keep track of recently used franchises to avoid repetition
const recentlyUsedFranchises: string[] = []
const MAX_RECENT_FRANCHISES = 5

// Function to check if a movie is likely a sequel based on its title
function isLikelySequel(movie: TMDBMovie): boolean {
  // Check if the movie belongs to a collection
  if (movie.belongs_to_collection) {
    return true
  }

  const title = movie.title || ""

  // Check for common sequel indicators in the title
  const sequelPatterns = [
    /\d+$/, // Ends with a number (e.g., "Terminator 2")
    /part\s+\d+/i, // Contains "Part" followed by a number (e.g., "Part II")
    /chapter\s+\d+/i, // Contains "Chapter" followed by a number
    /\d+\s*:\s*.+/, // Number followed by colon (e.g., "2: Judgment Day")
    /the\s+\w+\s+\d+/i, // "The" followed by word and number (e.g., "The Purge 2")
    /\s+\d+\s*:/, // Space, number, colon (e.g., "Alien 3: ")
    /\s+\d+$/, // Space followed by number at end (e.g., "Die Hard 2")
    /\s+\d+\s*$/, // Space, number, optional space at end
    /\s+\w+\s+\d+$/, // Space, word, space, number at end
    /\s+\w+\s+\d+\s*$/, // Space, word, space, number, optional space at end
  ]

  return sequelPatterns.some((pattern) => pattern.test(title))
}

// Function to check if a movie belongs to a common franchise
function isCommonFranchise(movie: TMDBMovie): boolean {
  const title = movie.title?.toLowerCase() || ""
  const overview = movie.overview?.toLowerCase() || ""

  return COMMON_FRANCHISES.some((franchise) => title.includes(franchise) || overview.includes(franchise))
}

// Function to check if a movie is from a recently used franchise
function isRecentlyUsedFranchise(movie: TMDBMovie): boolean {
  const title = movie.title?.toLowerCase() || ""

  return recentlyUsedFranchises.some((franchise) => title.includes(franchise))
}

// Function to add a franchise to the recently used list
function addToRecentFranchises(movie: TMDBMovie) {
  // Extract potential franchise name (first 1-2 words of title)
  const title = movie.title || ""
  const franchiseWords = title.split(" ").slice(0, 2).join(" ").toLowerCase()

  // Only add if it's not already in the list
  if (!recentlyUsedFranchises.includes(franchiseWords)) {
    recentlyUsedFranchises.push(franchiseWords)

    // Keep the list at a maximum size
    if (recentlyUsedFranchises.length > MAX_RECENT_FRANCHISES) {
      recentlyUsedFranchises.shift()
    }
  }
}

// Function to check if a movie is a foreign film (non-English)
function isForeignFilm(movie: TMDBMovie): boolean {
  return movie.original_language !== "en"
}

// Get difficulty thresholds for movies
function getMovieDifficultyThresholds(difficulty: Difficulty) {
  const currentYear = new Date().getFullYear()

  switch (difficulty) {
    case "easy":
      // Very popular, recent movies (last 20 years, high vote count, high popularity)
      return {
        minVoteCount: 5000,
        minPopularity: 50,
        minReleaseYear: currentYear - 20,
      }
    case "medium":
      // Moderately popular movies (last 30 years, medium vote count)
      return {
        minVoteCount: 1000,
        maxVoteCount: 5000,
        minPopularity: 20,
        maxPopularity: 50,
        minReleaseYear: currentYear - 30,
      }
    case "hard":
      // Less popular or older movies
      return {
        maxVoteCount: 1000,
        maxPopularity: 20,
      }
    default:
      return { minVoteCount: 1000, minPopularity: 20 }
  }
}

// Get difficulty thresholds for actors
function getActorDifficultyThresholds(difficulty: Difficulty) {
  switch (difficulty) {
    case "easy":
      // Very popular actors
      return { minPopularity: 30 }
    case "medium":
      // Moderately popular actors
      return { minPopularity: 10, maxPopularity: 30 }
    case "hard":
      // Less popular actors
      return { maxPopularity: 10 }
    default:
      return { minPopularity: 10 }
  }
}

// Check if a movie is animated based on its genres
function isAnimatedMovie(movie: TMDBMovie): boolean {
  // Check if genre_ids array contains the animation genre ID
  if (movie.genre_ids && Array.isArray(movie.genre_ids)) {
    return movie.genre_ids.includes(ANIMATION_GENRE_ID)
  }

  // If the movie has genres array instead of genre_ids
  if (movie.genres && Array.isArray(movie.genres)) {
    return movie.genres.some((genre) => genre.id === ANIMATION_GENRE_ID)
  }

  // If we can't determine, be conservative and assume it might be animated
  return false
}

// Fetch a random popular movie based on difficulty and filters
export async function getRandomMovie(
  difficulty: Difficulty = "medium",
  filters: GameFilters = { includeAnimated: true, includeSequels: true, includeForeign: true },
): Promise<TMDBMovie> {
  try {
    const thresholds = getMovieDifficultyThresholds(difficulty)

    // Increase the page range to get more variety
    const maxPages = difficulty === "easy" ? 5 : difficulty === "medium" ? 8 : 12

    // Use a more random page selection
    const page = Math.floor(Math.random() * maxPages) + 1

    // Add a timestamp parameter to avoid caching issues
    const timestamp = Date.now()

    // For easy mode, sort by popularity to get the most popular movies
    // For medium and hard, use different sort methods to increase variety
    let sortBy = "popularity.desc"
    if (difficulty === "medium") {
      // Randomly choose between popularity and vote count for medium difficulty
      sortBy = Math.random() > 0.5 ? "popularity.desc" : "vote_count.desc"
    } else if (difficulty === "hard") {
      // For hard, use vote average to get critically acclaimed but less popular movies
      sortBy = Math.random() > 0.5 ? "vote_average.desc" : "popularity.asc"
    }

    // Build the API URL
    let apiUrl = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=${sortBy}&page=${page}&vote_count.gte=100&_t=${timestamp}`

    // If we're excluding animated movies, add a filter
    if (!filters.includeAnimated) {
      apiUrl += `&without_genres=${ANIMATION_GENRE_ID}`
    }

    // If we're excluding foreign films, add a filter for English language only
    if (!filters.includeForeign) {
      apiUrl += `&with_original_language=en`
    }

    console.log("API URL:", apiUrl)

    const response = await fetch(
      apiUrl,
      { cache: "no-store" }, // Disable caching completely
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch movies: ${response.status}`)
    }

    const data = await response.json()
    let movies = data.results

    console.log(`Fetched ${movies.length} movies before filtering`)

    // Filter movies based on difficulty and other criteria
    movies = movies.filter((movie: TMDBMovie) => {
      // Apply difficulty filters
      const releaseYear = movie.release_date ? Number.parseInt(movie.release_date.split("-")[0]) : 0

      let meetsThresholds = true

      if (difficulty === "easy") {
        meetsThresholds =
          movie.vote_count >= thresholds.minVoteCount &&
          movie.popularity >= thresholds.minPopularity &&
          releaseYear >= thresholds.minReleaseYear
      } else if (difficulty === "medium") {
        meetsThresholds =
          movie.vote_count >= thresholds.minVoteCount &&
          movie.vote_count <= thresholds.maxVoteCount &&
          movie.popularity >= thresholds.minPopularity &&
          movie.popularity <= thresholds.maxPopularity &&
          releaseYear >= thresholds.minReleaseYear
      } else if (difficulty === "hard") {
        meetsThresholds = movie.vote_count <= thresholds.maxVoteCount && movie.popularity <= thresholds.maxPopularity
      }

      // Apply animated filter if needed - double-check even though we filtered in the API
      if (!filters.includeAnimated && isAnimatedMovie(movie)) {
        console.log(`Filtering out animated movie: ${movie.title}`)
        return false
      }

      // Apply sequel filter if needed
      if (!filters.includeSequels && isLikelySequel(movie)) {
        return false
      }

      // Apply foreign film filter if needed - double-check even though we filtered in the API
      if (!filters.includeForeign && isForeignFilm(movie)) {
        console.log(`Filtering out foreign movie: ${movie.title}`)
        return false
      }

      // For better variety, avoid recently used franchises
      if (isRecentlyUsedFranchise(movie)) {
        return false
      }

      // For medium and hard difficulty, avoid common franchises to increase variety
      if ((difficulty === "medium" || difficulty === "hard") && isCommonFranchise(movie)) {
        // For medium, only filter out some common franchises
        if (difficulty === "medium") {
          // Keep some franchises (50% chance)
          return Math.random() > 0.5 || meetsThresholds
        }
        // For hard, filter out all common franchises
        return false
      }

      return meetsThresholds
    })

    console.log(`After filtering: ${movies.length} movies remain`)

    // If no movies match the criteria, try again with just the essential filters
    if (movies.length === 0) {
      console.log("No movies matched all criteria, using basic filters only")
      movies = data.results.filter((movie) => {
        // Still apply the essential filters
        if (!filters.includeAnimated && isAnimatedMovie(movie)) {
          return false
        }

        if (!filters.includeSequels && isLikelySequel(movie)) {
          return false
        }

        if (!filters.includeForeign && isForeignFilm(movie)) {
          return false
        }

        return true
      })
    }

    // If still no movies, make one more API call with different parameters
    if (movies.length === 0) {
      console.log("No movies matched even basic filters, making another API call")

      // Try a different API endpoint with more strict filtering
      let fallbackUrl = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=vote_count.desc&page=1&vote_count.gte=1000&_t=${timestamp}`

      if (!filters.includeAnimated) {
        fallbackUrl += `&without_genres=${ANIMATION_GENRE_ID}`
      }

      if (!filters.includeForeign) {
        fallbackUrl += `&with_original_language=en`
      }

      const fallbackResponse = await fetch(fallbackUrl, { cache: "no-store" })

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json()
        movies = fallbackData.results.filter((movie) => {
          if (!filters.includeAnimated && isAnimatedMovie(movie)) {
            return false
          }

          if (!filters.includeSequels && isLikelySequel(movie)) {
            return false
          }

          if (!filters.includeForeign && isForeignFilm(movie)) {
            return false
          }

          return true
        })
      }
    }

    // If we still have no movies, throw an error
    if (movies.length === 0) {
      throw new Error("Could not find any movies matching the criteria")
    }

    // Pick a random movie from the filtered results
    const randomIndex = Math.floor(Math.random() * movies.length)
    const selectedMovie = movies[randomIndex]

    // Add this movie's franchise to recently used list
    addToRecentFranchises(selectedMovie)

    console.log(
      `Selected movie: ${selectedMovie.title}, Animated: ${isAnimatedMovie(selectedMovie)}, Foreign: ${isForeignFilm(selectedMovie)}`,
    )

    return selectedMovie
  } catch (error) {
    console.error("Error fetching random movie:", error)
    throw error
  }
}

// Keep track of recently used actor types to avoid repetition
const recentlyUsedActorTypes: string[] = []
const MAX_RECENT_ACTOR_TYPES = 3

// Function to categorize an actor
function categorizeActor(actor: TMDBActor): string {
  // Simple categorization based on popularity
  if (actor.popularity >= 30) return "a-list"
  if (actor.popularity >= 10) return "b-list"
  return "character-actor"
}

// Function to add an actor type to recently used list
function addToRecentActorTypes(actor: TMDBActor) {
  const type = categorizeActor(actor)

  if (!recentlyUsedActorTypes.includes(type)) {
    recentlyUsedActorTypes.push(type)

    if (recentlyUsedActorTypes.length > MAX_RECENT_ACTOR_TYPES) {
      recentlyUsedActorTypes.shift()
    }
  }
}

// Function to check if an actor type was recently used
function isRecentlyUsedActorType(actor: TMDBActor): boolean {
  const type = categorizeActor(actor)
  return recentlyUsedActorTypes.includes(type)
}

// Update the getRandomActor function to ensure better randomization
export async function getRandomActor(difficulty: Difficulty = "medium"): Promise<TMDBActor> {
  try {
    const thresholds = getActorDifficultyThresholds(difficulty)

    // Increase the page range to get more variety
    const maxPages = difficulty === "easy" ? 5 : difficulty === "medium" ? 8 : 12

    // Use a more random page selection
    const page = Math.floor(Math.random() * maxPages) + 1

    // Add a timestamp parameter to avoid caching issues
    const timestamp = Date.now()

    const response = await fetch(
      `${BASE_URL}/person/popular?api_key=${API_KEY}&language=en-US&page=${page}&_t=${timestamp}`,
      { cache: "no-store" }, // Disable caching completely
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch actors: ${response.status}`)
    }

    const data = await response.json()
    let actors = data.results

    // Filter actors based on difficulty
    if (difficulty === "easy") {
      actors = actors.filter(
        (actor: TMDBActor) =>
          actor.popularity >= thresholds.minPopularity &&
          actor.known_for &&
          actor.known_for.length > 0 &&
          !isRecentlyUsedActorType(actor),
      )
    } else if (difficulty === "medium") {
      actors = actors.filter(
        (actor: TMDBActor) =>
          actor.popularity >= thresholds.minPopularity &&
          actor.popularity <= thresholds.maxPopularity &&
          !isRecentlyUsedActorType(actor),
      )
    } else if (difficulty === "hard") {
      actors = actors.filter(
        (actor: TMDBActor) => actor.popularity <= thresholds.maxPopularity && !isRecentlyUsedActorType(actor),
      )
    }

    // If no actors match the criteria, return any actor
    if (actors.length === 0) {
      console.log("No actors matched the criteria, using unfiltered results")
      actors = data.results
    }

    // Pick a truly random actor from the filtered results
    const randomIndex = Math.floor(Math.random() * actors.length)
    const selectedActor = actors[randomIndex]

    // Add this actor type to recently used list
    addToRecentActorTypes(selectedActor)

    return selectedActor
  } catch (error) {
    console.error("Error fetching random actor:", error)
    throw error
  }
}

// Search for actors in a specific movie
export async function searchActorsByMovie(movieId: number): Promise<TMDBActor[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}&language=en-US`,
      { next: { revalidate: 86400 } }, // Cache for 1 day
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch movie credits: ${response.status}`)
    }

    const data = await response.json()
    return data.cast || []
  } catch (error) {
    console.error(`Error fetching actors for movie ${movieId}:`, error)
    throw error
  }
}

// Search for movies that an actor has appeared in
export async function searchMoviesByActor(
  actorId: number,
  filters: GameFilters = { includeAnimated: true, includeSequels: true, includeForeign: true },
): Promise<TMDBMovie[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/person/${actorId}/movie_credits?api_key=${API_KEY}&language=en-US`,
      { next: { revalidate: 86400 } }, // Cache for 1 day
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch actor movies: ${response.status}`)
    }

    const data = await response.json()
    let movies = data.cast || []

    // Apply filters if needed
    movies = movies.filter((movie) => {
      // Filter out animated movies if needed
      if (!filters.includeAnimated && isAnimatedMovie(movie)) {
        return false
      }

      // Filter out sequels if needed
      if (!filters.includeSequels && isLikelySequel(movie)) {
        return false
      }

      // Filter out foreign films if needed
      if (!filters.includeForeign && isForeignFilm(movie)) {
        return false
      }

      return true
    })

    return movies
  } catch (error) {
    console.error(`Error fetching movies for actor ${actorId}:`, error)
    throw error
  }
}
