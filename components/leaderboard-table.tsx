import type { LeaderboardEntry } from "@/lib/types"
import { getRankColor, getRankBorderColor } from "@/lib/rank-utils"

interface LeaderboardTableProps {
  data: LeaderboardEntry[]
}

export function LeaderboardTable({ data }: LeaderboardTableProps) {
  return (
    <div className="rounded-md border">
      <div className="relative w-full overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b">
            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[60px]">Rank</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Player</th>
              <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Score</th>
              <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground w-[80px]">Games</th>
              <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground w-[100px]">Rank</th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-muted-foreground">
                  No leaderboard entries yet
                </td>
              </tr>
            ) : (
              data.map((entry, index) => (
                <tr
                  key={entry.id}
                  className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                >
                  <td className="p-4 align-middle font-medium">#{index + 1}</td>
                  <td className="p-4 align-middle">{entry.playerName}</td>
                  <td className="p-4 align-middle text-right">{entry.score.toLocaleString()}</td>
                  <td className="p-4 align-middle text-center">
                    <span className="inline-flex items-center justify-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
                      {entry.gamesPlayed || 0}
                    </span>
                  </td>
                  <td className="p-4 align-middle text-center">
                    <span
                      className={`inline-flex items-center justify-center rounded-md border px-3 py-1 text-sm font-bold shadow-sm ${getRankColor(entry.rank)} ${getRankBorderColor(entry.rank)}`}
                    >
                      {entry.rank}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
