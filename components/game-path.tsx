"use client"

import type { GameItem } from "@/lib/types"
import { Film, User, ArrowDown } from "lucide-react"
import Image from "next/image"
import { RarityOverlay } from "./rarity-overlay"

interface GamePathProps {
  history: GameItem[]
}

export default function GamePath({ history }: GamePathProps) {
  if (history.length === 0) {
    return <p className="text-center text-muted-foreground">No game history available</p>
  }

  // Group items by turn (computer/player)
  const groupedItems: GameItem[][] = []

  // First item is always a movie from the computer
  if (history.length > 0) {
    groupedItems.push([history[0]])
  }

  // Group subsequent items in pairs (actor + movie)
  for (let i = 1; i < history.length; i += 2) {
    const pair: GameItem[] = [history[i]]
    if (i + 1 < history.length) {
      pair.push(history[i + 1])
    }
    groupedItems.push(pair)
  }

  return (
    <div className="w-full overflow-auto pb-4">
      {groupedItems.map((group, groupIndex) => (
        <div key={`group-${groupIndex}`}>
          {/* Each chunk: label + items */}
          <div className="mb-6">
            {/* Label for the turn */}
            <div className="text-center mb-4">
              <span className="text-sm font-medium">
                {groupIndex === 0 ? "Computer" : groupIndex % 2 === 1 ? "Player" : "Computer"}
              </span>
            </div>

            {/* Items in the group - fixed width container with reduced spacing */}
            <div className="max-w-[400px] w-full mx-auto">
              {/* If there's only one item, center it */}
              {group.length === 1 ? (
                <div className="flex justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative h-32 w-24 rounded-lg overflow-hidden shadow-md">
                      {group[0].image ? (
                        <Image
                          src={group[0].image || "/placeholder.svg"}
                          alt={group[0].name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-muted flex items-center justify-center">
                          {group[0].type === "movie" ? <Film size={24} /> : <User size={24} />}
                        </div>
                      )}

                      {/* Only show rarity overlay for player selections */}
                      {group[0].selectedBy === "player" && group[0].rarity && (
                        <RarityOverlay rarity={group[0].rarity} showLabel={true} />
                      )}
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        {group[0].type === "movie" ? <Film size={12} /> : <User size={12} />}
                        <span>{group[0].type.toUpperCase()}</span>
                      </span>
                      <span className="truncate max-w-[150px] text-center font-medium">{group[0].name}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* For two items, use a grid with specific column placement */
                <div className="grid grid-cols-2 gap-0">
                  {group.map((item, itemIndex) => (
                    <div key={`${item.id}-${groupIndex}-${itemIndex}`} className="flex flex-col items-center gap-2">
                      <div className="relative h-32 w-24 rounded-lg overflow-hidden shadow-md">
                        {item.image ? (
                          <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                        ) : (
                          <div className="h-full w-full bg-muted flex items-center justify-center">
                            {item.type === "movie" ? <Film size={24} /> : <User size={24} />}
                          </div>
                        )}

                        {/* Only show rarity overlay for player selections */}
                        {item.selectedBy === "player" && item.rarity && (
                          <RarityOverlay rarity={item.rarity} showLabel={true} />
                        )}
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          {item.type === "movie" ? <Film size={12} /> : <User size={12} />}
                          <span>{item.type.toUpperCase()}</span>
                        </span>
                        <span className="truncate max-w-[150px] text-center font-medium">{item.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Arrow between chunks with even spacing */}
          {groupIndex < groupedItems.length - 1 && (
            <div className="flex justify-center my-6">
              <ArrowDown size={24} className="text-muted-foreground" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
