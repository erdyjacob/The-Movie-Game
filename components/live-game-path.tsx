"use client"
import type { GameItem } from "@/lib/types"
import { ArrowRight, Film, User } from "lucide-react"
import Image from "next/image"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface LiveGamePathProps {
  history: GameItem[]
  difficulty: string
}

export default function LiveGamePath({ history, difficulty }: LiveGamePathProps) {
  if (history.length === 0) {
    return null
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

  // For medium and hard modes, we'll show images for items that have been guessed
  // Easy mode always shows images
  const showImages = true // Show images for all guessed items regardless of difficulty

  return (
    <div className="w-full overflow-auto pb-2 mt-4">
      <h3 className="text-sm font-medium text-center mb-4">Game Progress:</h3>
      <div className="flex flex-nowrap items-center gap-4 min-w-max mx-auto justify-center">
        {groupedItems.map((group, groupIndex) => (
          <div key={`group-${groupIndex}`} className="flex items-center">
            {/* Render the group of items */}
            <div className="flex items-center">
              {group.map((item, itemIndex) => (
                <TooltipProvider key={`${item.id}-${groupIndex}-${itemIndex}`}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className="relative h-20 w-16 rounded-lg overflow-hidden shadow-md mx-1 cursor-pointer"
                        aria-label={`${item.name} (${item.type})`}
                      >
                        {showImages && item.image ? (
                          <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                        ) : (
                          <div className="h-full w-full bg-muted flex items-center justify-center">
                            {item.type === "movie" ? (
                              <Film size={24} className="text-muted-foreground" />
                            ) : (
                              <User size={24} className="text-muted-foreground" />
                            )}
                          </div>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{item.type}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>

            {/* Add arrow between groups */}
            {groupIndex < groupedItems.length - 1 && (
              <ArrowRight size={20} className="flex-shrink-0 text-muted-foreground mx-2" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
