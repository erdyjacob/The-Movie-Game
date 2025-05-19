"use client"
import { useEffect, useRef, memo } from "react"
import type { GameItem } from "@/lib/types"
import { ArrowRight, Film, User } from "lucide-react"
import Image from "next/image"
import React from "react"
import { useMobile } from "@/hooks/use-mobile"
import { RarityOverlay } from "./rarity-overlay"
import { cn } from "@/lib/utils"

// Enhanced Rarity Card component - same as in game-path.tsx
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

/**
 * Truncates text to a specified maximum length and adds ellipsis
 * @param text The text to truncate
 * @param maxLength Maximum length before truncation (default: 10)
 * @returns Truncated text with ellipsis if needed
 */
const truncateText = (text: string, maxLength = 10): string => {
  if (!text) return ""
  if (text.length <= maxLength) return text
  return `${text.substring(0, maxLength)}...`
}

// Type for a group of items selected by the same entity (player or computer)
interface ItemGroup {
  selectedBy: string
  items: GameItem[]
}

interface LiveGamePathProps {
  history: GameItem[]
  difficulty: string
}

// Memoize the LiveGamePath component to prevent unnecessary re-renders
const LiveGamePath = memo(function LiveGamePath({ history, difficulty }: LiveGamePathProps) {
  const isMobile = useMobile()
  // Reference to the scrollable container
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Group items by who selected them (computer or player)
  const groupedHistory = React.useMemo(() => {
    if (!history.length) return []

    // Initialize with the first group
    const groups: ItemGroup[] = []
    let currentGroup: ItemGroup | null = null

    // Group consecutive items with the same selectedBy value
    history.forEach((item) => {
      // If this is the first item or the selectedBy has changed, create a new group
      if (!currentGroup || currentGroup.selectedBy !== item.selectedBy) {
        currentGroup = {
          selectedBy: item.selectedBy || "unknown",
          items: [item],
        }
        groups.push(currentGroup)
      } else {
        // Add to the current group
        currentGroup.items.push(item)
      }
    })

    return groups
  }, [history])

  // Scroll to the end when history changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth
    }
  }, [history])

  if (history.length === 0) {
    return null
  }

  return (
    <div className="w-full h-36 relative">
      {/* Increased height to accommodate content and tooltips */}
      <div
        ref={scrollContainerRef}
        className="w-full overflow-x-auto overflow-y-hidden pb-2 scroll-smooth hide-scrollbar absolute top-0 left-0 right-0"
      >
        {/* Center the game progress chain */}
        <div className="flex items-center justify-center min-w-max py-4">
          {/* Added vertical padding for tooltip space */}
          <div className="flex items-center space-x-2">
            {groupedHistory.map((group, groupIndex) => (
              <React.Fragment key={`group-${groupIndex}`}>
                {/* Render the group of items */}
                <div
                  className={`flex items-center space-x-1 p-1 rounded-lg ${
                    group.selectedBy === "player" ? "bg-blue-900/20" : "bg-red-900/20"
                  }`}
                  aria-label={`${group.selectedBy} selections`}
                >
                  {group.items.map((item, itemIndex) => (
                    <div
                      key={`${item.id}-${groupIndex}-${itemIndex}`}
                      className="relative group"
                      tabIndex={0}
                      aria-label={`${item.name}, ${item.type}`}
                    >
                      {/* Image container */}
                      <div className="relative h-24 w-16 rounded-lg overflow-hidden shadow-md">
                        {item.rarity && item.rarity !== "common" ? (
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
                              <div className="h-full w-full bg-[#0d1425] flex items-center justify-center">
                                {item.type === "movie" ? (
                                  <Film size={20} className="text-gray-400" />
                                ) : (
                                  <User size={20} className="text-gray-400" />
                                )}
                              </div>
                            )}

                            {/* Show rarity overlay for rare items */}
                            {item.rarity && item.rarity !== "common" && (
                              <RarityOverlay rarity={item.rarity} showLabel={false} />
                            )}
                          </>
                        )}
                      </div>

                      {/* Name tooltip that appears on hover/focus - positioned to avoid cutoff */}
                      <div
                        className={cn(
                          "absolute left-1/2 transform -translate-x-1/2 top-full mt-1",
                          "px-2 py-0.5 bg-black bg-opacity-80 rounded",
                          "opacity-0 group-hover:opacity-100 group-focus:opacity-100",
                          "transition-opacity duration-200",
                          // Support for mobile touch
                          "group-active:opacity-100 md:group-active:opacity-100",
                          // Ensure it appears above other elements
                          "z-10 pointer-events-none", // Prevent tooltip from blocking other interactions
                          // Fixed width for consistency
                          "w-auto min-w-[16px] max-w-[80px]",
                        )}
                      >
                        <span
                          className="text-xs text-white block text-center whitespace-nowrap overflow-hidden"
                          title={item.name}
                        >
                          {truncateText(item.name, 10)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add arrow between groups (not between individual items) */}
                {groupIndex < groupedHistory.length - 1 && (
                  <ArrowRight size={24} className="text-gray-400" aria-hidden="true" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})

export default LiveGamePath
