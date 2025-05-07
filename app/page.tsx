import GameContainer from "@/components/game-container"
import { prefetchGameData } from "@/lib/tmdb-api"

// Prefetch data for the game
export async function generateMetadata() {
  try {
    // Prefetch data in the background
    prefetchGameData()
  } catch (error) {
    console.error("Error prefetching game data:", error)
  }

  return {
    title: "The Movie Game",
    description: "Test your movie knowledge by connecting actors to movies they starred in",
  }
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24 bg-gradient-to-b from-background to-muted">
      <GameContainer />
    </main>
  )
}
