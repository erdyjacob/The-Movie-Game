// Helper function to convert rarity to actual color values
export function getRarityColorValue(rarity: string): string {
  switch (rarity) {
    case "legendary":
      return "#f59e0b" // amber-500
    case "epic":
      return "#9333ea" // purple-600
    case "rare":
      return "#4f46e5" // indigo-600
    case "uncommon":
      return "#10b981" // emerald-500
    case "common":
    default:
      return "#6b7280" // gray-500
  }
}

// Get connections between movies and actors
export function buildConnectionsFromHistory(playerHistory: any): {
  nodes: any[]
  links: any[]
} {
  // This is a placeholder implementation
  // In a real app, you would use actual movie-actor relationships

  const movieNodes = playerHistory.movies.map((movie: any) => ({
    id: `movie-${movie.id}`,
    name: movie.name,
    type: "movie",
    image: movie.image,
    rarity: movie.rarity,
    count: movie.count,
  }))

  const actorNodes = playerHistory.actors.map((actor: any) => ({
    id: `actor-${actor.id}`,
    name: actor.name,
    type: "actor",
    image: actor.image,
    rarity: actor.rarity,
    count: actor.count,
  }))

  const allNodes = [...movieNodes, ...actorNodes]

  // Create links between nodes
  // This is simplified - in reality, you would use actual movie-actor relationships
  const allLinks = []

  // For demonstration purposes, create some connections
  for (let i = 0; i < Math.min(movieNodes.length, actorNodes.length); i++) {
    allLinks.push({
      source: movieNodes[i].id,
      target: actorNodes[i].id,
      value: 1,
    })
  }

  return {
    nodes: allNodes,
    links: allLinks,
  }
}
