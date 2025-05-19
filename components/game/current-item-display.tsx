"use client"

import Image from "next/image"
import { Film, User } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import type { GameItem, Difficulty } from "@/lib/types"

interface CurrentItemDisplayProps {
  currentItem: GameItem
  showImages: boolean
  difficulty: Difficulty
}

export function CurrentItemDisplay({ currentItem, showImages, difficulty }: CurrentItemDisplayProps) {
  const isMobile = useMobile()

  return (
    <div className="flex flex-col items-center justify-center gap-3 sm:gap-4">
      {showImages && currentItem.image ? (
        <div className="relative h-64 w-44 sm:h-72 sm:w-48 overflow-hidden rounded-md shadow-md">
          <Image
            src={currentItem.image || "/placeholder.svg"}
            alt={currentItem.name}
            fill
            className={cn(
              "object-cover",
              // Apply blur filter for medium difficulty
              difficulty === "medium" && "filter blur-[2px]",
            )}
            loading="eager"
            priority
          />
        </div>
      ) : (
        <div className="h-64 w-44 sm:h-72 sm:w-48 rounded-md bg-[#0d1425] flex items-center justify-center">
          {currentItem.type === "movie" ? (
            <Film size={isMobile ? 28 : 36} className="text-gray-400" />
          ) : (
            <User size={isMobile ? 28 : 36} className="text-gray-400" />
          )}
        </div>
      )}
      <h3 className="text-xl font-semibold">{currentItem.name}</h3>
    </div>
  )
}
