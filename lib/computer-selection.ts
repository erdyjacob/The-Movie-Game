import type { GameItem, Difficulty, ItemType } from "@/lib/types"

// Helper function to make computer selections more interesting and adaptive
export function makeComputerSelection(
  options: any[],
  difficulty: Difficulty,
  gameState: {
    history: GameItem[]
    score: number
    usedIds: Set<number>
  },
  itemType: ItemType,
): any | null {
  // No options available
  if (!options || options.length === 0) return null

  // Filter out already used items
  const availableOptions = options.filter((option) => !gameState.usedIds.has(option.id))
  if (availableOptions.length === 0) return null

  // Sort by popularity (descending)
  const sortedOptions = [...availableOptions].sort((a, b) => {
    // For actors, use popularity
    if (itemType === "actor") {
      return (b.popularity || 0) - (a.popularity || 0)
    }
    // For movies, use a combination of popularity and vote_count
    return (b.popularity || 0) * (b.vote_count || 1) - (a.popularity || 0) * (a.vote_count || 1)
  })

  // Different selection strategies based on game state and difficulty
  const gameProgress = Math.min(gameState.history.length / 20, 1) // Normalized progress (0-1)
  const currentScore = gameState.score

  // Determine selection strategy
  let selectedOption

  // Strategy 1: Early game - help player build momentum
  if (gameProgress < 0.3) {
    // In early game, select from top options but with some randomness
    const poolSize = difficulty === "easy" ? 3 : difficulty === "medium" ? 2 : 1
    const index = Math.floor(Math.random() * poolSize)
    selectedOption = sortedOptions[Math.min(index, sortedOptions.length - 1)]
  }
  // Strategy 2: Mid game - introduce some challenge
  else if (gameProgress < 0.7) {
    // In mid game, select from middle popularity range
    const startIndex = Math.floor(sortedOptions.length * 0.2)
    const endIndex = Math.floor(sortedOptions.length * 0.6)
    const poolSize = endIndex - startIndex

    if (poolSize <= 0) {
      selectedOption = sortedOptions[0] // Fallback
    } else {
      const index = startIndex + Math.floor(Math.random() * poolSize)
      selectedOption = sortedOptions[Math.min(index, sortedOptions.length - 1)]
    }
  }
  // Strategy 3: Late game - strategic selection
  else {
    // In late game, try to find options that lead to interesting paths
    // This could involve looking ahead at what options this selection would lead to

    // For now, implement a simpler version that selects less popular options
    // but ensures they're not too obscure
    const popularityThreshold = difficulty === "easy" ? 5 : difficulty === "medium" ? 3 : 1

    const viableOptions = sortedOptions.filter((option) => (option.popularity || 0) >= popularityThreshold)

    if (viableOptions.length === 0) {
      selectedOption = sortedOptions[0] // Fallback
    } else {
      // Select from bottom half of viable options
      const startIndex = Math.floor(viableOptions.length / 2)
      const index = startIndex + Math.floor(Math.random() * (viableOptions.length - startIndex))
      selectedOption = viableOptions[Math.min(index, viableOptions.length - 1)]
    }
  }

  // Occasionally throw in a surprise selection (10% chance)
  if (Math.random() < 0.1) {
    const randomIndex = Math.floor(Math.random() * sortedOptions.length)
    selectedOption = sortedOptions[randomIndex]
  }

  return selectedOption
}
