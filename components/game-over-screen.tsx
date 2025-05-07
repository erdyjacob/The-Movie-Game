"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { GameItem, GameMode } from "@/lib/types"
import GamePath from "./game-path"
import { Clock, Film, Unlock, User } from "lucide-react"
import Image from "next/image"
import { RarityOverlay } from "./rarity-overlay"

interface GameOverScreenProps {
  history: GameItem[]
  score: number
  highScore: number
  onRestart: () => void
  gameMode: GameMode
  newUnlocks: {
    actors: GameItem[]
    movies: GameItem[]
  }
}

export default function GameOverScreen({
  history,
  score,
  highScore,
  onRestart,
  gameMode,
  newUnlocks,
}: GameOverScreenProps) {
  const isNewHighScore = score > highScore
  const totalNewUnlocks = newUnlocks.actors.length + newUnlocks.movies.length

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-center text-2xl">Game Over!</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8 px-6">
        <div className="text-center py-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <h3 className="text-xl">Connections Made: {score}</h3>
          </div>
          {isNewHighScore ? (
            <p className="text-green-600 font-semibold">New High Score!</p>
          ) : (
            <p>High Score: {highScore}</p>
          )}

          <p className="mt-2 text-sm text-muted-foreground">You made {score} connections in 2 minutes!</p>
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

        {/* New Unlocks Section */}
        {totalNewUnlocks > 0 && (
          <div className="space-y-4 border-t pt-6">
            <div className="flex items-center justify-center gap-2">
              <Unlock className="h-5 w-5 text-green-500" />
              <h3 className="text-xl font-semibold text-center">
                You unlocked {totalNewUnlocks} new {totalNewUnlocks === 1 ? "item" : "items"}!
              </h3>
            </div>

            {/* New Actors */}
            {newUnlocks.actors.length > 0 && (
              <div className="space-y-2">
                <h4 className="flex items-center gap-1 text-lg font-medium">
                  <User className="h-4 w-4" />
                  <span>
                    {newUnlocks.actors.length} New {newUnlocks.actors.length === 1 ? "Actor" : "Actors"}
                  </span>
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {newUnlocks.actors.map((actor) => (
                    <div key={actor.id} className="flex flex-col items-center">
                      <div className="relative h-20 w-16 rounded-md overflow-hidden shadow-sm">
                        {actor.image ? (
                          <Image
                            src={actor.image || "/placeholder.svg"}
                            alt={actor.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-muted flex items-center justify-center">
                            <User size={20} className="text-muted-foreground" />
                          </div>
                        )}
                        {actor.rarity && <RarityOverlay rarity={actor.rarity} showLabel={true} size="sm" />}
                      </div>
                      <p className="text-xs text-center mt-1 truncate max-w-[80px]" title={actor.name}>
                        {actor.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Movies */}
            {newUnlocks.movies.length > 0 && (
              <div className="space-y-2">
                <h4 className="flex items-center gap-1 text-lg font-medium">
                  <Film className="h-4 w-4" />
                  <span>
                    {newUnlocks.movies.length} New {newUnlocks.movies.length === 1 ? "Movie" : "Movies"}
                  </span>
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {newUnlocks.movies.map((movie) => (
                    <div key={movie.id} className="flex flex-col items-center">
                      <div className="relative h-20 w-16 rounded-md overflow-hidden shadow-sm">
                        {movie.image ? (
                          <Image
                            src={movie.image || "/placeholder.svg"}
                            alt={movie.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-muted flex items-center justify-center">
                            <Film size={20} className="text-muted-foreground" />
                          </div>
                        )}
                        {movie.rarity && <RarityOverlay rarity={movie.rarity} showLabel={true} size="sm" />}
                      </div>
                      <p className="text-xs text-center mt-1 truncate max-w-[80px]" title={movie.name}>
                        {movie.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="justify-center pt-4 pb-6">
        <Button onClick={onRestart} size="lg">
          Play Again
        </Button>
      </CardFooter>
    </Card>
  )
}
