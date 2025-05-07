"use client"
import { useEffect, useRef, memo } from "react"
import type { GameItem } from "@/lib/types"
import { ArrowRight, Film, User } from "lucide-react"
import Image from "next/image"
import React from "react"
import { RarityOverlay } from "./rarity-overlay"

interface LiveGamePathProps {
  history: GameItem[]
  difficulty: string
}

// Memoize the LiveGamePath component to prevent unnecessary re-renders
const LiveGamePath = memo(function LiveGamePath({ history, difficulty }: LiveGamePathProps) {
  // Reference to the scrollable container
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Scroll to the end when history changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth
    }
  }, [history])

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
    <div className="w-full mt-4">
      <h3 className="text-sm font-medium text-center mb-4">Game Progress:</h3>
      <div
        ref={scrollContainerRef}
        className="w-full overflow-x-auto pb-2 scroll-smooth hide-scrollbar"
        style={{
          scrollbarWidth: "none" /* Firefox */,
          msOverflowStyle: "none" /* IE and Edge */,
        }}
      >
        <style jsx global>{`
          /* Hide scrollbar for Chrome, Safari and Opera */
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <div className="flex flex-nowrap items-center min-w-max mx-auto justify-center">
          {groupedItems.map((group, groupIndex) => (
            <React.Fragment key={`group-${groupIndex}`}>
              {/* Render the group of items */}
              <div className="flex items-center">
                {group.map((item, itemIndex) => (
                  <div key={`${item.id}-${groupIndex}-${itemIndex}`} className="relative group">
                    <div
                      className="relative h-20 w-16 rounded-lg overflow-hidden shadow-md mx-1 cursor-pointer transition-transform hover:scale-105"
                      aria-label={`${item.name} (${item.type})`}
                    >
                      {showImages && item.image ? (
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          fill
                          className="object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full bg-muted flex items-center justify-center">
                          {item.type === "movie" ? (
                            <Film size={24} className="text-muted-foreground" />
                          ) : (
                            <User size={24} className="text-muted-foreground" />
                          )}
                        </div>
                      )}

                      {/* Only show rarity overlay for player selections */}
                      {item.selectedBy === "player" && item.rarity && (
                        <RarityOverlay rarity={item.rarity} showLabel={true} size="sm" />
                      )}
                    </div>
                    {/* Improved tooltip implementation */}
                    <div
                      className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/80 text-white text-xs rounded shadow-lg invisible group-hover:visible transition-opacity duration-100 whitespace-nowrap z-50 pointer-events-none"
                      style={{ minWidth: "120px", textAlign: "center" }}
                    >
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-gray-300 capitalize">{item.type}</p>
                      {item.selectedBy === "player" && item.rarity && item.rarity !== "common" && (
                        <p className="text-xs font-semibold mt-1" style={{ color: getRarityColor(item.rarity) }}>
                          {item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add arrow between groups with equal spacing */}
              {groupIndex < groupedItems.length - 1 && (
                <div className="w-12 flex justify-center items-center">
                  <ArrowRight size={20} className="text-muted-foreground" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
})

// Helper function to get color for rarity
function getRarityColor(rarity: string): string {
  switch (rarity) {
    case "legendary":
      return "#F59E0B" // amber-500
    case "epic":
      return "#9333EA" // purple-600
    case "rare":
      return "#4F46E5" // indigo-600
    case "uncommon":
      return "#10B981" // emerald-500
    default:
      return "#6B7280" // gray-500
  }
}

export default LiveGamePath
