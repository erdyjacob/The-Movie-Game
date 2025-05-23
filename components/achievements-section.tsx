"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronUp, ChevronDown, Eye, EyeOff, Trophy } from "lucide-react"
import Image from "next/image"
import type { Achievement } from "@/lib/types"
import { getRarityColor, getPreviewAchievements } from "@/lib/achievements"

interface AchievementsSectionProps {
  achievements: Achievement[]
}

export function AchievementsSection({ achievements }: AchievementsSectionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  const displayAchievements = isPreviewMode ? getPreviewAchievements() : achievements
  const unlockedCount = displayAchievements.filter((a) => a.unlocked).length
  const totalCount = displayAchievements.length

  return (
    <div>
      <div className="h-10 flex items-center justify-between">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full h-10 text-sm font-medium"
        >
          <span>
            Achievements ({unlockedCount}/{totalCount})
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                setIsPreviewMode(!isPreviewMode)
              }}
              className="h-6 w-6"
              title={isPreviewMode ? "Exit Preview Mode" : "Preview Mode"}
            >
              {isPreviewMode ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            </Button>
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </button>
      </div>

      {isPreviewMode && (
        <div className="mb-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
          Preview Mode - Showing sample achievement states
        </div>
      )}

      {isOpen && (
        <div className="space-y-3 mt-2">
          {displayAchievements.map((achievement) => {
            const rarityColor = getRarityColor(achievement.rarity)

            return (
              <div key={achievement.id} className="border rounded-lg p-3 transition-all bg-gray-900 border-gray-800">
                <div className="flex items-center gap-4">
                  <Image
                    src="/images/achievement.svg"
                    alt="Achievement"
                    width={48}
                    height={48}
                    className="w-12 h-12 object-contain flex-shrink-0"
                    style={{
                      filter: achievement.unlocked ? "none" : "grayscale(100%)",
                    }}
                  />

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4
                        className="font-medium text-base"
                        style={{ color: achievement.unlocked ? rarityColor : "#94A3B8" }}
                      >
                        {achievement.name}
                      </h4>
                      {achievement.unlocked && (
                        <div className="flex items-center gap-1 text-xs" style={{ color: rarityColor }}>
                          <Trophy className="w-3 h-3" />
                          <span>Unlocked</span>
                        </div>
                      )}
                    </div>

                    <p className="text-sm mt-1 text-gray-400">{achievement.description}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
