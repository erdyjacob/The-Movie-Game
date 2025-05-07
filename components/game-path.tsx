"use client"

import type { GameItem } from "@/lib/types"
import { Film, User, ArrowRight } from "lucide-react"
import Image from "next/image"

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
      <div className="flex flex-col space-y-8">
        {groupedItems.map((group, groupIndex) => (
          <div key={`group-${groupIndex}`} className="flex flex-col items-center">
            {/* Label for the turn */}
            <div className="mb-2">
              <span className="text-sm font-medium">
                {groupIndex === 0 ? "Computer" : groupIndex % 2 === 1 ? "Player" : "Computer"}
              </span>
            </div>

            {/* Items in the group */}
            <div className="flex items-center gap-4">
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
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      {item.type === "movie" ? <Film size={12} /> : <User size={12} />}
                      <span>{item.type.toUpperCase()}</span>
                    </span>
                    <span className="truncate max-w-36 text-center font-medium">{item.name}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Arrow to next group */}
            {groupIndex < groupedItems.length - 1 && (
              <ArrowRight size={24} className="flex-shrink-0 text-muted-foreground mt-4" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
