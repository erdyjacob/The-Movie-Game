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

    // Also infer connections from player history
    // This ensures we capture all possible connections
    try {
      const playerHistory = localStorage.getItem("movieGamePlayerHistory")
      if (playerHistory) {
        const history = JSON.parse(playerHistory)

        // Get TMDB API data to find connections
        const tmdbData = localStorage.getItem("tmdbApiCache")
        if (tmdbData) {
          const apiCache = JSON.parse(tmdbData)

          // Create a map of movie IDs to actor IDs
          const movieToActorsMap: Record<number, number[]> = {}
          const actorToMoviesMap: Record<number, number[]> = {}

          // Extract movie credits data from cache
          Object.entries(apiCache).forEach(([key, value]: [string, any]) => {
            if (key.includes("/movie/") && key.includes("/credits") && value.data && value.data.cast) {
              const movieId = Number.parseInt(key.split("/movie/")[1].split("/")[0])
              const actorIds = value.data.cast.map((actor: any) => actor.id)
              movieToActorsMap[movieId] = actorIds
            }

            if (key.includes("/person/") && key.includes("/movie_credits") && value.data && value.data.cast) {
              const actorId = Number.parseInt(key.split("/person/")[1].split("/")[0])
              const movieIds = value.data.cast.map((movie: any) => movie.id)
              actorToMoviesMap[actorId] = movieIds
            }
          })

          // Create connections for all movies and actors in player history
          const movieIds = history.movies.map((m: any) => m.id)
          const actorIds = history.actors.map((a: any) => a.id)

          // For each movie, connect to all its actors that are in player history
          movieIds.forEach((movieId: number) => {
            const actors = movieToActorsMap[movieId] || []
            actors.forEach((actorId: number) => {
              if (actorIds.includes(actorId)) {
                // Find movie and actor names
                const movie = history.movies.find((m: any) => m.id === movieId)
                const actor = history.actors.find((a: any) => a.id === actorId)

                if (movie && actor) {
                  // Check if this connection already exists
                  const connectionExists = connections.some(
                    (conn) => conn.movieId === movieId && conn.actorId === actorId,
                  )

                  if (!connectionExists) {
                    connections.push({
                      movieId,
                      actorId,
                      movieName: movie.name,
                      actorName: actor.name,
                      timestamp: new Date().toISOString(),
                    })
                  }
                }
              }
            })
          })

          // For each actor, connect to all their movies that are in player history
          actorIds.forEach((actorId: number) => {
            const movies = actorToMoviesMap[actorId] || []
            movies.forEach((movieId: number) => {
              if (movieIds.includes(movieId)) {
                // Find movie and actor names
                const movie = history.movies.find((m: any) => m.id === movieId)
                const actor = history.actors.find((a: any) => a.id === actorId)

                if (movie && actor) {
                  // Check if this connection already exists
                  const connectionExists = connections.some(
                    (conn) => conn.movieId === movieId && conn.actorId === actorId,
                  )

                  if (!connectionExists) {
                    connections.push({
                      movieId,
                      actorId,
                      movieName: movie.name,
                      actorName: actor.name,
                      timestamp: new Date().toISOString(),
                    })
                  }
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
