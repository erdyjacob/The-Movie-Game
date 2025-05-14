import GameContainer from "@/components/game-container"
import { prefetchGameData } from "@/lib/tmdb-api"

export const dynamic = "force-dynamic"

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
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24 bg-gradient-to-b from-muted to-background">
      <div className="w-full max-w-4xl">
        {!process.env.TMDB_API_KEY && (
          <div className="bg-amber-100 border-l-4 border-amber-500 text-amber-700 p-4 mb-6 rounded shadow-sm">
            <h3 className="font-bold">API Key Missing</h3>
            <p>The TMDB API key is not set. The game will run with limited functionality using fallback data.</p>
            <p className="mt-2">
              To enable full functionality, please add your TMDB API key to the environment variables.
            </p>
          </div>
        )}
        <GameContainer />
      </div>
    </main>
  )
}
