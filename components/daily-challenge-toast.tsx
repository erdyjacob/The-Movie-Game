"use client"

import { useEffect } from "react"
import { toast } from "@/components/ui/use-toast"
import { Target, Trophy } from "lucide-react"
import type { GameItem } from "@/lib/types"

interface DailyChallengeToastProps {
  item: GameItem
  show: boolean
}

export function DailyChallengeToast({ item, show }: DailyChallengeToastProps) {
  useEffect(() => {
    if (show) {
      toast({
        title: (
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-red-500" />
            <span>Daily Challenge Completed</span>
          </div>
        ),
        description: (
          <div className="mt-2">
            <p className="mb-1">You found today's challenge pull.</p>
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <Trophy className="h-4 w-4" />
              <span>+50 bonus points added to your account score</span>
            </div>
          </div>
        ),
        duration: 5000,
      })
    }
  }, [show, item])

  return null
}
