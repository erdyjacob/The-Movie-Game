"use client"

import { useEffect } from "react"
import { toast } from "@/components/ui/use-toast"
import type { GameItem } from "@/lib/types"

interface DailyChallengeToastProps {
  item: GameItem
  show: boolean
}

export function DailyChallengeToast({ item, show }: DailyChallengeToastProps) {
  useEffect(() => {
    if (show) {
      showDailyChallengeCompletedToast()
    }
  }, [show, item])

  return null
}

// Find the toast content and modify it to be more celebratory
export function showDailyChallengeCompletedToast() {
  toast({
    title: "Daily Challenge Completed! 🎉",
    description: (
      <div className="flex flex-col gap-2">
        <p>Congratulations! You've completed today's challenge!</p>
        <p className="text-sm text-muted-foreground">Come back tomorrow for a new challenge.</p>
      </div>
    ),
    variant: "success",
    duration: 5000, // Show for longer
  })
}
