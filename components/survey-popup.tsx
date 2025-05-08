"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Heart } from "lucide-react"

interface SurveyPopupProps {
  open: boolean
  onClose: () => void
  onNewGame: () => void
}

export function SurveyPopup({ open, onClose, onNewGame }: SurveyPopupProps) {
  const handleTakeSurvey = () => {
    // Open the survey in a new tab
    window.open("https://forms.gle/mjRy4z2s7rAtsMzF7", "_blank")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-center gap-2 text-xl">
            <Heart className="h-5 w-5 text-red-500 fill-red-500" />
            Enjoying The Movie Game?
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            We'd love to hear your feedback! Please consider filling out our quick survey to help us improve the game.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-4">
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-sm">Your feedback helps us make the game better for everyone!</p>
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-center gap-2 sm:space-x-2">
          <Button variant="outline" onClick={onNewGame} className="sm:flex-1">
            New Game
          </Button>
          <Button onClick={handleTakeSurvey} className="sm:flex-1 bg-gradient-to-r from-blue-500 to-indigo-600">
            Take Survey
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
