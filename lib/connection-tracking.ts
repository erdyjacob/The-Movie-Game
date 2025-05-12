// Define types for connections
export interface Connection {
  movieId: number
  actorId: number
  movieName: string
  actorName: string
  timestamp: string // ISO string
  gameId?: string // Optional game session identifier
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
      })

      // Save back to localStorage
      localStorage.setItem("movieGameConnections", JSON.stringify(connections))
    }
  } catch (error) {
    console.error("Error saving connection:", error)
  }
}

// Load all connections
export function loadConnections(): Connection[] {
  if (typeof window === "undefined") return []

  try {
    // Get explicitly saved connections
    const savedConnections = localStorage.getItem("movieGameConnections")
    const connections: Connection[] = savedConnections ? JSON.parse(savedConnections) : []

    // Also infer connections from player history and TMDB API data
    try {
      const playerHistory = localStorage.getItem("movieGamePlayerHistory")
      if (playerHistory) {
        const history = JSON.parse(playerHistory)

        // Get TMDB API data to find connections
        const tmdbData = localStorage.getItem("tmdbApiCache")
        if (tmdbData) {
          const apiCache = JSON.parse(tmdbData)

          // Create maps for quick lookups
          const movieToActorsMap: Record<number, { id: number; name: string }[]> = {}
          const actorToMoviesMap: Record<number, { id: number; title: string }[]> = {}
          const movieNames: Record<number, string> = {}
          const actorNames: Record<number, string> = {}

          // Extract movie credits data from cache
          Object.entries(apiCache).forEach(([key, value]: [string, any]) => {
            // Extract movie credits (actors in a movie)
            if (key.includes("/movie/") && key.includes("/credits") && value.data && value.data.cast) {
              const movieId = Number.parseInt(key.split("/movie/")[1].split("/")[0])
              const actors = value.data.cast.map((actor: any) => ({
                id: actor.id,
                name: actor.name,
              }))
              movieToActorsMap[movieId] = actors
            }

            // Extract actor movie credits (movies an actor was in)
            if (key.includes("/person/") && key.includes("/movie_credits") && value.data && value.data.cast) {
              const actorId = Number.parseInt(key.split("/person/")[1].split("/")[0])
              const movies = value.data.cast.map((movie: any) => ({
                id: movie.id,
                title: movie.title,
              }))
              actorToMoviesMap[actorId] = movies
            }

            // Extract movie details for names
            if (key.includes("/movie/") && !key.includes("/credits") && value.data && value.data.title) {
              const movieId = Number.parseInt(key.split("/movie/")[1].split("/")[0])
              movieNames[movieId] = value.data.title
            }

            // Extract actor details for names
            if (key.includes("/person/") && !key.includes("/movie_credits") && value.data && value.data.name) {
              const actorId = Number.parseInt(key.split("/person/")[1].split("/")[0])
              actorNames[actorId] = value.data.name
            }
          })

          // Build a set of all movie IDs and actor IDs in player history
          const movieIds = new Set(history.movies.map((m: any) => m.id))
          const actorIds = new Set(history.actors.map((a: any) => a.id))

          // Create a map of existing connections for quick lookup
          const existingConnections = new Set<string>()
          connections.forEach((conn) => {
            existingConnections.add(`${conn.movieId}-${conn.actorId}`)
          })

          // For each movie in player history, check all its actors
          movieIds.forEach((movieId: number) => {
            const actors = movieToActorsMap[movieId] || []

            // Find the movie name from history or cache
            const movieObj = history.movies.find((m: any) => m.id === movieId)
            const movieName = movieObj ? movieObj.name : movieNames[movieId] || `Movie ${movieId}`

            actors.forEach((actor) => {
              // Only add if the actor is also in player history
              if (actorIds.has(actor.id)) {
                const connectionKey = `${movieId}-${actor.id}`

                // Check if this connection already exists
                if (!existingConnections.has(connectionKey)) {
                  // Find actor name from history or cache
                  const actorObj = history.actors.find((a: any) => a.id === actor.id)
                  const actorName = actorObj ? actorObj.name : actor.name || actorNames[actor.id] || `Actor ${actor.id}`

                  connections.push({
                    movieId,
                    actorId: actor.id,
                    movieName,
                    actorName,
                    timestamp: new Date().toISOString(),
                  })

                  existingConnections.add(connectionKey)
                }
              }
            })
          })

          // For each actor in player history, check all their movies
          actorIds.forEach((actorId: number) => {
            const movies = actorToMoviesMap[actorId] || []

            // Find the actor name from history or cache
            const actorObj = history.actors.find((a: any) => a.id === actorId)
            const actorName = actorObj ? actorObj.name : actorNames[actorId] || `Actor ${actorId}`

            movies.forEach((movie) => {
              // Only add if the movie is also in player history
              if (movieIds.has(movie.id)) {
                const connectionKey = `${movie.id}-${actorId}`

                // Check if this connection already exists
                if (!existingConnections.has(connectionKey)) {
                  // Find movie name from history or cache
                  const movieObj = history.movies.find((m: any) => m.id === movie.id)
                  const movieName = movieObj
                    ? movieObj.name
                    : movie.title || movieNames[movie.id] || `Movie ${movie.id}`

                  connections.push({
                    movieId: movie.id,
                    actorId,
                    movieName,
                    actorName,
                    timestamp: new Date().toISOString(),
                  })

                  existingConnections.add(connectionKey)
                }
              }
            })
          })
        }
      }
    } catch (e) {
      console.error("Error inferring connections from player history:", e)
    }

    // Save the enhanced connections back to localStorage
    localStorage.setItem("movieGameConnections", JSON.stringify(connections))

    return connections
  } catch (error) {
    console.error("Error loading connections:", error)
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

  // Clear existing connections to rebuild them from scratch
  const savedConnections = localStorage.getItem("movieGameConnections")
  const explicitConnections: Connection[] = savedConnections ? JSON.parse(savedConnections) : []

  // Call loadConnections to rebuild all connections
  const allConnections = loadConnections()

  console.log(`Refreshed connections: ${allConnections.length} total (${explicitConnections.length} explicit)`)

  return allConnections
}
