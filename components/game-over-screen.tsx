"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { GameItem } from "@/lib/types"
import GamePath from "./game-path"

interface GameOverScreenProps {
  history: GameItem[]
  score: number
  highScore: number
  onRestart: () => void
}

export default function GameOverScreen({ history, score, highScore, onRestart }: GameOverScreenProps) {
  const isNewHighScore = score > highScore

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-center text-2xl">Game Over!</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8 px-6">
        <div className="text-center py-2">
          <h3 className="text-xl mb-2">Your Score: {score}</h3>
          {isNewHighScore ? (
            <p className="text-green-600 font-semibold">New High Score!</p>
          ) : (
            <p>High Score: {highScore}</p>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-center mb-4">Your Movie Path</h3>
          <div className="bg-muted/30 p-5 rounded-lg">
            <GamePath history={history} />
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">
            You connected {history.length} items in your movie journey!
          </p>
        </div>
      </CardContent>
      <CardFooter className="justify-center pt-4 pb-6">
        <Button onClick={onRestart} size="lg">
          Back to Start
        </Button>
      </CardFooter>
    </Card>
  )
}
