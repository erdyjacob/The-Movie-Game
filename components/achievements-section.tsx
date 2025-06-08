"use client"

import { useState } from "react"
import { ChevronUp, ChevronDown, Trophy } from "lucide-react"
import Image from "next/image"
import type { Achievement } from "@/lib/types"

interface AchievementsSectionProps {
  achievements: Achievement[]
}

export function AchievementsSection({ achievements }: AchievementsSectionProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Safety check for undefined achievements
  if (!achievements || !Array.isArray(achievements)) {
    return (
      <div>
        <div className="h-10 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-400">Achievements (Loading...)</span>
        </div>
      </div>
    )
  }

  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const totalCount = achievements.length

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
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="max-h-[400px] overflow-y-auto mt-2">
          <div className="space-y-3 pr-2">
            {achievements.map((achievement) => {
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
                          style={{ color: achievement.unlocked ? "#F59E0B" : "#94A3B8" }}
                        >
                          {achievement.name}
                        </h4>
                        {achievement.unlocked && (
                          <div className="flex items-center gap-1 text-xs" style={{ color: "#F59E0B" }}>
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
        </div>
      )}
    </div>
  )
}
