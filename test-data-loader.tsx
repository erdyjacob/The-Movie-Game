"use client"

import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import type { PlayerHistory, PlayerHistoryItem, Connection } from "@/lib/types"

// Mock movie data
const mockMovies = [
  // Legendary movies
  {
    id: 101,
    name: "The Shawshank Redemption",
    image: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
    rarity: "legendary",
    count: 3,
  },
  {
    id: 102,
    name: "The Godfather",
    image: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    rarity: "legendary",
    count: 2,
  },

  // Epic movies
  {
    id: 103,
    name: "The Dark Knight",
    image: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    rarity: "epic",
    count: 5,
  },
  {
    id: 104,
    name: "Pulp Fiction",
    image: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    rarity: "epic",
    count: 4,
  },
  {
    id: 105,
    name: "Fight Club",
    image: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    rarity: "epic",
    count: 3,
  },

  // Rare movies
  {
    id: 106,
    name: "Forrest Gump",
    image: "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
    rarity: "rare",
    count: 6,
  },
  {
    id: 107,
    name: "The Matrix",
    image: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    rarity: "rare",
    count: 5,
  },
  {
    id: 108,
    name: "Goodfellas",
    image: "https://image.tmdb.org/t/p/w500/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg",
    rarity: "rare",
    count: 4,
  },
  {
    id: 109,
    name: "Inception",
    image: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    rarity: "rare",
    count: 3,
  },

  // Uncommon movies
  {
    id: 110,
    name: "The Silence of the Lambs",
    image: "https://image.tmdb.org/t/p/w500/uS9m8OBk1A8eM9I042bx8XXpqAq.jpg",
    rarity: "uncommon",
    count: 7,
  },
  {
    id: 111,
    name: "The Lord of the Rings",
    image: "https://image.tmdb.org/t/p/w500/5VTN0pR8gcqV3EPUHHfMGnJYN9L.jpg",
    rarity: "uncommon",
    count: 6,
  },
  {
    id: 112,
    name: "Star Wars: A New Hope",
    image: "https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg",
    rarity: "uncommon",
    count: 5,
  },
  {
    id: 113,
    name: "Jurassic Park",
    image: "https://image.tmdb.org/t/p/w500/oU7Oq2kFAAlGqbU4VoAE36g4hoI.jpg",
    rarity: "uncommon",
    count: 4,
  },
  {
    id: 114,
    name: "Titanic",
    image: "https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg",
    rarity: "uncommon",
    count: 3,
  },

  // Common movies
  {
    id: 115,
    name: "Avatar",
    image: "https://image.tmdb.org/t/p/w500/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg",
    rarity: "common",
    count: 8,
  },
  {
    id: 116,
    name: "The Avengers",
    image: "https://image.tmdb.org/t/p/w500/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg",
    rarity: "common",
    count: 7,
  },
  {
    id: 117,
    name: "Spider-Man: No Way Home",
    image: "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
    rarity: "common",
    count: 6,
  },
  {
    id: 118,
    name: "Top Gun: Maverick",
    image: "https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
    rarity: "common",
    count: 5,
  },
  {
    id: 119,
    name: "Black Panther",
    image: "https://image.tmdb.org/t/p/w500/uxzzxijgPIY7slzFvMotPv8wjKA.jpg",
    rarity: "common",
    count: 4,
  },
  {
    id: 120,
    name: "Joker",
    image: "https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg",
    rarity: "common",
    count: 3,
  },
]

// Mock actor data
const mockActors = [
  // Legendary actors
  {
    id: 201,
    name: "Marlon Brando",
    image: "https://image.tmdb.org/t/p/w500/fuTEPMsBtV1zE98ujPONbKiYDc2.jpg",
    rarity: "legendary",
    count: 2,
  },
  {
    id: 202,
    name: "Katharine Hepburn",
    image: "https://image.tmdb.org/t/p/w500/nQD6UzVj6KVwjGrHMQgYyBr1pUc.jpg",
    rarity: "legendary",
    count: 1,
  },

  // Epic actors
  {
    id: 203,
    name: "Robert De Niro",
    image: "https://image.tmdb.org/t/p/w500/cT8htcckIuyI1Lqwt1CvD02ynTh.jpg",
    rarity: "epic",
    count: 4,
  },
  {
    id: 204,
    name: "Meryl Streep",
    image: "https://image.tmdb.org/t/p/w500/pU56HiYGf7QEut6BpyZgmAyK0C.jpg",
    rarity: "epic",
    count: 3,
  },
  {
    id: 205,
    name: "Jack Nicholson",
    image: "https://image.tmdb.org/t/p/w500/6h7numL1ZQ5zqR9qqrLGouDXIhh.jpg",
    rarity: "epic",
    count: 2,
  },

  // Rare actors
  {
    id: 206,
    name: "Morgan Freeman",
    image: "https://image.tmdb.org/t/p/w500/oIciQWr8VwKoR8TmAw1owaiZFyb.jpg",
    rarity: "rare",
    count: 5,
  },
  {
    id: 207,
    name: "Anthony Hopkins",
    image: "https://image.tmdb.org/t/p/w500/9ukJS2QWTJ22HcwR1ktMmoJ6RSL.jpg",
    rarity: "rare",
    count: 4,
  },
  {
    id: 208,
    name: "Jodie Foster",
    image: "https://image.tmdb.org/t/p/w500/7OtgzCwlrfGXvx6CcaOZ0zjtPsJ.jpg",
    rarity: "rare",
    count: 3,
  },
  {
    id: 209,
    name: "Al Pacino",
    image: "https://image.tmdb.org/t/p/w500/ks7Ba8x9fJUlP9decBr6Dh5mThX.jpg",
    rarity: "rare",
    count: 2,
  },

  // Uncommon actors
  {
    id: 210,
    name: "Leonardo DiCaprio",
    image: "https://image.tmdb.org/t/p/w500/wo2hJpn04vbtmh0B9utCFdsQhxM.jpg",
    rarity: "uncommon",
    count: 6,
  },
  {
    id: 211,
    name: "Tom Hanks",
    image: "https://image.tmdb.org/t/p/w500/xndWFsBlClOJFRdhSt4NBwiPq2o.jpg",
    rarity: "uncommon",
    count: 5,
  },
  {
    id: 212,
    name: "Brad Pitt",
    image: "https://image.tmdb.org/t/p/w500/oTB9vGIBacH5aQNS0pUM74QSWuf.jpg",
    rarity: "uncommon",
    count: 4,
  },
  {
    id: 213,
    name: "Denzel Washington",
    image: "https://image.tmdb.org/t/p/w500/jj2Gcobpopokal0YstuCQW0ldJ4.jpg",
    rarity: "uncommon",
    count: 3,
  },
  {
    id: 214,
    name: "Cate Blanchett",
    image: "https://image.tmdb.org/t/p/w500/vUuEHiAR0eD3XEJhg2DWIjymUAA.jpg",
    rarity: "uncommon",
    count: 2,
  },

  // Common actors
  {
    id: 215,
    name: "Dwayne Johnson",
    image: "https://image.tmdb.org/t/p/w500/kuqFzlYMc2IrsOyPznMd1FroeGq.jpg",
    rarity: "common",
    count: 7,
  },
  {
    id: 216,
    name: "Scarlett Johansson",
    image: "https://image.tmdb.org/t/p/w500/6NsMbJXRlDZuDzatN2akFdGuTvx.jpg",
    rarity: "common",
    count: 6,
  },
  {
    id: 217,
    name: "Chris Hemsworth",
    image: "https://image.tmdb.org/t/p/w500/jpurJ9jAcLCYjgHHfYF32m3zJYm.jpg",
    rarity: "common",
    count: 5,
  },
  {
    id: 218,
    name: "Jennifer Lawrence",
    image: "https://image.tmdb.org/t/p/w500/blKKsHlJIL9PmUQZB8f3YmMBW5Y.jpg",
    rarity: "common",
    count: 4,
  },
  {
    id: 219,
    name: "Robert Downey Jr.",
    image: "https://image.tmdb.org/t/p/w500/5qHNjhtjMD4YWH3UP0rm4tKwxCL.jpg",
    rarity: "common",
    count: 3,
  },
  {
    id: 220,
    name: "Tom Cruise",
    image: "https://image.tmdb.org/t/p/w500/gThaIXgpCm3wUm9txgOUzChJwsU.jpg",
    rarity: "common",
    count: 2,
  },
]

// Create connections between movies and actors
const createConnections = (): Connection[] => {
  const connections: Connection[] = [
    // The Shawshank Redemption connections
    {
      movieId: 101,
      actorId: 206,
      movieName: "The Shawshank Redemption",
      actorName: "Morgan Freeman",
      timestamp: new Date().toISOString(),
    },

    // The Godfather connections
    {
      movieId: 102,
      actorId: 201,
      movieName: "The Godfather",
      actorName: "Marlon Brando",
      timestamp: new Date().toISOString(),
    },
    {
      movieId: 102,
      actorId: 209,
      movieName: "The Godfather",
      actorName: "Al Pacino",
      timestamp: new Date().toISOString(),
    },

    // The Dark Knight connections
    {
      movieId: 103,
      actorId: 206,
      movieName: "The Dark Knight",
      actorName: "Morgan Freeman",
      timestamp: new Date().toISOString(),
    },

    // Pulp Fiction connections
    {
      movieId: 104,
      actorId: 212,
      movieName: "Pulp Fiction",
      actorName: "Brad Pitt",
      timestamp: new Date().toISOString(),
    },

    // Fight Club connections
    {
      movieId: 105,
      actorId: 212,
      movieName: "Fight Club",
      actorName: "Brad Pitt",
      timestamp: new Date().toISOString(),
    },

    // Forrest Gump connections
    {
      movieId: 106,
      actorId: 211,
      movieName: "Forrest Gump",
      actorName: "Tom Hanks",
      timestamp: new Date().toISOString(),
    },

    // The Matrix connections
    {
      movieId: 107,
      actorId: 220,
      movieName: "The Matrix",
      actorName: "Tom Cruise",
      timestamp: new Date().toISOString(),
    },

    // Goodfellas connections
    {
      movieId: 108,
      actorId: 203,
      movieName: "Goodfellas",
      actorName: "Robert De Niro",
      timestamp: new Date().toISOString(),
    },

    // Inception connections
    {
      movieId: 109,
      actorId: 210,
      movieName: "Inception",
      actorName: "Leonardo DiCaprio",
      timestamp: new Date().toISOString(),
    },

    // The Silence of the Lambs connections
    {
      movieId: 110,
      actorId: 207,
      movieName: "The Silence of the Lambs",
      actorName: "Anthony Hopkins",
      timestamp: new Date().toISOString(),
    },
    {
      movieId: 110,
      actorId: 208,
      movieName: "The Silence of the Lambs",
      actorName: "Jodie Foster",
      timestamp: new Date().toISOString(),
    },

    // Add more connections to create a rich web
    {
      movieId: 111,
      actorId: 214,
      movieName: "The Lord of the Rings",
      actorName: "Cate Blanchett",
      timestamp: new Date().toISOString(),
    },
    {
      movieId: 112,
      actorId: 206,
      movieName: "Star Wars: A New Hope",
      actorName: "Morgan Freeman",
      timestamp: new Date().toISOString(),
    },
    {
      movieId: 113,
      actorId: 211,
      movieName: "Jurassic Park",
      actorName: "Tom Hanks",
      timestamp: new Date().toISOString(),
    },
    {
      movieId: 114,
      actorId: 210,
      movieName: "Titanic",
      actorName: "Leonardo DiCaprio",
      timestamp: new Date().toISOString(),
    },
    {
      movieId: 115,
      actorId: 217,
      movieName: "Avatar",
      actorName: "Chris Hemsworth",
      timestamp: new Date().toISOString(),
    },
    {
      movieId: 116,
      actorId: 216,
      movieName: "The Avengers",
      actorName: "Scarlett Johansson",
      timestamp: new Date().toISOString(),
    },
    {
      movieId: 116,
      actorId: 217,
      movieName: "The Avengers",
      actorName: "Chris Hemsworth",
      timestamp: new Date().toISOString(),
    },
    {
      movieId: 116,
      actorId: 219,
      movieName: "The Avengers",
      actorName: "Robert Downey Jr.",
      timestamp: new Date().toISOString(),
    },
    {
      movieId: 117,
      actorId: 219,
      movieName: "Spider-Man: No Way Home",
      actorName: "Robert Downey Jr.",
      timestamp: new Date().toISOString(),
    },
    {
      movieId: 118,
      actorId: 220,
      movieName: "Top Gun: Maverick",
      actorName: "Tom Cruise",
      timestamp: new Date().toISOString(),
    },
    {
      movieId: 119,
      actorId: 213,
      movieName: "Black Panther",
      actorName: "Denzel Washington",
      timestamp: new Date().toISOString(),
    },
    {
      movieId: 120,
      actorId: 203,
      movieName: "Joker",
      actorName: "Robert De Niro",
      timestamp: new Date().toISOString(),
    },
  ]

  return connections
}

// Create mock daily challenges
const createDailyChallenges = () => {
  const today = new Date()
  const challenges: Record<string, any> = {}

  // Create challenges for the past 5 days
  for (let i = 0; i < 5; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateString = date.toISOString().split("T")[0]

    // Alternate between movie and actor challenges
    if (i % 2 === 0) {
      const movie = mockMovies[i]
      challenges[dateString] = {
        id: movie.id,
        name: movie.name,
        image: movie.image,
        type: "movie",
        rarity: movie.rarity,
        isDailyChallenge: true,
      }
    } else {
      const actor = mockActors[i]
      challenges[dateString] = {
        id: actor.id,
        name: actor.name,
        image: actor.image,
        type: "actor",
        rarity: actor.rarity,
        isDailyChallenge: true,
      }
    }
  }

  return challenges
}

// Create mock player history
const createPlayerHistory = (): PlayerHistory => {
  const movies: PlayerHistoryItem[] = mockMovies.map((movie) => ({
    id: movie.id,
    name: movie.name,
    date: new Date().toISOString(),
    count: movie.count,
    image: movie.image,
    rarity: movie.rarity as any,
  }))

  const actors: PlayerHistoryItem[] = mockActors.map((actor) => ({
    id: actor.id,
    name: actor.name,
    date: new Date().toISOString(),
    count: actor.count,
    image: actor.image,
    rarity: actor.rarity as any,
  }))

  return { movies, actors }
}

// Create mock TMDB API cache with movie and actor relationships
const createMockApiCache = () => {
  const cache: Record<string, any> = {}

  // Create movie credits entries (actors in movies)
  mockMovies.forEach((movie) => {
    // Find connections for this movie
    const movieConnections = createConnections().filter((conn) => conn.movieId === movie.id)
    const actorIds = movieConnections.map((conn) => conn.actorId)

    // Create cast array
    const cast = actorIds.map((actorId) => {
      const actor = mockActors.find((a) => a.id === actorId)
      return {
        id: actorId,
        name: actor?.name || "Unknown Actor",
        profile_path: actor?.image?.replace("https://image.tmdb.org/t/p/w500", "") || null,
        character: "Character",
        popularity: 10,
      }
    })

    // Add to cache
    const key = `/movie/${movie.id}/credits?api_key=XXX&language=en-US`
    cache[key] = {
      data: {
        id: movie.id,
        cast,
      },
      timestamp: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    }
  })

  // Create actor movie credits entries (movies with actors)
  mockActors.forEach((actor) => {
    // Find connections for this actor
    const actorConnections = createConnections().filter((conn) => conn.actorId === actor.id)
    const movieIds = actorConnections.map((conn) => conn.movieId)

    // Create cast array (for actors, this is movies they were in)
    const cast = movieIds.map((movieId) => {
      const movie = mockMovies.find((m) => m.id === movieId)
      return {
        id: movieId,
        title: movie?.name || "Unknown Movie",
        poster_path: movie?.image?.replace("https://image.tmdb.org/t/p/w500", "") || null,
        release_date: "2020-01-01",
        popularity: 10,
        vote_count: 1000,
      }
    })

    // Add to cache
    const key = `/person/${actor.id}/movie_credits?api_key=XXX&language=en-US`
    cache[key] = {
      data: {
        id: actor.id,
        cast,
      },
      timestamp: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    }
  })

  return cache
}

// Function to load all test data
const loadTestData = () => {
  try {
    // Create player history
    const playerHistory = createPlayerHistory()
    localStorage.setItem("movieGamePlayerHistory", JSON.stringify(playerHistory))

    // Create connections
    const connections = createConnections()
    localStorage.setItem("movieGameConnections", JSON.stringify(connections))

    // Create daily challenges
    const challenges = createDailyChallenges()
    localStorage.setItem("dailyChallengeItems", JSON.stringify(challenges))

    // Mark some daily challenges as completed
    const completions = Object.keys(challenges).slice(0, 3) // Mark first 3 as completed
    localStorage.setItem("dailyChallengeCompletions", JSON.stringify(completions))

    // Set high score
    localStorage.setItem("movieGameHighScore", "42")

    // Set longest chain
    localStorage.setItem("movieGameLongestChain", "15")

    // Create mock API cache
    const apiCache = createMockApiCache()
    localStorage.setItem("tmdbApiCache", JSON.stringify(apiCache))

    toast({
      title: "Test Data Loaded",
      description:
        "Mock data has been loaded successfully. You can now test all features with a pre-populated collection.",
    })
  } catch (error) {
    console.error("Error loading test data:", error)
    toast({
      title: "Error Loading Test Data",
      description: "There was a problem loading the test data. Check the console for details.",
      variant: "destructive",
    })
  }
}

export default function TestDataLoader() {
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button onClick={loadTestData} className="bg-purple-600 hover:bg-purple-700">
        Load Test Data
      </Button>
    </div>
  )
}
