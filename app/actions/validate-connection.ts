"use server"

const API_KEY = process.env.TMDB_API_KEY
const BASE_URL = "https://api.themoviedb.org/3"

export async function validateConnection(movieId: number, actorId: number): Promise<boolean> {
  try {
    if (!API_KEY) {
      console.error("TMDB API key not found on server")
      return false
    }

    // Try to fetch movie credits
    try {
      const response = await fetch(`${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}`, {
        next: { revalidate: 60 },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.cast && Array.isArray(data.cast)) {
          const isInCast = data.cast.some((actor: any) => actor.id === actorId)
          if (isInCast) return true
        }
      }
    } catch (error) {
      console.error("Error fetching movie credits:", error)
    }

    // Try to fetch actor movie credits
    try {
      const response = await fetch(`${BASE_URL}/person/${actorId}/movie_credits?api_key=${API_KEY}`, {
        next: { revalidate: 60 },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.cast && Array.isArray(data.cast)) {
          const isInFilmography = data.cast.some((movie: any) => movie.id === movieId)
          if (isInFilmography) return true
        }
      }
    } catch (error) {
      console.error("Error fetching actor movie credits:", error)
    }

    // If we get here, the connection couldn't be validated
    return false
  } catch (error) {
    console.error("Error validating actor in movie:", error)
    return false
  }
}
