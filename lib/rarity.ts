import type { Rarity, TMDBMovie, TMDBActor } from "./types"

// Update the ACTOR_RARITY_THRESHOLDS constant with more refined values
// Constants for rarity thresholds - FLIPPED so less popular actors are legendary
const ACTOR_RARITY_THRESHOLDS = {
  common: 40, // Very high popularity (A-list celebrities)
  uncommon: 20, // High popularity
  rare: 8, // Medium popularity
  epic: 2, // Low popularity
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

// Replace the calculateActorRarity function with this enhanced version
export function calculateActorRarity(actor: TMDBActor): Rarity {
  if (!actor) return "common"

  const popularity = actor.popularity || 0
  const name = actor.name || ""
  const knownForCount = actor.known_for?.length || 0

  // Expanded list of very famous actors who should always be common
  const veryFamousActors = [
    // Hollywood A-listers
    "tom hanks",
    "leonardo dicaprio",
    "robert downey jr",
    "brad pitt",
    "jennifer lawrence",
    "scarlett johansson",
    "dwayne johnson",
    "meryl streep",
    "denzel washington",
    "tom cruise",
    "will smith",
    "julia roberts",
    "morgan freeman",
    "samuel l jackson",
    "harrison ford",
    "johnny depp",
    "angelina jolie",
    "chris hemsworth",
    "chris evans",
    "ryan reynolds",
    "emma stone",
    "jennifer aniston",
    "chris pratt",
    "mark wahlberg",
    "benedict cumberbatch",
    "matt damon",
    "george clooney",
    "sandra bullock",
    "natalie portman",
    "anne hathaway",
    "charlize theron",
    "hugh jackman",
    "christian bale",
    "daniel craig",
    "ryan gosling",
    "emma watson",
    "jennifer lopez",
    "nicole kidman",
    "cate blanchett",
    "viola davis",
    "idris elba",
    "zoe saldana",
    "chris pine",
    "jake gyllenhaal",
    "margot robbie",
    "keanu reeves",
    "joaquin phoenix",
    "bradley cooper",
    "zendaya",
    "timothée chalamet",
    "florence pugh",
    "tom holland",

    // Marvel/DC stars
    "robert pattinson",
    "gal gadot",
    "brie larson",
    "chadwick boseman",
    "elizabeth olsen",
    "paul rudd",
    "jeremy renner",
    "mark ruffalo",
    "sebastian stan",
    "anthony mackie",
    "tom hiddleston",
    "karen gillan",
    "dave bautista",
    "vin diesel",
    "jason momoa",
    "henry cavill",

    // Other major stars
    "adam sandler",
    "jim carrey",
    "steve carell",
    "melissa mccarthy",
    "dwayne johnson",
    "kevin hart",
    "jamie foxx",
    "halle berry",
    "daniel radcliffe",
    "rupert grint",
    "emma watson",
    "orlando bloom",
    "keira knightley",
    "judi dench",
    "ian mckellen",
    "patrick stewart",
    "michael caine",
    "anthony hopkins",
    "al pacino",
    "robert de niro",
    "jack nicholson",
    "leonardo dicaprio",
    "kate winslet",
    "russell crowe",
    "joaquin phoenix",
    "brad pitt",
    "tom hanks",
    "julia roberts",
  ]

  // Check if the actor is in our very famous list
  if (veryFamousActors.some((famous) => name.toLowerCase().includes(famous))) {
    return "common"
  }

  // Check for Oscar winners/nominees who might not be in our list
  const oscarKeywords = ["oscar winner", "academy award winner", "oscar nominee", "academy award nominee"]
  const hasOscarMention =
    actor.biography && oscarKeywords.some((keyword) => actor.biography.toLowerCase().includes(keyword))

  // Adjust popularity based on additional factors
  let adjustedPopularity = popularity

  // Boost for actors with many known roles
  if (knownForCount > 5) {
    adjustedPopularity += 15
  } else if (knownForCount > 3) {
    adjustedPopularity += 8
  } else if (knownForCount > 1) {
    adjustedPopularity += 3
  }

  // Boost for Oscar winners/nominees
  if (hasOscarMention) {
    adjustedPopularity += 10
  }

  // Boost for actors with high vote counts in their films
  const highVoteCount = actor.known_for?.some((movie) => movie.vote_count > 5000)
  if (highVoteCount) {
    adjustedPopularity += 5
  }

  // Flipped logic: less popular actors are legendary (harder to guess)
  if (adjustedPopularity >= ACTOR_RARITY_THRESHOLDS.common) return "common"
  if (adjustedPopularity >= ACTOR_RARITY_THRESHOLDS.uncommon) return "uncommon"
  if (adjustedPopularity >= ACTOR_RARITY_THRESHOLDS.rare) return "rare"
  if (adjustedPopularity >= ACTOR_RARITY_THRESHOLDS.epic) return "epic"
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
