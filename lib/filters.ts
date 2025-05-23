import type { TMDBMovie, TMDBActor, GameFilters } from "@/lib/types"

// Animation genre ID in TMDB
const ANIMATION_GENRE_ID = 16
// Documentary genre ID in TMDB
const DOCUMENTARY_GENRE_ID = 99

// Minimum thresholds to filter out extremely niche content
const MIN_MOVIE_POPULARITY = 1.0
const MIN_MOVIE_VOTE_COUNT = 100
const MIN_ACTOR_POPULARITY = 1.0
const MIN_ACTOR_KNOWN_FOR_COUNT = 2

// Function to check if a movie is likely a sequel based on its title
export function isLikelySequel(movie: TMDBMovie): boolean {
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
    /\s+\d+\s*:\s*.+/, // Space, number, colon (e.g., "Alien 3: ")
    /\s+\d+$/, // Space followed by number at end (e.g., "Die Hard 2")
    /\s+\d+\s*$/, // Space, number, optional space at end
    /\s+\w+\s+\d+$/, // Space, word, space, number at end
    /\s+\w+\s+\d+\s*$/, // Space, word, space, number, optional space at end
  ]

  return sequelPatterns.some((pattern) => pattern.test(title))
}

// Function to check if a movie is a foreign film (non-English)
export function isForeignFilm(movie: TMDBMovie): boolean {
  return movie.original_language !== "en"
}

// Function to check if a movie is a documentary
export function isDocumentary(movie: TMDBMovie): boolean {
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

// Function to check if a movie is animated based on its genres
export function isAnimatedMovie(movie: TMDBMovie): boolean {
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

// Function to check if a movie is too niche (extremely low popularity or vote count)
export function isTooNicheMovie(movie: TMDBMovie): boolean {
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
export function isTooNicheActor(actor: TMDBActor): boolean {
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

// Function to check if a movie belongs to a recently used franchise
export function isRecentlyUsedFranchise(movie: TMDBMovie, recentlyUsedFranchises: string[]): boolean {
  const title = movie.title?.toLowerCase() || ""

  return recentlyUsedFranchises.some((franchise) => title.includes(franchise))
}

// Main filter function for movies
export function filterMovie(
  movie: TMDBMovie,
  filters: GameFilters = { includeAnimated: true, includeSequels: true, includeForeign: false },
  recentlyUsedMovieIds: number[],
  recentlyUsedFranchises: string[],
): boolean {
  // Ensure movie is not null or undefined
  if (!movie) {
    return false
  }

  // Filter out recently used movies
  if (recentlyUsedMovieIds.includes(movie.id)) {
    return false
  }

  // Filter out extremely niche movies
  if (isTooNicheMovie(movie)) {
    return false
  }

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

  // For better variety, avoid recently used franchises
  if (recentlyUsedFranchises.length > 0 && isRecentlyUsedFranchise(movie, recentlyUsedFranchises)) {
    return false
  }

  return true
}

// Apply filters to a list of movies
export function applyMovieFilters(
  movies: TMDBMovie[],
  filters: GameFilters = { includeAnimated: true, includeSequels: true, includeForeign: false },
  recentlyUsedMovieIds: number[],
  recentlyUsedFranchises: string[],
): TMDBMovie[] {
  return movies.filter((movie) => filterMovie(movie, filters, recentlyUsedMovieIds, recentlyUsedFranchises))
}

// Apply filters to a list of actors
export function applyActorFilters(actors: TMDBActor[], recentlyUsedActorIds: number[]): TMDBActor[] {
  return actors.filter((actor) => {
    // Ensure actor is not null or undefined
    if (!actor) {
      return false
    }

    // Filter out recently used actors
    if (recentlyUsedActorIds.includes(actor.id)) {
      return false
    }

    // Filter out extremely niche actors
    if (isTooNicheActor(actor)) {
      return false
    }

    return true
  })
}
