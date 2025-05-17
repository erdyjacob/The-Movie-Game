"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { isValidUsername } from "@/lib/username-validation"
import { useDebounce } from "@/hooks/use-debounce"
import { X } from "lucide-react"

interface UsernameSetupProps {
  onComplete: (username: string, userId: string) => void
  onCancel: () => void
}

export function UsernameSetup({ onComplete, onCancel }: UsernameSetupProps) {
  // Initialize state
  const [username, setUsername] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const debouncedUsername = useDebounce(username, 500)

  // Reset state when component mounts
  useEffect(() => {
    setUsername("")
    setIsChecking(false)
    setIsSubmitting(false)
    setError(null)
    setIsAvailable(null)
  }, [])

  // Check username availability when the debounced username changes
  useEffect(() => {
    async function checkUsername() {
      if (!debouncedUsername || debouncedUsername.length < 3) {
        setIsAvailable(null)
        return
      }

      // First do client-side validation
      const validation = isValidUsername(debouncedUsername)
      if (!validation.valid) {
        setError(validation.message || "Invalid username")
        setIsAvailable(false)
        return
      }

      setIsChecking(true)
      setError(null)

      try {
        const response = await fetch("/api/username/check", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: debouncedUsername }),
        })

        const data = await response.json()

        if (response.ok) {
          setIsAvailable(data.available)
          if (!data.available) {
            setError(data.message)
          }
        } else {
          setError(data.message || "Error checking username")
          setIsAvailable(false)
        }
      } catch (err) {
        console.error("Error checking username:", err)
        setError("Error checking username availability")
        setIsAvailable(false)
      } finally {
        setIsChecking(false)
      }
    }

    checkUsername()
  }, [debouncedUsername])

  const handleSubmit = async () => {
    if (!username || !isAvailable) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/username/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Save username to localStorage
        localStorage.setItem("movieGameUsername", username)
        localStorage.setItem("movieGameUserId", data.userId)

        // Call the onComplete callback
        onComplete(username, data.userId)
      } else {
        setError(data.message || "Error registering username")
      }
    } catch (err) {
      console.error("Error registering username:", err)
      setError("Error registering username")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        <DialogHeader>
          <DialogTitle>Choose Your Screen Name</DialogTitle>
          <DialogDescription>Pick a unique screen name to appear on the leaderboard.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              Screen Name
            </label>
            <div className="relative">
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter a screen name"
                className="pr-12"
                maxLength={20}
              />
              {isChecking && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"></div>
                </div>
              )}
              {!isChecking && isAvailable === true && username.length >= 3 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">✓</div>
              )}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            {isAvailable && <p className="text-sm text-green-500">Username is available!</p>}
            <p className="text-xs text-gray-500">3-20 characters, letters, numbers, underscores, and hyphens only.</p>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={!isAvailable || isSubmitting || isChecking || username.length < 3}>
            {isSubmitting ? "Setting up..." : "Continue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
