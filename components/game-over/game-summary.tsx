import { Clock } from "lucide-react"

interface GameSummaryProps {
  score: number
  highScore: number
  isNewHighScore: boolean
}

export function GameSummary({ score, highScore, isNewHighScore }: GameSummaryProps) {
  return (
    <div className="text-center py-2">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Clock className="h-5 w-5 text-blue-500" />
        <h3 className="text-xl">Connections Made: {score}</h3>
      </div>
      {isNewHighScore ? <p className="text-green-600 font-semibold">New High Score</p> : <p>High Score: {highScore}</p>}

      <p className="mt-2 text-sm text-muted-foreground">You made {score} connections in 2 minutes!</p>
    </div>
  )
}
