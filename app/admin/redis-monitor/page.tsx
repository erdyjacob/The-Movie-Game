import { getRedisStats } from "@/lib/leaderboard"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function RedisMonitorPage() {
  const stats = await getRedisStats()

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Redis Monitoring</h1>

      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Leaderboard Statistics</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-background p-4 rounded-md border">
            <div className="text-sm text-muted-foreground">Total Entries</div>
            <div className="text-2xl font-bold">{stats.leaderboardEntries || 0}</div>
          </div>

          <div className="bg-background p-4 rounded-md border">
            <div className="text-sm text-muted-foreground">Last Updated</div>
            <div className="text-lg">{stats.lastUpdated}</div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-medium mb-2">Cache Status</h3>
          <p className="text-sm text-muted-foreground">
            The leaderboard is cached for 30 minutes during peak hours (9am-11pm) and 2 hours during off-peak hours.
            This helps reduce Redis operations while keeping the leaderboard reasonably up-to-date.
          </p>
        </div>
      </div>
    </div>
  )
}
