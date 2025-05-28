import { Suspense } from "react"
import { LeaderboardTable } from "@/components/leaderboard-table"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home } from "lucide-react"
import { getLeaderboardData, getLeaderboardLastUpdated } from "@/lib/leaderboard"
import Image from "next/image"

export const dynamic = "force-dynamic"
export const revalidate = 0 // We're handling caching in our getLeaderboardData function

async function LeaderboardData() {
  // Get leaderboard data and limit to top 10 players
  const entries = await getLeaderboardData()
  const top10Entries = entries.slice(0, 10)
  const lastUpdated = await getLeaderboardLastUpdated()

  return (
    <div className="space-y-4">
      <LeaderboardTable data={top10Entries} />
      <div className="text-xs text-muted-foreground text-right">Last updated: {lastUpdated}</div>
    </div>
  )
}

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card">
        <div className="w-full flex flex-col items-center justify-center py-6 px-4">
          {/* Hero Section - same as start screen */}
          <div className="text-center mb-4">
            <div className="w-80 h-20 relative mx-auto mb-3">
              <Image src="/images/TheMovieGame.svg" alt="The Movie Game" fill className="object-contain" priority />
            </div>
            <p className="text-muted-foreground">Name an actor from the movie or a movie the actor was in!</p>
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
            <p className="text-muted-foreground mt-2">See how you stack up against other players</p>
          </div>
          <Link href="/">
            <Button>
              <Home className="h-4 w-4 mr-2" />
              Back to Game
            </Button>
          </Link>
        </div>

        <Suspense fallback={<div className="text-center p-8">Loading leaderboard data...</div>}>
          <LeaderboardData />
        </Suspense>
      </main>
    </div>
  )
}
