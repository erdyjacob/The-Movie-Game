import type { Rarity, TMDBMovie, TMDBActor } from "./types"

// Constants for rarity thresholds - FLIPPED so less popular actors are legendary
const ACTOR_RARITY_THRESHOLDS = {
  common: 80, // Very high popularity (A-list celebrities)
  uncommon: 40, // High popularity
  rare: 20, // Medium popularity
  epic: 5, // Low popularity
  legendary: 0, // Very low popularity (these are the hardest to guess)
}

// Calculate movie rarity based on multiple factors
export function calculateMovieRarity(movie: TMDBMovie): Rarity {
  if (!movie) return "common"

  // Get current year for age calculation
  const currentYear = new Date().getFullYear()

  // Extract release year from release_date
  const releaseYear = movie.release_date ? Number.parseInt(movie.release_date.split("-")[0]) : currentYear

  // Calculate movie age
  const movieAge = currentYear - releaseYear

  // Get popularity and vote count
  const popularity = movie.popularity || 0
  const voteCount = movie.vote_count || 0

  // Calculate a rarity score based on multiple factors
  // Older movies with high vote counts but lower popularity are often classics/rare finds
  let rarityScore = 0

  // Age factor: older movies are rarer
  if (movieAge > 50)
    rarityScore += 40 // Classic films (50+ years)
  else if (movieAge > 30)
    rarityScore += 30 // Older films (30-50 years)
  else if (movieAge > 15)
    rarityScore += 15 // Not recent (15-30 years)
  else if (movieAge > 5) rarityScore += 5 // Somewhat recent (5-15 years)

  // Popularity factor: less popular movies are rarer
  if (popularity < 5)
    rarityScore += 40 // Very obscure
  else if (popularity < 15)
    rarityScore += 30 // Obscure
  else if (popularity < 30)
    rarityScore += 15 // Not mainstream
  else if (popularity < 50) rarityScore += 5 // Somewhat popular

  // Vote count factor: movies with moderate vote counts might be cult classics
  if (voteCount > 1000 && voteCount < 5000 && popularity < 30) rarityScore += 20 // Potential cult classics

  // Foreign film bonus: non-English films are generally rarer
  if (movie.original_language && movie.original_language !== "en") rarityScore += 15

  // Determine rarity based on the final score
  if (rarityScore >= 70) return "legendary"
  if (rarityScore >= 50) return "epic"
  if (rarityScore >= 30) return "rare"
  if (rarityScore >= 15) return "uncommon"
  return "common"
}

// Calculate actor rarity based on popularity - FLIPPED logic
export function calculateActorRarity(actor: TMDBActor): Rarity {
  if (!actor) return "common"

  const popularity = actor.popularity || 0

  // Flipped logic: less popular actors are legendary (harder to guess)
  if (popularity >= ACTOR_RARITY_THRESHOLDS.common) return "common"
  if (popularity >= ACTOR_RARITY_THRESHOLDS.uncommon) return "uncommon"
  if (popularity >= ACTOR_RARITY_THRESHOLDS.rare) return "rare"
  if (popularity >= ACTOR_RARITY_THRESHOLDS.epic) return "epic"
  return "legendary" // Very obscure actors
}

// Get color for rarity
export function getRarityColor(rarity: Rarity): string {
  switch (rarity) {
    case "legendary":
      return "text-amber-500" // Gold
    case "epic":
      return "text-purple-500" // Purple
    case "rare":
      return "text-blue-500" // Blue
    case "uncommon":
      return "text-green-500" // Green
    case "common":
    default:
      return "text-gray-500" // Gray
  }
}

// Get background color for rarity
export function getRarityBgColor(rarity: Rarity): string {
  switch (rarity) {
    case "legendary":
      return "bg-amber-500/10 border-amber-500/30" // Gold
    case "epic":
      return "bg-purple-500/10 border-purple-500/30" // Purple
    case "rare":
      return "bg-blue-500/10 border-blue-500/30" // Blue
    case "uncommon":
      return "bg-green-500/10 border-green-500/30" // Green
    case "common":
    default:
      return "bg-gray-500/10 border-gray-500/30" // Gray
  }
}

// Get border color for rarity
export function getRarityBorderColor(rarity: Rarity): string {
  switch (rarity) {
    case "legendary":
      return "border-amber-500" // Gold
    case "epic":
      return "border-purple-500" // Purple
    case "rare":
      return "border-blue-500" // Blue
    case "uncommon":
      return "border-green-500" // Green
    case "common":
    default:
      return "border-gray-500" // Gray
  }
}

// Get display name for rarity
export function getRarityDisplayName(rarity: Rarity): string {
  return rarity.charAt(0).toUpperCase() + rarity.slice(1)
}
