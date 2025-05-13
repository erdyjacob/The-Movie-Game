// Define types for connections
import { validateConnection } from "@/app/actions/validate-connection"

export interface Connection {
  movieId: number
  actorId: number
  movieName: string
  actorName: string
  timestamp: string // ISO string
  gameId?: string // Optional game session identifier
  source?: "explicit" | "inferred" | "manual" // How the connection was created
}

// Store for connections
export function saveConnection(movieId: number, actorId: number, movieName: string, actorName: string): void {
  if (typeof window === "undefined") return

  try {
    // Get existing connections
    const savedConnections = localStorage.getItem("movieGameConnections")
    const connections: Connection[] = savedConnections ? JSON.parse(savedConnections) : []

    // Check if this connection already exists
    const connectionExists = connections.some((conn) => conn.movieId === movieId && conn.actorId === actorId)

    if (!connectionExists) {
      // Add new connection
      connections.push({
        movieId,
        actorId,
        movieName,
        actorName,
        timestamp: new Date().toISOString(),
        source: "explicit", // This is an explicit connection made during gameplay
      })

      // Save back to localStorage
      localStorage.setItem("movieGameConnections", JSON.stringify(connections))
    }
  } catch (error) {
    console.error("Error saving connection:", error)
  }
}

// Helper function to safely parse JSON with a fallback
function safeParseJSON(jsonString: string | null, fallback: any = null): any {
  if (!jsonString) return fallback
  try {
    return JSON.parse(jsonString)
  } catch (e) {
    console.error("Error parsing JSON:", e)
    return fallback
  }
}

// Helper function to extract ID from TMDB API cache key
function extractId(key: string, type: "movie" | "person"): number | null {
  const parts = key.split("/")
  const index = parts.indexOf(type)
  if (index >= 0 && index + 1 < parts.length) {
    const id = Number.parseInt(parts[index + 1])
    return isNaN(id) ? null : id
  }
  return null
}

// Load all connections
export function loadConnections(): Connection[] {
  if (typeof window === "undefined") return []

  try {
    console.log("Loading connections...")

    // Get existing connections - NEVER clear these unless explicitly requested
    const savedConnections = localStorage.getItem("movieGameConnections")
    const connections: Connection[] = safeParseJSON(savedConnections, [])

    console.log(`Found ${connections.length} existing connections`)

    // Create a set of existing connections for quick lookup
    const existingConnectionsSet = new Set<string>()
    connections.forEach((conn) => {
      existingConnectionsSet.add(`${conn.movieId}-${conn.actorId}`)
    })

    // Get player history - this contains ALL historical unlocks
    const playerHistory = safeParseJSON(localStorage.getItem("movieGamePlayerHistory"), { movies: [], actors: [] })

    // Create maps of discovered movies and actors for quick lookup
    const discoveredMovies = new Map()
    playerHistory.movies.forEach((movie: any) => {
      discoveredMovies.set(movie.id, movie)
    })

    const discoveredActors = new Map()
    playerHistory.actors.forEach((actor: any) => {
      discoveredActors.set(actor.id, actor)
    })

    console.log(
      `Found ${discoveredMovies.size} discovered movies and ${discoveredActors.size} discovered actors in complete history`,
    )

    // If we have no discovered items, just return existing connections
    if (discoveredMovies.size === 0 || discoveredActors.size === 0) {
      return connections
    }

    // Get TMDB API cache
    const apiCache = safeParseJSON(localStorage.getItem("tmdbApiCache"), {})

    // If we have no API cache, just return existing connections
    if (Object.keys(apiCache).length === 0) {
      return connections
    }

    console.log(`Found ${Object.keys(apiCache).length} API cache entries`)

    // Extract movie credits (which actors are in which movies)
    const movieCredits = new Map<number, Set<number>>()
    const actorCredits = new Map<number, Set<number>>()
    const movieNames = new Map<number, string>()
    const actorNames = new Map<number, string>()

    // First pass: extract all movie and actor data from the API cache
    Object.entries(apiCache).forEach(([key, value]: [string, any]) => {
      if (!value || !value.data) return

      // Extract movie credits (actors in a movie)
      if (key.includes("/movie/") && key.includes("/credits")) {
        const movieId = extractId(key, "movie")
        if (!movieId) return

        const credits = value.data
        if (!credits.cast || !Array.isArray(credits.cast)) return

        // Create a set for this movie's actors if it doesn't exist
        if (!movieCredits.has(movieId)) {
          movieCredits.set(movieId, new Set())
        }

        // Add all cast members
        credits.cast.forEach((actor: any) => {
          if (!actor || !actor.id) return
          movieCredits.get(movieId)?.add(actor.id)

          // Store actor name
          if (actor.name) {
            actorNames.set(actor.id, actor.name)
          }
        })

        console.log(`Movie ${movieId} has ${movieCredits.get(movieId)?.size || 0} actors in credits`)
      }

      // Extract actor movie credits
      if (key.includes("/person/") && key.includes("/movie_credits")) {
        const actorId = extractId(key, "person")
        if (!actorId) return

        const credits = value.data
        if (!credits.cast || !Array.isArray(credits.cast)) return

        // Create a set for this actor's movies if it doesn't exist
        if (!actorCredits.has(actorId)) {
          actorCredits.set(actorId, new Set())
        }

        // Add all movies
        credits.cast.forEach((movie: any) => {
          if (!movie || !movie.id) return
          actorCredits.get(actorId)?.add(movie.id)

          // Store movie name
          if (movie.title) {
            movieNames.set(movie.id, movie.title)
          }
        })

        console.log(`Actor ${actorId} has ${actorCredits.get(actorId)?.size || 0} movies in credits`)
      }

      // Extract movie details for names
      if (key.includes("/movie/") && !key.includes("/credits") && value.data && value.data.title) {
        const movieId = extractId(key, "movie")
        if (movieId) {
          movieNames.set(movieId, value.data.title)
        }
      }

      // Extract actor details for names
      if (key.includes("/person/") && !key.includes("/movie_credits") && value.data && value.data.name) {
        const actorId = extractId(key, "person")
        if (actorId) {
          actorNames.set(actorId, value.data.name)
        }
      }
    })

    console.log(`Extracted credits for ${movieCredits.size} movies and ${actorCredits.size} actors from API cache`)

    // Now create connections based on the extracted data
    let newConnectionsCount = 0

    // For each discovered movie, check if any discovered actors are in its cast
    discoveredMovies.forEach((movieData, movieId) => {
      const actorsInMovie = movieCredits.get(movieId)
      if (!actorsInMovie) {
        console.log(`No credit data found for movie ${movieId} (${movieData.name})`)
        return
      }

      // Check each actor in this movie
      actorsInMovie.forEach((actorId) => {
        // Only create connection if we've discovered this actor
        if (!discoveredActors.has(actorId)) return

        // Check if this connection already exists
        const connectionKey = `${movieId}-${actorId}`
        if (existingConnectionsSet.has(connectionKey)) return

        // Get names for the connection
        const movieName = movieData.name || movieNames.get(movieId) || `Movie ${movieId}`
        const actorData = discoveredActors.get(actorId)
        const actorName = actorData.name || actorNames.get(actorId) || `Actor ${actorId}`

        // Create the new connection
        connections.push({
          movieId,
          actorId,
          movieName,
          actorName,
          timestamp: new Date().toISOString(),
          source: "inferred", // This is an inferred connection
        })

        // Add to our set to avoid duplicates
        existingConnectionsSet.add(connectionKey)
        newConnectionsCount++
      })
    })

    // For each discovered actor, check if any discovered movies are in their filmography
    discoveredActors.forEach((actorData, actorId) => {
      const moviesForActor = actorCredits.get(actorId)
      if (!moviesForActor) {
        console.log(`No credit data found for actor ${actorId} (${actorData.name})`)
        return
      }

      // Check each movie this actor was in
      moviesForActor.forEach((movieId) => {
        // Only create connection if we've discovered this movie
        if (!discoveredMovies.has(movieId)) return

        // Check if this connection already exists
        const connectionKey = `${movieId}-${actorId}`
        if (existingConnectionsSet.has(connectionKey)) return

        // Get names for the connection
        const movieData = discoveredMovies.get(movieId)
        const movieName = movieData.name || movieNames.get(movieId) || `Movie ${movieId}`
        const actorName = actorData.name || actorNames.get(actorId) || `Actor ${actorId}`

        // Create the new connection
        connections.push({
          movieId,
          actorId,
          movieName,
          actorName,
          timestamp: new Date().toISOString(),
          source: "inferred", // This is an inferred connection
        })

        // Add to our set to avoid duplicates
        existingConnectionsSet.add(connectionKey)
        newConnectionsCount++
      })
    })

    console.log(`Added ${newConnectionsCount} new inferred connections`)
    console.log(`Total connections: ${connections.length}`)

    // Save all connections back to localStorage
    localStorage.setItem("movieGameConnections", JSON.stringify(connections))

    return connections
  } catch (error) {
    console.error("Error loading connections:", error)

    // In case of error, try to return existing connections to avoid data loss
    try {
      const savedConnections = localStorage.getItem("movieGameConnections")
      if (savedConnections) {
        return JSON.parse(savedConnections)
      }
    } catch (e) {
      console.error("Failed to recover existing connections:", e)
    }

    return []
  }
}

// Clear all connections
export function clearConnections(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem("movieGameConnections")
}

// Function to manually refresh all connections
export function refreshAllConnections(): Connection[] {
  if (typeof window === "undefined") return []

  try {
    console.log("Refreshing connections...")

    // IMPORTANT: We no longer clear existing connections
    // This ensures we don't lose data if something goes wrong

    // Just call loadConnections to add any new connections
    const allConnections = loadConnections()

    console.log(`Refreshed connections: ${allConnections.length} total`)

    return allConnections
  } catch (error) {
    console.error("Error refreshing connections:", error)

    // In case of error, try to return existing connections
    try {
      const savedConnections = localStorage.getItem("movieGameConnections")
      if (savedConnections) {
        return JSON.parse(savedConnections)
      }
    } catch (e) {
      console.error("Failed to recover existing connections:", e)
    }

    return []
  }
}

// Debug function to log connection data
export function debugConnectionData(): void {
  if (typeof window === "undefined") return

  console.log("=== CONNECTION DEBUG INFO ===")

  // Log player history
  const playerHistory = safeParseJSON(localStorage.getItem("movieGamePlayerHistory"), { movies: [], actors: [] })
  console.log(`Player History: ${playerHistory.movies.length} movies, ${playerHistory.actors.length} actors`)

  // Log sample movie and actor
  if (playerHistory.movies.length > 0) {
    console.log("Sample movie:", playerHistory.movies[0])
  }
  if (playerHistory.actors.length > 0) {
    console.log("Sample actor:", playerHistory.actors[0])
  }

  // Log API cache info
  const apiCache = safeParseJSON(localStorage.getItem("tmdbApiCache"), {})
  console.log(`API Cache: ${Object.keys(apiCache).length} entries`)

  // Find sample movie credits and actor credits
  const movieCreditsKey = Object.keys(apiCache).find((key) => key.includes("/movie/") && key.includes("/credits"))
  const actorCreditsKey = Object.keys(apiCache).find(
    (key) => key.includes("/person/") && key.includes("/movie_credits"),
  )

  if (movieCreditsKey) {
    console.log("Sample movie credits key:", movieCreditsKey)
    console.log("Sample movie credits data structure:", Object.keys(apiCache[movieCreditsKey]?.data || {}))
    if (apiCache[movieCreditsKey]?.data?.cast) {
      console.log("Sample cast entry:", apiCache[movieCreditsKey].data.cast[0])
    }
  }

  if (actorCreditsKey) {
    console.log("Sample actor credits key:", actorCreditsKey)
    console.log("Sample actor credits data structure:", Object.keys(apiCache[actorCreditsKey]?.data || {}))
    if (apiCache[actorCreditsKey]?.data?.cast) {
      console.log("Sample movie entry:", apiCache[actorCreditsKey].data.cast[0])
    }
  }

  // Log connections
  const connections = safeParseJSON(localStorage.getItem("movieGameConnections"), [])
  console.log(`Connections: ${connections.length} total`)
  if (connections.length > 0) {
    console.log("Sample connection:", connections[0])
  }

  console.log("=== END DEBUG INFO ===")
}

// Function to check if an actor was in a movie using TMDB API cache
export async function validateActorInMovie(movieId: number, actorId: number): Promise<boolean> {
  if (typeof window === "undefined") return false

  try {
    // First check the API cache
    const apiCache = safeParseJSON(localStorage.getItem("tmdbApiCache"), {})

    // Look for movie credits in cache
    const movieCreditsKey = Object.keys(apiCache).find((key) => key.includes(`/movie/${movieId}/credits`))

    if (movieCreditsKey && apiCache[movieCreditsKey]?.data?.cast) {
      // Check if actor is in the cast
      const isInCast = apiCache[movieCreditsKey].data.cast.some((actor: any) => actor.id === actorId)
      if (isInCast) return true
    }

    // Look for actor movie credits in cache
    const actorCreditsKey = Object.keys(apiCache).find((key) => key.includes(`/person/${actorId}/movie_credits`))

    if (actorCreditsKey && apiCache[actorCreditsKey]?.data?.cast) {
      // Check if movie is in the actor's filmography
      const isInFilmography = apiCache[actorCreditsKey].data.cast.some((movie: any) => movie.id === movieId)
      if (isInFilmography) return true
    }

    // If not found in cache, we'll need to use the server action
    // We can't access the API key directly in client code
    return false
  } catch (error) {
    console.error("Error validating actor in movie:", error)
    return false
  }
}

// Function to manually add a connection after validation
export async function addManualConnection(
  movieId: number,
  actorId: number,
  movieName: string,
  actorName: string,
): Promise<{ success: boolean; message: string }> {
  if (typeof window === "undefined") return { success: false, message: "Cannot run in server environment" }

  try {
    // First check if this connection already exists
    const savedConnections = localStorage.getItem("movieGameConnections")
    const connections: Connection[] = safeParseJSON(savedConnections, [])

    const connectionExists = connections.some((conn) => conn.movieId === movieId && conn.actorId === actorId)

    if (connectionExists) {
      return { success: false, message: "Connection already exists" }
    }

    // Validate that the actor was actually in the movie
    // First check the cache
    let isValid = await validateActorInMovie(movieId, actorId)

    // If not found in cache, use the server action
    if (!isValid) {
      console.log("Validating connection using server action...")
      isValid = await validateConnection(movieId, actorId)
    }

    if (!isValid) {
      return {
        success: false,
        message: "Could not verify that this actor appeared in this movie",
      }
    }

    // Add the new connection
    connections.push({
      movieId,
      actorId,
      movieName,
      actorName,
      timestamp: new Date().toISOString(),
      source: "manual", // This is a manually added connection
    })

    // Save back to localStorage
    localStorage.setItem("movieGameConnections", JSON.stringify(connections))

    return {
      success: true,
      message: `Successfully connected ${actorName} to ${movieName}`,
    }
  } catch (error) {
    console.error("Error adding manual connection:", error)
    return {
      success: false,
      message: "An error occurred while adding the connection",
    }
  }
}

// NEW DEBUGGING FUNCTIONS

// Function to inspect cache for a specific movie
export async function inspectCacheForMovie(movieId: number): Promise<any> {
  if (typeof window === "undefined") return null

  try {
    const apiCache = safeParseJSON(localStorage.getItem("tmdbApiCache"), {})

    // Find movie details in cache
    const movieDetailsKey = Object.keys(apiCache).find(
      (key) => key.includes(`/movie/${movieId}`) && !key.includes("/credits"),
    )

    // Find movie credits in cache
    const movieCreditsKey = Object.keys(apiCache).find((key) => key.includes(`/movie/${movieId}/credits`))

    const result: any = {
      movieId,
      movieDetailsKey,
      movieCreditsKey,
      movieDetails: null,
      movieCredits: null,
      actorInCredits: false,
    }

    // Extract movie details
    if (movieDetailsKey && apiCache[movieDetailsKey]?.data) {
      result.movieDetails = apiCache[movieDetailsKey].data
    }

    // Extract movie credits
    if (movieCreditsKey && apiCache[movieCreditsKey]?.data) {
      result.movieCredits = apiCache[movieCreditsKey].data
    }

    return result
  } catch (error) {
    console.error("Error inspecting cache for movie:", error)
    return null
  }
}

// Function to inspect cache for a specific actor
export async function inspectCacheForActor(actorId: number): Promise<any> {
  if (typeof window === "undefined") return null

  try {
    const apiCache = safeParseJSON(localStorage.getItem("tmdbApiCache"), {})

    // Find actor details in cache
    const actorDetailsKey = Object.keys(apiCache).find(
      (key) => key.includes(`/person/${actorId}`) && !key.includes("/movie_credits"),
    )

    // Find actor credits in cache
    const actorCreditsKey = Object.keys(apiCache).find((key) => key.includes(`/person/${actorId}/movie_credits`))

    const result: any = {
      actorId,
      actorDetailsKey,
      actorCreditsKey,
      actorDetails: null,
      actorCredits: null,
      movieInCredits: false,
    }

    // Extract actor details
    if (actorDetailsKey && apiCache[actorDetailsKey]?.data) {
      result.actorDetails = apiCache[actorDetailsKey].data
    }

    // Extract actor credits
    if (actorCreditsKey && apiCache[actorCreditsKey]?.data) {
      result.actorCredits = apiCache[actorCreditsKey].data
    }

    return result
  } catch (error) {
    console.error("Error inspecting cache for actor:", error)
    return null
  }
}

// Function to test if a connection would be inferred
export async function testInferConnection(movieId: number, actorId: number): Promise<any> {
  if (typeof window === "undefined") return null

  try {
    // Check if connection already exists
    const savedConnections = localStorage.getItem("movieGameConnections")
    const connections: Connection[] = safeParseJSON(savedConnections, [])
    const connectionExists = connections.some((conn) => conn.movieId === movieId && conn.actorId === actorId)

    // Get player history
    const playerHistory = safeParseJSON(localStorage.getItem("movieGamePlayerHistory"), { movies: [], actors: [] })

    // Check if movie and actor are discovered
    const movieDiscovered = playerHistory.movies.some((movie: any) => movie.id === movieId)
    const actorDiscovered = playerHistory.actors.some((actor: any) => actor.id === actorId)

    // Get API cache
    const apiCache = safeParseJSON(localStorage.getItem("tmdbApiCache"), {})

    // Check movie credits
    const movieCreditsKey = Object.keys(apiCache).find((key) => key.includes(`/movie/${movieId}/credits`))

    let foundInMovieCredits = false
    if (movieCreditsKey && apiCache[movieCreditsKey]?.data?.cast) {
      foundInMovieCredits = apiCache[movieCreditsKey].data.cast.some((actor: any) => actor.id === actorId)
    }

    // Check actor credits
    const actorCreditsKey = Object.keys(apiCache).find((key) => key.includes(`/person/${actorId}/movie_credits`))

    let foundInActorCredits = false
    if (actorCreditsKey && apiCache[actorCreditsKey]?.data?.cast) {
      foundInActorCredits = apiCache[actorCreditsKey].data.cast.some((movie: any) => movie.id === movieId)
    }

    // Determine if connection would be inferred
    let wouldBeInferred = false
    let reason = ""

    if (!movieDiscovered) {
      reason = "Movie not discovered in player history"
    } else if (!actorDiscovered) {
      reason = "Actor not discovered in player history"
    } else if (!foundInMovieCredits && !foundInActorCredits) {
      reason = "Connection not found in either movie or actor credits"
    } else {
      wouldBeInferred = true
    }

    return {
      movieId,
      actorId,
      connectionExists,
      movieDiscovered,
      actorDiscovered,
      foundInMovieCredits,
      foundInActorCredits,
      wouldBeInferred,
      reason,
    }
  } catch (error) {
    console.error("Error testing inference connection:", error)
    return null
  }
}

// Function to force refresh movie credits
export async function forceRefreshMovieCredits(movieId: number): Promise<{ success: boolean; message: string }> {
  try {
    // We need to use the server action to refresh the credits
    const result = await validateConnection(movieId, 0, true)

    return {
      success: result,
      message: result ? "Successfully refreshed movie credits" : "Failed to refresh movie credits",
    }
  } catch (error) {
    console.error("Error refreshing movie credits:", error)
    return {
      success: false,
      message: "An error occurred while refreshing movie credits",
    }
  }
}

// Function to force refresh actor credits
export async function forceRefreshActorCredits(actorId: number): Promise<{ success: boolean; message: string }> {
  try {
    // We need to use the server action to refresh the credits
    const result = await validateConnection(0, actorId, true)

    return {
      success: result,
      message: result ? "Successfully refreshed actor credits" : "Failed to refresh actor credits",
    }
  } catch (error) {
    console.error("Error refreshing actor credits:", error)
    return {
      success: false,
      message: "An error occurred while refreshing actor credits",
    }
  }
}
