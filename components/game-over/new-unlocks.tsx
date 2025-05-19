import { Unlock, User, Film } from "lucide-react"
import Image from "next/image"
import type { GameItem } from "@/lib/types"
import { RarityOverlay } from "../rarity-overlay"
import { LegendaryFlipCard } from "./legendary-flip-card"

interface NewUnlocksProps {
  newUnlocks: {
    actors: GameItem[]
    movies: GameItem[]
  }
}

export function NewUnlocks({ newUnlocks }: NewUnlocksProps) {
  const totalNewUnlocks = newUnlocks.actors.length + newUnlocks.movies.length

  if (totalNewUnlocks === 0) {
    return null
  }

  return (
    <div className="space-y-4 border-t pt-6">
      <div className="flex items-center justify-center gap-2">
        <Unlock className="h-5 w-5 text-green-500" />
        <h3 className="text-xl font-semibold text-center">
          You unlocked {totalNewUnlocks} new {totalNewUnlocks === 1 ? "pull" : "pulls"}
        </h3>
      </div>

      {/* New Actors */}
      {newUnlocks.actors.length > 0 && (
        <div className="space-y-2">
          <h4 className="flex items-center gap-1 text-lg font-medium">
            <User className="h-4 w-4" />
            <span>
              {newUnlocks.actors.length} New {newUnlocks.actors.length === 1 ? "Actor Pull" : "Actor Pulls"}
            </span>
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {newUnlocks.actors.map((actor) => (
              <div key={actor.id} className="flex flex-col items-center">
                {actor.rarity === "legendary" ? (
                  <LegendaryFlipCard item={actor} />
                ) : (
                  <>
                    <div className="relative h-20 w-16 rounded-md overflow-hidden shadow-sm">
                      {actor.image ? (
                        <Image src={actor.image || "/placeholder.svg"} alt={actor.name} fill className="object-cover" />
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
                  </>
                )}
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
              {newUnlocks.movies.length} New {newUnlocks.movies.length === 1 ? "Movie Pull" : "Movie Pulls"}
            </span>
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {newUnlocks.movies.map((movie) => (
              <div key={movie.id} className="flex flex-col items-center">
                {movie.rarity === "legendary" ? (
                  <LegendaryFlipCard item={movie} />
                ) : (
                  <>
                    <div className="relative h-20 w-16 rounded-md overflow-hidden shadow-sm">
                      {movie.image ? (
                        <Image src={movie.image || "/placeholder.svg"} alt={movie.name} fill className="object-cover" />
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
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
