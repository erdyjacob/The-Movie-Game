"use server"

import type { TMDBMovie, TMDBActor, Difficulty, GameFilters } from "@/lib/types"
import { getCachedItem, setCachedItem, clearExpiredCache, initializeCache } from "./api-cache"

const API_KEY = process.env.TMDB_API_KEY
const BASE_URL = "https://api.themoviedb.org/3"

// Animation genre ID in TMDB
const ANIMATION_GENRE_ID = 16
// Documentary genre ID in TMDB
const DOCUMENTARY_GENRE_ID = 99

// Minimum thresholds to filter out extremely niche content
const MIN_MOVIE_POPULARITY = 1.0
const MIN_MOVIE_VOTE_COUNT = 100
const MIN_ACTOR_POPULARITY = 1.0
const MIN_ACTOR_KNOWN_FOR_COUNT = 2

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

// Fallback data for when the API is unavailable
const FALLBACK_MOVIES = [
  {
    id: 1,
    title: "The Shawshank Redemption",
    poster_path: null,
    release_date: "1994-09-23",
    overview:
      "Framed in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison, where he puts his accounting skills to work for an amoral warden.",
    vote_count: 18430,
    popularity: 82.798,
    genre_ids: [18, 80],
    original_language: "en",
  },
  {
    id: 2,
    title: "The Godfather",
    poster_path: null,
    release_date: "1972-03-14",
    overview: "Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family.",
    vote_count: 14673,
    popularity: 70.254,
    genre_ids: [18, 80],
    original_language: "en",
  },
  {
    id: 3,
    title: "The Dark Knight",
    poster_path: null,
    release_date: "2008-07-16",
    overview:
      "Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets.",
    vote_count: 25264,
    popularity: 79.211,
    genre_ids: [18, 28, 80, 53],
    original_language: "en",
  },
]

const FALLBACK_ACTORS = [
  {
    id: 1,
    name: "Tom Hanks",
    profile_path: null,
    popularity: 60.123,
  },
  {
    id: 2,
    name: "Morgan Freeman",
    profile_path: null,
    popularity: 55.456,
  },
  {
    id: 3,
    name: "Leonardo DiCaprio",
    profile_path: null,
    popularity: 58.789,
  },
]

// Retry configuration
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 1000 // 1 second

// Request tracking for rate limiting
const requestTimestamps: number[] = []
const MAX_REQUESTS_PER_SECOND = 4 // TMDB allows 4 requests per second

// Initialize cache on server
if (typeof window !== "undefined") {
  initializeCache()
  // Clear expired items every hour
  setInterval(clearExpiredCache, 60 * 60 * 1000)
}

// Function to throttle requests to stay within rate limits
async function throttleRequests(): Promise<void> {
  const now = Date.now()

  // Remove timestamps older than 1 second
  while (requestTimestamps.length > 0 && now - requestTimestamps[0] > 1000) {
    requestTimestamps.shift()
  }

  // If we've made too many requests in the last second, wait
  if (requestTimestamps.length >= MAX_REQUESTS_PER_SECOND) {
    const oldestRequest = requestTimestamps[0]
    const timeToWait = 1000 - (now - oldestRequest) + 50 // Add 50ms buffer

    if (timeToWait > 0) {
      console.log(`Rate limiting: waiting ${timeToWait}ms before next request`)
      await new Promise((resolve) => setTimeout(resolve, timeToWait))
    }
  }

  // Add current timestamp to the list
  requestTimestamps.push(Date.now())
}

// Optimized fetch function with caching, retry logic, and rate limiting
async function cachedFetch(url: string, options: RequestInit = {}): Promise<any> {
  // Create a cache key from the URL and any body content
  const cacheKey = url + (options.body ? JSON.stringify(options.body) : "")

  // Check if we have a valid cached response
  const cachedResponse = getCachedItem<any>(cacheKey)
  if (cachedResponse) {
    console.log(`Cache hit for: ${url.substring(0, 50)}...`)
    return cachedResponse
  }

  console.log(`Cache miss for: ${url.substring(0, 50)}...`)

  // Apply rate limiting
  await throttleRequests()

  // Implement retry logic with exponential backoff
  let lastError: Error | null = null
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Add a small delay between retries (except for the first attempt)
      if (attempt > 0) {
        const backoffDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1)
        await new Promise((resolve) => setTimeout(resolve, backoffDelay))
        console.log(`Retry attempt ${attempt + 1} for: ${url.substring(0, 50)}...`)
      }

      const response = await fetch(url, {
        ...options,
        next: { revalidate: 60 }, // Add revalidation to help with caching
      })

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`)
      }

      const data = await response.json()

      // Cache the response
      setCachedItem(cacheKey, data, url)

      return data
    } catch (error) {
      console.error(`Error fetching ${url} (attempt ${attempt + 1}):`, error)
      lastError = error instanceof Error ? error : new Error(String(error))
    }
  }

  // If we get here, all retry attempts failed
  console.error(`All retry attempts failed for: ${url}`)

  // Check if we have an older cached version we can use
  const cachedItem = getCachedItem<any>(cacheKey)
  if (cachedItem) {
    console.log(`Using expired cache for: ${url.substring(0, 50)}...`)
    return cachedItem
  }

  // If this is a movie credits request, return a fallback
  if (url.includes("/movie/") && url.includes("/credits")) {
    console.log(`Using fallback data for movie credits`)
    return {
      id: Number.parseInt(url.split("/movie/")[1].split("/")[0]),
      cast: FALLBACK_ACTORS.map((actor) => ({
        ...actor,
        character: "Character",
      })),
    }
  }

  // If this is an actor movie credits request, return a fallback
  if (url.includes("/person/") && url.includes("/movie_credits")) {
    console.log(`Using fallback data for actor movie credits`)
    return {
      id: Number.parseInt(url.split("/person/")[1].split("/")[0]),
      cast: FALLBACK_MOVIES,
    }
  }

  // For other requests, return appropriate fallback data
  if (url.includes("/discover/movie")) {
    console.log(`Using fallback movie data`)
    return { results: FALLBACK_MOVIES }
  }

  if (url.includes("/person/popular")) {
    console.log(`Using fallback actor data`)
    return { results: FALLBACK_ACTORS }
  }

  // If we can't determine a specific fallback, throw the last error
  throw lastError || new Error(`Failed to fetch ${url} after ${MAX_RETRIES} attempts`)
}

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

// Function to check if a movie is a documentary
function isDocumentary(movie: TMDBMovie): boolean {
  // Check if genre_ids array contains the documentary genre ID
  if (movie.genre_ids && Array.isArray(movie.genre_ids)) {
    return movie.genre_ids.includes(DOCUMENTARY_GENRE_ID)
  }

  // If the movie has genres array instead of genre_ids
  if (movie.genres && Array.isArray(movie.genres)) {
    return movie.genres.some((genre) => genre.id === DOCUMENTARY_GENRE_ID)
  }

  // Check title and overview for documentary keywords
  const title = movie.title?.toLowerCase() || ""
  const overview = movie.overview?.toLowerCase() || ""
  const documentaryKeywords = [
    "documentary",
    "documenting",
    "real-life story",
    "true story",
    "behind the scenes",
    "making of",
  ]

  return documentaryKeywords.some((keyword) => title.includes(keyword) || overview.includes(keyword))
}

// Function to check if a movie is too niche (extremely low popularity or vote count)
function isTooNicheMovie(movie: TMDBMovie): boolean {
  const popularity = movie.popularity || 0
  const voteCount = movie.vote_count || 0

  // Filter out movies with extremely low popularity or very few votes
  if (popularity < MIN_MOVIE_POPULARITY || voteCount < MIN_MOVIE_VOTE_COUNT) {
    return true
  }

  // Filter out movies without a poster (often indicates very obscure content)
  if (!movie.poster_path) {
    return true
  }

  return false
}

// Function to check if an actor is too niche
function isTooNicheActor(actor: TMDBActor): boolean {
  const popularity = actor.popularity || 0

  // Filter out actors with extremely low popularity
  if (popularity < MIN_ACTOR_POPULARITY) {
    return true
  }

  // Only filter out actors without a profile image if they also have low popularity
  // This ensures we don't lose too many valid actors
  if (!actor.profile_path && popularity < 5) {
    return true
  }

  // Make the known_for check optional since it's not always available in all API responses
  if (actor.known_for && actor.known_for.length < MIN_ACTOR_KNOWN_FOR_COUNT && popularity < 3) {
    return true
  }

  return false
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

// Batch size for prefetching
const PREFETCH_BATCH_SIZE = 5

// Prefetch and cache popular movies and actors
export async function prefetchGameData(difficulty: Difficulty = "medium"): Promise<void> {
  try {
    // Prefetch a batch of popular movies
    const moviePromise = cachedFetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=popularity.desc&page=1&vote_count.gte=${MIN_MOVIE_VOTE_COUNT}&without_genres=${DOCUMENTARY_GENRE_ID}`,
      { cache: "no-store" },
    )

    // Prefetch a batch of popular actors
    const actorPromise = cachedFetch(`${BASE_URL}/person/popular?api_key=${API_KEY}&language=en-US&page=1`, {
      cache: "no-store",
    })

    // Execute both requests in parallel
    const [movieData, actorData] = await Promise.all([moviePromise, actorPromise])

    console.log(`Prefetched ${movieData.results.length} movies and ${actorData.results.length} actors`)

    // Optionally prefetch details for the top few movies and actors
    const topMovies = movieData.results.slice(0, PREFETCH_BATCH_SIZE)
    const topActors = actorData.results.slice(0, PREFETCH_BATCH_SIZE)

    // Prefetch credits for top movies (to get actors)
    const movieCreditsPromises = topMovies.map((movie: TMDBMovie) =>
      cachedFetch(`${BASE_URL}/movie/${movie.id}/credits?api_key=${API_KEY}&language=en-US`, {
        cache: "no-store",
      }).catch((err) => console.error(`Failed to prefetch credits for movie ${movie.id}:`, err)),
    )

    // Prefetch movie credits for top actors
    const actorMoviesPromises = topActors.map((actor: TMDBActor) =>
      cachedFetch(`${BASE_URL}/person/${actor.id}/movie_credits?api_key=${API_KEY}&language=en-US`, {
        cache: "no-store",
      }).catch((err) => console.error(`Failed to prefetch movies for actor ${actor.id}:`, err)),
    )

    // Execute all prefetch requests in parallel
    await Promise.allSettled([...movieCreditsPromises, ...actorMoviesPromises])

    console.log("Prefetching complete")
  } catch (error) {
    console.error("Error during prefetching:", error)
    // Continue even if prefetching fails
  }
}

// Add this near the top of the file with other constants
// Keep track of recently used movies and actors to avoid repetition
const recentlyUsedMovieIds: number[] = []
const recentlyUsedActorIds: number[] = []
const MAX_RECENT_ITEMS = 10 // Remember the last 10 items

// Keep track of recently used actor types to avoid repetition
const recentlyUsedActorTypes: string[] = []
const MAX_RECENT_ACTOR_TYPES = 5

// Function to check if an actor type is recently used
function isRecentlyUsedActorType(actor: TMDBActor): boolean {
  // Extract potential actor type (first word of name)
  const name = actor.name || ""
  const actorType = name.split(" ")[0].toLowerCase()

  return recentlyUsedActorTypes.some((type) => type === actorType)
}

// Function to add an actor type to the recently used list
function addToRecentActorTypes(actor: TMDBActor) {
  // Extract potential actor type (first word of name)
  const name = actor.name || ""
  const actorType = name.split(" ")[0].toLowerCase()

  // Only add if it's not already in the list
  if (!recentlyUsedActorTypes.includes(actorType)) {
    recentlyUsedActorTypes.push(actorType)

    // Keep the list at a maximum size
    if (recentlyUsedActorTypes.length > MAX_RECENT_ACTOR_TYPES) {
      recentlyUsedActorTypes.shift()
    }
  }
}

// Update the getRandomMovie function to avoid recently used movies
export async function getRandomMovie(
  difficulty: Difficulty = "medium",
  filters: GameFilters = { includeAnimated: true, includeSequels: true, includeForeign: true },
): Promise<TMDBMovie> {
  try {
    const thresholds = getMovieDifficultyThresholds(difficulty)

    // Increase the page range significantly to get more variety
    const maxPages = difficulty === "easy" ? 10 : difficulty === "medium" ? 15 : 20

    // Use a more random page selection with better distribution
    const page = Math.floor(Math.random() * maxPages) + 1

    // Vary the sort methods more to increase variety
    let sortOptions = ["popularity.desc", "vote_count.desc", "vote_average.desc", "primary_release_date.desc"]
    let sortBy = sortOptions[Math.floor(Math.random() * sortOptions.length)]

    // For hard difficulty, add more variety with ascending sorts
    if (difficulty === "hard") {
      sortOptions = [...sortOptions, "popularity.asc", "vote_average.asc", "primary_release_date.asc"]
      sortBy = sortOptions[Math.floor(Math.random() * sortOptions.length)]
    }

    // Build the API URL
    let apiUrl = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=${sortBy}&page=${page}&vote_count.gte=${MIN_MOVIE_VOTE_COUNT}`

    // If we're excluding animated movies, add a filter
    if (!filters.includeAnimated) {
      apiUrl += `&without_genres=${ANIMATION_GENRE_ID}`
    }

    // Always exclude documentaries
    apiUrl += `&without_genres=${DOCUMENTARY_GENRE_ID}`

    // If we're excluding foreign films, add a filter for English language only
    if (!filters.includeForeign) {
      apiUrl += `&with_original_language=en`
    }

    // Add a random year range to increase variety (for medium and hard difficulties)
    if (difficulty !== "easy") {
      const currentYear = new Date().getFullYear()
      const startYear = Math.max(1970, currentYear - Math.floor(Math.random() * 50))
      const endYear = Math.min(currentYear, startYear + Math.floor(Math.random() * 20) + 5)
      apiUrl += `&primary_release_date.gte=${startYear}-01-01&primary_release_date.lte=${endYear}-12-31`
    }

    console.log("API URL:", apiUrl)

    const data = await cachedFetch(apiUrl, { cache: "no-store" })
    let movies = data.results

    console.log(`Fetched ${movies.length} movies before filtering`)

    // Filter out recently used movies
    movies = movies.filter((movie) => !recentlyUsedMovieIds.includes(movie.id))

    // Filter movies based on difficulty and other criteria
    movies = movies.filter((movie: TMDBMovie) => {
      // Filter out extremely niche movies
      if (isTooNicheMovie(movie)) {
        return false
      }

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

      // Always filter out documentaries
      if (isDocumentary(movie)) {
        console.log(`Filtering out documentary: ${movie.title}`)
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
        // Still filter out recently used movies
        if (recentlyUsedMovieIds.includes(movie.id)) {
          return false
        }

        // Filter out extremely niche movies
        if (isTooNicheMovie(movie)) {
          return false
        }

        // Still apply the essential filters
        if (!filters.includeAnimated && isAnimatedMovie(movie)) {
          return false
        }

        // Always filter out documentaries
        if (isDocumentary(movie)) {
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
      let fallbackUrl = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=vote_count.desc&page=${Math.floor(Math.random() * 5) + 1}&vote_count.gte=${MIN_MOVIE_VOTE_COUNT}`

      if (!filters.includeAnimated) {
        fallbackUrl += `&without_genres=${ANIMATION_GENRE_ID}`
      }

      // Always exclude documentaries
      fallbackUrl += `&without_genres=${DOCUMENTARY_GENRE_ID}`

      if (!filters.includeForeign) {
        fallbackUrl += `&with_original_language=en`
      }

      const fallbackData = await cachedFetch(fallbackUrl, { cache: "no-store" })

      movies = fallbackData.results.filter((movie) => {
        // Still filter out recently used movies
        if (recentlyUsedMovieIds.includes(movie.id)) {
          return false
        }

        // Filter out extremely niche movies
        if (isTooNicheMovie(movie)) {
          return false
        }

        if (!filters.includeAnimated && isAnimatedMovie(movie)) {
          return false
        }

        // Always filter out documentaries
        if (isDocumentary(movie)) {
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

    // If we still have no movies, use fallback data
    if (movies.length === 0) {
      console.log("Using fallback movie data")
      // Filter out recently used fallback movies
      movies = FALLBACK_MOVIES.filter((movie) => !recentlyUsedMovieIds.includes(movie.id))

      // If all fallbacks have been used recently, just use all of them
      if (movies.length === 0) {
        movies = FALLBACK_MOVIES
      }
    }

    // Pick a random movie from the filtered results
    const randomIndex = Math.floor(Math.random() * movies.length)
    const selectedMovie = movies[randomIndex]

    // Add this movie's franchise to recently used list
    addToRecentFranchises(selectedMovie)

    // Add this movie to recently used movies
    recentlyUsedMovieIds.push(selectedMovie.id)
    if (recentlyUsedMovieIds.length > MAX_RECENT_ITEMS) {
      recentlyUsedMovieIds.shift() // Remove oldest item
    }

    console.log(
      `Selected movie: ${selectedMovie.title}, Animated: ${isAnimatedMovie(selectedMovie)}, Foreign: ${isForeignFilm(selectedMovie)}`,
    )

    return selectedMovie
  } catch (error) {
    console.error("Error fetching random movie:", error)
    // Return a fallback movie if all else fails
    return FALLBACK_MOVIES[Math.floor(Math.random() * FALLBACK_MOVIES.length)]
  }
}

// Update the getRandomActor function to avoid recently used actors
export async function getRandomActor(difficulty: Difficulty = "medium"): Promise<TMDBActor> {
  try {
    const thresholds = getActorDifficultyThresholds(difficulty)

    // Increase the page range significantly to get more variety
    const maxPages = difficulty === "easy" ? 10 : difficulty === "medium" ? 15 : 20

    // Use a more random page selection
    const page = Math.floor(Math.random() * maxPages) + 1

    const data = await cachedFetch(`${BASE_URL}/person/popular?api_key=${API_KEY}&language=en-US&page=${page}`, {
      cache: "no-store",
    })

    let actors = data.results

    // Filter out recently used actors
    actors = actors.filter((actor) => !recentlyUsedActorIds.includes(actor.id))

    // Filter out extremely niche actors first
    actors = actors.filter((actor: TMDBActor) => !isTooNicheActor(actor))

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
        (actor: TMDBActor) =>
          actor.popularity <= thresholds.maxPopularity &&
          actor.popularity >= MIN_ACTOR_POPULARITY && // Ensure not too obscure
          !isRecentlyUsedActorType(actor),
      )
    }

    // If no actors match the criteria, return any actor
    if (actors.length === 0) {
      console.log("No actors matched the criteria, using unfiltered results")
      actors = data.results.filter(
        (actor: TMDBActor) => !recentlyUsedActorIds.includes(actor.id) && !isTooNicheActor(actor),
      )

      // If still no actors, try with minimal filtering
      if (actors.length === 0) {
        actors = data.results.filter(
          (actor: TMDBActor) => !recentlyUsedActorIds.includes(actor.id) && actor.profile_path !== null,
        )
      }

      // If still no actors, use fallback data
      if (actors.length === 0) {
        console.log("Using fallback actor data")
        // Filter out recently used fallback actors
        actors = FALLBACK_ACTORS.filter((actor) => !recentlyUsedActorIds.includes(actor.id))

        // If all fallbacks have been used recently, just use all of them
        if (actors.length === 0) {
          actors = FALLBACK_ACTORS
        }
      }
    }

    // Pick a truly random actor from the filtered results
    const randomIndex = Math.floor(Math.random() * actors.length)
    const selectedActor = actors[randomIndex]

    // Add this actor type to recently used list
    addToRecentActorTypes(selectedActor)

    // Add this actor to recently used actors
    recentlyUsedActorIds.push(selectedActor.id)
    if (recentlyUsedActorIds.length > MAX_RECENT_ITEMS) {
      recentlyUsedActorIds.shift() // Remove oldest item
    }

    return selectedActor
  } catch (error) {
    console.error("Error fetching random actor:", error)
    // Return a fallback actor if all else fails
    return FALLBACK_ACTORS[Math.floor(Math.random() * FALLBACK_ACTORS.length)]
  }
}

// Search for actors in a specific movie
export async function searchActorsByMovie(movieId: number): Promise<TMDBActor[]> {
  try {
    const data = await cachedFetch(`${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}&language=en-US`, {})

    // Filter out extremely niche actors
    const filteredCast = (data.cast || []).filter((actor: TMDBActor) => !isTooNicheActor(actor))

    return filteredCast
  } catch (error) {
    console.error(`Error fetching actors for movie ${movieId}:`, error)
    // Return fallback actors if the API call fails
    return FALLBACK_ACTORS.map((actor) => ({
      ...actor,
      character: "Character",
    }))
  }
}

// Search for movies that an actor has appeared in
export async function searchMoviesByActor(
  actorId: number,
  filters: GameFilters = { includeAnimated: true, includeSequels: true, includeForeign: true },
): Promise<TMDBMovie[]> {
  try {
    const data = await cachedFetch(`${BASE_URL}/person/${actorId}/movie_credits?api_key=${API_KEY}&language=en-US`, {})

    let movies = data.cast || []

    // Filter out extremely niche movies first
    movies = movies.filter((movie: TMDBMovie) => !isTooNicheMovie(movie))

    // Apply filters if needed
    movies = movies.filter((movie) => {
      // Filter out animated movies if needed
      if (!filters.includeAnimated && isAnimatedMovie(movie)) {
        return false
      }

      // Always filter out documentaries
      if (isDocumentary(movie)) {
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

    // If no movies are found after filtering, return fallback movies
    if (movies.length === 0) {
      console.log(`No movies found for actor ${actorId} after filtering, using fallbacks`)
      return FALLBACK_MOVIES
    }

    return movies
  } catch (error) {
    console.error(`Error fetching movies for actor ${actorId}:`, error)
    // Return fallback movies if the API call fails
    return FALLBACK_MOVIES
  }
}

// Clear the cache (useful for testing or when memory usage is high)
export async function clearApiCache(): Promise<void> {
  // Declare apiCache
  const apiCache: { [key: string]: any } = (globalThis as any).apiCache || {}

  Object.keys(apiCache).forEach((key) => {
    delete apiCache[key]
  })
  console.log("API cache cleared")
}
