"use server"

// Server action to validate if an actor was in a movie
export async function validateConnection(movieId: number, actorId: number, forceRefresh = false): Promise<boolean> {
  try {
    const apiKey = process.env.TMDB_API_KEY

    if (!apiKey) {
      console.error("TMDB API key not found in server environment")
      return false
    }

    // If we're just refreshing movie credits
    if (movieId > 0 && actorId === 0) {
      const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${apiKey}`, {
        cache: forceRefresh ? "no-store" : "default",
      })

      if (!response.ok) {
        console.error(`Failed to fetch movie credits: ${response.status}`)
        return false
      }

      const data = await response.json()

      // Return true to indicate successful refresh
      return true
    }

    // If we're just refreshing actor credits
    if (actorId > 0 && movieId === 0) {
      const response = await fetch(`https://api.themoviedb.org/3/person/${actorId}/movie_credits?api_key=${apiKey}`, {
        cache: forceRefresh ? "no-store" : "default",
      })

      if (!response.ok) {
        console.error(`Failed to fetch actor credits: ${response.status}`)
        return false
      }

      const data = await response.json()

      // Return true to indicate successful refresh
      return true
    }

    // If both movieId and actorId are provided, validate the connection
    if (movieId > 0 && actorId > 0) {
      // Try to fetch movie credits
      const movieResponse = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${apiKey}`, {
        cache: forceRefresh ? "no-store" : "default",
      })

      if (movieResponse.ok) {
        const movieData = await movieResponse.json()
        if (movieData.cast && Array.isArray(movieData.cast)) {
          const isInCast = movieData.cast.some((actor: any) => actor.id === actorId)
          if (isInCast) return true
        }
      }

      // Try to fetch actor movie credits
      const actorResponse = await fetch(
        `https://api.themoviedb.org/3/person/${actorId}/movie_credits?api_key=${apiKey}`,
        { cache: forceRefresh ? "no-store" : "default" },
      )

      if (actorResponse.ok) {
        const actorData = await actorResponse.json()
        if (actorData.cast && Array.isArray(actorData.cast)) {
          const isInFilmography = actorData.cast.some((movie: any) => movie.id === movieId)
          if (isInFilmography) return true
        }
      }
    }

    // If we get here, the connection couldn't be validated
    return false
  } catch (error) {
    console.error("Error in validateConnection server action:", error)
    return false
  }
}
