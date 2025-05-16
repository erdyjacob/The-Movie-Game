"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"

interface UsernameRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (userId: string, username: string) => void
}

export function UsernameRegistrationModal({ isOpen, onClose, onSubmit }: UsernameRegistrationModalProps) {
  const [username, setUsername] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit() {
    if (!username.trim()) {
      setError("Username cannot be empty")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch("/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || "Registration failed")
        setIsSubmitting(false)
        return
      }

      // Store user ID in localStorage
      localStorage.setItem("movieGameUserId", data.userId)
      localStorage.setItem("movieGameUsername", username)

      onSubmit(data.userId, username)
      onClose()
    } catch (err) {
      console.error("Registration error:", err)
      setError("Registration failed. Please try again.")
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Choose a Username</DialogTitle>
          <DialogDescription>Pick a username to appear on the leaderboard (max 10 characters)</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={10}
            placeholder="Username"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !username.trim()}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Username"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
