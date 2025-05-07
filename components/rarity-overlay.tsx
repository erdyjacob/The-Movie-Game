import type { Rarity } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Star } from "lucide-react"

interface RarityOverlayProps {
  rarity?: Rarity
  showLabel?: boolean
  className?: string
  size?: "sm" | "md" | "lg"
  isDailyChallenge?: boolean
}

export function RarityOverlay({
  rarity,
  showLabel = true,
  className,
  size = "md",
  isDailyChallenge = false,
}: RarityOverlayProps) {
  if (!rarity || rarity === "common") return null

  // Gradient overlays for each rarity
  const gradientStyles = {
    uncommon: "bg-gradient-to-br from-green-500/40 to-green-700/60 mix-blend-multiply",
    rare: "bg-gradient-to-br from-blue-500/40 to-indigo-700/60 mix-blend-multiply",
    epic: "bg-gradient-to-br from-purple-500/40 to-purple-800/60 mix-blend-multiply",
    legendary: "bg-gradient-to-br from-amber-400/40 to-amber-700/60 mix-blend-multiply",
  }

  // Circle background colors for each rarity
  const circleStyles = {
    uncommon: "bg-green-600",
    rare: "bg-indigo-600",
    epic: "bg-purple-700",
    legendary: "bg-amber-600",
  }

  // Size classes for the circle
  const circleSizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  }

  // Size classes for the star
  const starSizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  }

  // Daily challenge styles
  const dailyChallengeStyles = isDailyChallenge ? "ring-2 ring-red-500 ring-offset-1" : ""

  return (
    <>
      <div className={cn("absolute inset-0 rounded-lg", gradientStyles[rarity], className)} />
      {showLabel && (
        <div className="absolute bottom-2 right-2 z-10">
          <div
            className={cn(
              "rounded-full flex items-center justify-center text-white",
              circleStyles[rarity],
              circleSizeClasses[size],
              dailyChallengeStyles,
            )}
          >
            <Star className={cn("fill-current", starSizeClasses[size])} />
          </div>
        </div>
      )}
    </>
  )
}
