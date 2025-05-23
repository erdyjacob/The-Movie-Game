"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X, Trophy, Award, Crown, Gem } from "lucide-react"
import Image from "next/image"
import type { Achievement } from "@/lib/types"
import { getRarityColor } from "@/lib/achievements"

interface AchievementNotificationProps {
  achievement: Achievement
  onClose: () => void
}

const iconMap = {
  Trophy,
  Award,
  Crown,
  Gem,
}

export function AchievementNotification({ achievement, onClose }: AchievementNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const IconComponent = iconMap[achievement.icon as keyof typeof iconMap] || Trophy
  const rarityColor = getRarityColor(achievement.rarity)

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-500 transform ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
    >
      <Card className="w-80 border-2 shadow-lg" style={{ borderColor: rarityColor }}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Image src="/images/achievement.svg" alt="Achievement" width={24} height={24} className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Achievement Unlocked!</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${rarityColor}20`, color: rarityColor }}
            >
              <IconComponent className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg" style={{ color: rarityColor }}>
                {achievement.name}
              </h3>
              <p className="text-sm text-muted-foreground">{achievement.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
