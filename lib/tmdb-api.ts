"use server"

import type { TMDBMovie, TMDBActor, Difficulty, GameFilters } from "@/lib/types"
import { getCachedItem, setCachedItem, clearExpiredCache } from "./api-cache"

// Check if API key exists but only log a warning, don't throw an error
const API_KEY = process.env.TMDB_API_KEY
if (!API_KEY) {
  console.warn("TMDB_API_KEY environment variable is not set. Using fallback data.")
}

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
    poster_path: "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
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
    poster_path: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
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
    poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    release_date: "2008-07-16",
    overview:
      "Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets.",
    vote_count: 25264,
    popularity: 79.211,
    genre_ids: [18, 28, 80, 53],
    original_language: "en",
  },
  {
    id: 4,
    title: "Pulp Fiction",
    poster_path: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    release_date: "1994-09-10",
    overview:
      "A burger-loving hit man, his philosophical partner, a drug-addled gangster's moll and a washed-up boxer converge in this sprawling, comedic crime caper.",
    vote_count: 21000,
    popularity: 65.432,
    genre_ids: [53, 80],
    original_language: "en",
  },
  {
    id: 5,
    title: "Fight Club",
    poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    release_date: "1999-10-15",
    overview:
      "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.",
    vote_count: 20500,
    popularity: 61.543,
    genre_ids: [18, 53],
    original_language: "en",
  },
  {
    id: 6,
    title: "Forrest Gump",
    poster_path: "/saHP97rTPS5eLmrLQEcANmKrsFl.jpg",
    release_date: "1994-07-06",
    overview:
      "A man with a low IQ has accomplished great things in his life and been present during significant historic events—in each case, far exceeding what anyone imagined he could do.",
    vote_count: 19800,
    popularity: 58.765,
    genre_ids: [35, 18, 10749],
    original_language: "en",
  },
  {
    id: 7,
    title: "Inception",
    poster_path: "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    release_date: "2010-07-15",
    overview:
      "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible.",
    vote_count: 19500,
    popularity: 55.987,
    genre_ids: [28, 878, 12],
    original_language: "en",
  },
  {
    id: 8,
    title: "The Matrix",
    poster_path: "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    release_date: "1999-03-30",
    overview:
      "Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents fighting the vast and powerful computers who now rule the earth.",
    vote_count: 19200,
    popularity: 53.219,
    genre_ids: [28, 878],
    original_language: "en",
  },
  {
    id: 9,
    title: "Goodfellas",
    poster_path: "/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg",
    release_date: "1990-09-12",
    overview:
      "The true story of Henry Hill, a half-Irish, half-Sicilian Brooklyn kid who is adopted by neighbourhood gangsters at an early age and climbs the ranks of a Mafia family under the guidance of Jimmy Conway.",
    vote_count: 18900,
    popularity: 50.432,
    genre_ids: [18, 80],
    original_language: "en",
  },
  {
    id: 10,
    title: "The Silence of the Lambs",
    poster_path: "/uS9m8OBk1A8eM9I042bx8XXpqAq.jpg",
    release_date: "1991-02-01",
    overview:
      "Clarice Starling is a top student at the FBI's training academy. Jack Crawford wants Clarice to interview Dr. Hannibal Lecter, a brilliant psychiatrist who is also a violent psychopath, serving life behind bars for various acts of murder and cannibalism.",
    vote_count: 18600,
    popularity: 48.765,
    genre_ids: [80, 18, 53, 27],
    original_language: "en",
  },
]

const FALLBACK_ACTORS = [
  {
    id: 1,
    name: "Tom Hanks",
    profile_path: "/xndWFsBlClOJFRdhSt4NBwiPq0o.jpg",
    popularity: 60.123,
    known_for: [
      { id: 6, title: "Forrest Gump" },
      { id: 11, title: "Saving Private Ryan" },
      { id: 12, title: "Cast Away" },
    ],
  },
  {
    id: 2,
    name: "Morgan Freeman",
    profile_path: "/oIciQWrLmUkXnwN9wkL2EC8q4r6.jpg",
    popularity: 55.456,
    known_for: [
      { id: 1, title: "The Shawshank Redemption" },
      { id: 13, title: "Se7en" },
      { id: 14, title: "The Dark Knight" },
    ],
  },
  {
    id: 3,
    name: "Leonardo DiCaprio",
    profile_path: "/wo2hJpn04vbtmh0B9utCFdsQhxM.jpg",
    popularity: 58.789,
    known_for: [
      { id: 15, title: "Titanic" },
      { id: 7, title: "Inception" },
      { id: 16, title: "The Wolf of Wall Street" },
    ],
  },
  {
    id: 4,
    name: "Robert De Niro",
    profile_path: "/cT8htcckIuyI1Lqwt1CvD02ynTh.jpg",
    popularity: 54.321,
    known_for: [
      { id: 17, title: "The Godfather Part II" },
      { id: 9, title: "Goodfellas" },
      { id: 18, title: "Taxi Driver" },
    ],
  },
  {
    id: 5,
    name: "Meryl Streep",
    profile_path: "/pU56HiYGgj5KnALsRmBjZGj6Qeo.jpg",
    popularity: 52.987,
    known_for: [
      { id: 19, title: "The Devil Wears Prada" },
      { id: 20, title: "Sophie's Choice" },
      { id: 21, title: "Mamma Mia!" },
    ],
  },
  // Add more fallback actors with common IDs that might be in the player history
  {
    id: 31,
    name: "Tom Cruise",
    profile_path: "/8qBylBsQf4llkGrWR3qAsOtOU8O.jpg",
    popularity: 57.123,
    known_for: [
      { id: 22, title: "Mission: Impossible" },
      { id: 23, title: "Top Gun" },
      { id: 24, title: "Minority Report" },
    ],
  },
  {
    id: 192,
    name: "Morgan Freeman",
    profile_path: "/oIciQWrLmUkXnwN9wkL2EC8q4r6.jpg",
    popularity: 55.456,
    known_for: [
      { id: 1, title: "The Shawshank Redemption" },
      { id: 13, title: "Se7en" },
      { id: 14, title: "The Dark Knight" },
    ],
  },
  {
    id: 203,
    name: "Daniel Radcliffe",
    profile_path: "/iPg0J9UzAlVRpYuXlTxPvXJVFFf.jpg",
    popularity: 48.765,
    known_for: [
      { id: 25, title: "Harry Potter and the Philosopher's Stone" },
      { id: 26, title: "Harry Potter and the Chamber of Secrets" },
      { id: 27, title: "Harry Potter and the Prisoner of Azkaban" },
    ],
  },
  {
    id: 287,
    name: "Brad Pitt",
    profile_path: "/kU3B75TyRiCgE270EyZnHjfivoq.jpg",
    popularity: 56.432,
    known_for: [
      { id: 5, title: "Fight Club" },
      { id: 28, title: "Se7en" },
      { id: 29, title: "Ocean's Eleven" },
    ],
  },
  {
    id: 500,
    name: "Sigourney Weaver",
    profile_path: "/sLGN0VTyJ5ZElG6d5eW7xrYEKMB.jpg",
    popularity: 45.123,
    known_for: [
      { id: 30, title: "Alien" },
      { id: 31, title: "Avatar" },
      { id: 32, title: "Ghostbusters" },
    ],
  },
]

// Fallback movie credits data
const FALLBACK_MOVIE_CREDITS = {
  1: [1, 2], // Shawshank Redemption -> Tom Hanks, Morgan Freeman
  2: [4], // The Godfather -> Robert De Niro
  3: [2, 3], // The Dark Knight -> Morgan Freeman, Leonardo DiCaprio
  4: [4], // Pulp Fiction -> Robert De Niro
  5: [3, 287], // Fight Club -> Leonardo DiCaprio, Brad Pitt
  6: [1, 5], // Forrest Gump -> Tom Hanks, Meryl Streep
  7: [3], // Inception -> Leonardo DiCaprio
  8: [2], // The Matrix -> Morgan Freeman
  9: [4], // Goodfellas -> Robert De Niro
  10: [5], // The Silence of the Lambs -> Meryl Streep
}

// Fallback actor movie credits data
const FALLBACK_ACTOR_MOVIES = {
  1: [1, 6], // Tom Hanks -> Shawshank Redemption, Forrest Gump
  2: [1, 3, 8], // Morgan Freeman -> Shawshank Redemption, Dark Knight, Matrix
  3: [3, 5, 7], // Leonardo DiCaprio -> Dark Knight, Fight Club, Inception
  4: [2, 4, 9], // Robert De Niro -> Godfather, Pulp Fiction, Goodfellas
  5: [6, 10], // Meryl Streep -> Forrest Gump, Silence of the Lambs
  31: [22, 23, 24], // Tom Cruise -> Mission Impossible, Top Gun, Minority Report
  192: [1, 13, 14], // Morgan Freeman -> Shawshank Redemption, Se7en, Dark Knight
  203: [25, 26, 27], // Daniel Radcliffe -> Harry Potter movies
  287: [5, 28, 29], // Brad Pitt -> Fight Club, Se7en, Ocean's Eleven
  500: [30, 31, 32], // Sigourney Weaver -> Alien, Avatar, Ghostbusters
}

// Helper function to get fallback movie credits
function getFallbackMovieCredits(movieId: number): TMDBActor[] {
  const actorIds = FALLBACK_MOVIE_CREDITS[movieId as keyof typeof FALLBACK_MOVIE_CREDITS] || []
  return actorIds.map((id) => {
    // First try to find the exact actor ID
    const actor = FALLBACK_ACTORS.find((actor) => actor.id === id)
    if (actor) return actor

    // If not found, return the first fallback actor
    return FALLBACK_ACTORS[0]
  })
}

// Helper function to get fallback actor movies
function getFallbackActorMovies(actorId: number): TMDBMovie[] {
  const movieIds = FALLBACK_ACTOR_MOVIES[actorId as keyof typeof FALLBACK_ACTOR_MOVIES] || []

  // If we don't have specific fallback data for this actor ID, return some default movies
  if (movieIds.length === 0) {
    console.log(`No specific fallback data for actor ID ${actorId}, using default movies`)
    return FALLBACK_MOVIES.slice(0, 3)
  }

  return movieIds.map((id) => {
    // First try to find the exact movie ID
    const movie = FALLBACK_MOVIES.find((movie) => movie.id === id)
    if (movie) return movie

    // If not found, return the first fallback movie
    return FALLBACK_MOVIES[0]
  })
}

async function fetchTMDB(endpoint: string, cache: RequestCache = "force-cache") {
  // If API key is missing, use fallback data immediately
  if (!API_KEY) {
    console.warn(`Using fallback data for ${endpoint} because TMDB API key is not set.`)
    return getFallbackDataForEndpoint(endpoint)
  }

  const url = `${BASE_URL}${endpoint}${endpoint.includes("?") ? "&" : "?"}api_key=${API_KEY}&language=en-US`

  // Check cache first
  const cachedData = getCachedItem(url)
  if (cachedData) {
    return cachedData
  }

  try {
    const response = await fetch(url, { cache })

    // Handle 404 errors specifically - use fallback data
    if (response.status === 404) {
      console.warn(`Resource not found (404) for ${endpoint}, using fallback data`)
      const fallbackData = getFallbackDataForEndpoint(endpoint)
      setCachedItem(url, fallbackData, url) // Cache the fallback data to avoid repeated 404s
      return fallbackData
    }

    if (!response.ok) {
      console.error(`TMDB API error: ${response.status} ${response.statusText} for ${url}`)
      return getFallbackDataForEndpoint(endpoint)
    }

    const data = await response.json()
    setCachedItem(url, data, url)
    return data
  } catch (error) {
    console.error(`Failed to fetch data from TMDB API for ${url}:`, error)
    return getFallbackDataForEndpoint(endpoint)
  }
}

// Helper function to get appropriate fallback data based on the endpoint
function getFallbackDataForEndpoint(endpoint: string) {
  // Extract IDs from endpoints
  let movieId: number | null = null
  let actorId: number | null = null

  if (endpoint.includes("/movie/") && endpoint.includes("/credits")) {
    movieId = extractIdFromEndpoint(endpoint, "/movie/")
    return { cast: getFallbackMovieCredits(movieId || 1) }
  }

  if (endpoint.includes("/person/") && endpoint.includes("/movie_credits")) {
    actorId = extractIdFromEndpoint(endpoint, "/person/")
    return { cast: getFallbackActorMovies(actorId || 1) }
  }

  if (endpoint.includes("/discover/movie")) {
    return { results: FALLBACK_MOVIES }
  }

  if (endpoint.includes("/person/popular")) {
    return { results: FALLBACK_ACTORS }
  }

  // Default fallback
  return { results: [] }
}

// Helper function to extract IDs from endpoints
function extractIdFromEndpoint(endpoint: string, prefix: string): number | null {
  try {
    const parts = endpoint.split(prefix)[1].split("/")
    return Number.parseInt(parts[0])
  } catch (error) {
    console.error(`Failed to extract ID from endpoint ${endpoint}:`, error)
    return null
  }
}

export async function getRandomMovie(difficulty: Difficulty, filters: GameFilters): Promise<TMDBMovie> {
  clearExpiredCache()

  const page = Math.floor(Math.random() * 10) + 1 // Get a random page number (1-10)
  let discoverURL = `/discover/movie?page=${page}`

  // Exclude animated movies if the filter is set
  if (!filters.includeAnimated) {
    discoverURL += `&with_genres=-${ANIMATION_GENRE_ID}`
  }

  // Exclude foreign films if the filter is set
  if (!filters.includeForeign) {
    discoverURL += `&with_original_language=en`
  }

  const data = await fetchTMDB(discoverURL)

  if (!data || !data.results || data.results.length === 0) {
    console.warn("Using fallback movies due to API error or empty results.")
    return FALLBACK_MOVIES[Math.floor(Math.random() * FALLBACK_MOVIES.length)]
  }

  const movies = data.results.filter(
    (movie: TMDBMovie) =>
      movie.popularity &&
      movie.popularity > MIN_MOVIE_POPULARITY &&
      movie.vote_count &&
      movie.vote_count > MIN_MOVIE_VOTE_COUNT,
  )

  if (movies.length === 0) {
    console.warn("No movies matched the criteria, using fallback movies.")
    return FALLBACK_MOVIES[Math.floor(Math.random() * FALLBACK_MOVIES.length)]
  }

  const movie = movies[Math.floor(Math.random() * movies.length)]
  return movie
}

export async function getRandomActor(difficulty: Difficulty): Promise<TMDBActor> {
  clearExpiredCache()

  const page = Math.floor(Math.random() * 10) + 1 // Get a random page number (1-10)
  const data = await fetchTMDB(`/person/popular?page=${page}`)

  if (!data || !data.results || data.results.length === 0) {
    console.warn("Using fallback actors due to API error or empty results.")
    return FALLBACK_ACTORS[Math.floor(Math.random() * FALLBACK_ACTORS.length)]
  }

  const actors = data.results.filter(
    (actor: TMDBActor) =>
      actor.popularity &&
      actor.popularity > MIN_ACTOR_POPULARITY &&
      actor.known_for &&
      actor.known_for.length > MIN_ACTOR_KNOWN_FOR_COUNT,
  )

  if (actors.length === 0) {
    console.warn("No actors matched the criteria, using fallback actors.")
    return FALLBACK_ACTORS[Math.floor(Math.random() * FALLBACK_ACTORS.length)]
  }

  const actor = actors[Math.floor(Math.random() * actors.length)]
  return actor
}

export async function searchMoviesByActor(actorId: number, filters: GameFilters): Promise<TMDBMovie[]> {
  clearExpiredCache()

  const url = `/person/${actorId}/movie_credits`
  const data = await fetchTMDB(url)

  if (!data || !data.cast || data.cast.length === 0) {
    console.warn(`No movies found for actor ${actorId}, using fallback data`)
    return getFallbackActorMovies(actorId)
  }

  let movies = data.cast.filter(
    (movie: TMDBMovie) =>
      movie.popularity &&
      movie.popularity > MIN_MOVIE_POPULARITY &&
      movie.vote_count &&
      movie.vote_count > MIN_MOVIE_VOTE_COUNT,
  )

  // Exclude animated movies if the filter is set
  if (!filters.includeAnimated) {
    movies = movies.filter((movie: TMDBMovie) => !movie.genre_ids?.includes(ANIMATION_GENRE_ID))
  }

  // Exclude foreign films if the filter is set
  if (!filters.includeForeign) {
    movies = movies.filter((movie: TMDBMovie) => movie.original_language === "en")
  }

  // If no movies match the criteria after filtering, use fallback data
  if (movies.length === 0) {
    console.warn(`No movies matched criteria for actor ${actorId}, using fallback data`)
    return getFallbackActorMovies(actorId)
  }

  return movies
}

export async function searchActorsByMovie(movieId: number): Promise<TMDBActor[]> {
  clearExpiredCache()

  const url = `/movie/${movieId}/credits`
  const data = await fetchTMDB(url)

  if (!data || !data.cast || data.cast.length === 0) {
    console.warn(`No actors found for movie ${movieId}, using fallback data`)
    return getFallbackMovieCredits(movieId)
  }

  const actors = data.cast.filter((actor: TMDBActor) => actor.popularity && actor.popularity > MIN_ACTOR_POPULARITY)

  // If no actors match the criteria after filtering, use fallback data
  if (actors.length === 0) {
    console.warn(`No actors matched criteria for movie ${movieId}, using fallback data`)
    return getFallbackMovieCredits(movieId)
  }

  return actors
}

export async function prefetchGameData(difficulty?: Difficulty): Promise<void> {
  try {
    // Prefetch a random movie and actor to populate the cache
    await getRandomMovie(difficulty || "medium", {
      includeAnimated: false,
      includeSequels: true,
      includeForeign: false,
    })
    await getRandomActor(difficulty || "medium")

    console.log("Game data preloaded successfully")
  } catch (error) {
    console.error("Error prefetching game data:", error)
  }
}

export async function fetchAndCacheCredits({ id, type }: { id: number; type: string }): Promise<void> {
  try {
    if (type === "movie") {
      const url = `/movie/${id}/credits`
      await fetchTMDB(url)
    } else if (type === "actor") {
      const url = `/person/${id}/movie_credits`
      await fetchTMDB(url)
    }
  } catch (error) {
    console.error(`Error fetching and caching credits for ${type} ${id}:`, error)
  }
}

// Function to refresh all connections
export async function refreshAllConnections() {
  // Implementation would go here
  // This is a placeholder to avoid errors
  return []
}
