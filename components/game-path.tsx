"use client"

import type { GameItem } from "@/lib/types"
import { Film, User, ArrowDown } from "lucide-react"
import Image from "next/image"
import { RarityOverlay } from "./rarity-overlay"

// Replace the LegendaryCard component with this enhanced version that supports all rarities:
const EnhancedRarityCard = ({ item }: { item: GameItem }) => {
  // Get the appropriate colors based on rarity
  const getRarityColors = (rarity: string) => {
    switch (rarity) {
      case "legendary":
        return {
          border: "#f7c52b", // amber-500
          glow: "rgba(247, 197, 43, 0.6)",
          background: "linear-gradient(135deg, rgba(247, 197, 43, 0.3), transparent 60%)",
        }
      case "epic":
        return {
          border: "#9333ea", // purple-600
          glow: "rgba(147, 51, 234, 0.6)",
          background: "linear-gradient(135deg, rgba(147, 51, 234, 0.3), transparent 60%)",
        }
      case "rare":
        return {
          border: "#4f46e5", // indigo-600
          glow: "rgba(79, 70, 229, 0.6)",
          background: "linear-gradient(135deg, rgba(79, 70, 229, 0.3), transparent 60%)",
        }
      case "uncommon":
        return {
          border: "#10b981", // emerald-500
          glow: "rgba(16, 185, 129, 0.6)",
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.3), transparent 60%)",
        }
      default:
        return {
          border: "#6b7280", // gray-500
          glow: "rgba(107, 114, 128, 0.3)",
          background: "none",
        }
    }
  }

  const colors = getRarityColors(item.rarity || "common")
  const showBadge = item.rarity === "legendary" || item.rarity === "epic"

  return (
    <div
      className="rarity-card"
      style={{
        boxShadow: `0 0 10px ${colors.glow}`,
        borderColor: colors.border,
      }}
    >
      <div className="rarity-card-content">
        {item.image ? (
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
        {showBadge && (
          <div className="rarity-badge" style={{ backgroundColor: colors.border }}>
            <div className="rarity-star"></div>
          </div>
        )}
        <div className="rarity-glow" style={{ background: colors.background }}></div>
      </div>

      <style jsx>{`
        .rarity-card {
          width: 100%;
          height: 100%;
          position: relative;
          border-radius: 10px;
          overflow: hidden;
          border: 2px solid;
        }
        .rarity-card-content {
          width: 100%;
          height: 100%;
          position: relative;
        }
        .rarity-badge {
          position: absolute;
          bottom: 4px;
          right: 4px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }
        .rarity-star {
          width: 12px;
          height: 12px;
          background-color: white;
          clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
        }
        .rarity-glow {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}

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
                      {group[0].selectedBy === "player" && group[0].rarity && group[0].rarity !== "common" ? (
                        <EnhancedRarityCard item={group[0]} />
                      ) : (
                        <>
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
                        </>
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
                        {item.selectedBy === "player" && item.rarity && item.rarity !== "common" ? (
                          <EnhancedRarityCard item={item} />
                        ) : (
                          <>
                            {item.image ? (
                              <Image
                                src={item.image || "/placeholder.svg"}
                                alt={item.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="h-full w-full bg-muted flex items-center justify-center">
                                {item.type === "movie" ? <Film size={24} /> : <User size={24} />}
                              </div>
                            )}

                            {/* Only show rarity overlay for player selections */}
                            {item.selectedBy === "player" && item.rarity && (
                              <RarityOverlay rarity={item.rarity} showLabel={true} />
                            )}
                          </>
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
