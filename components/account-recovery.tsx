"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

export function AccountRecovery() {
  const [isOpen, setIsOpen] = useState(false)
  const [recoveryStatus, setRecoveryStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [error, setError] = useState("")

  const handleRecovery = async () => {
    try {
      setRecoveryStatus("loading")
      setError("")

      // Get backup from localStorage
      const userId = localStorage.getItem("movieGameUserId")
      const username = localStorage.getItem("movieGameUsername")

      if (!userId || !username) {
        setError("No account data found on this device")
        setRecoveryStatus("error")
        return
      }

      // Verify backup with server
      const response = await fetch("/api/user/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, username }),
      })

      const data = await response.json()

      if (data.success) {
        // Update last active timestamp
        await fetch("/api/user/update-last-active", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        })

        setRecoveryStatus("success")

        // Reload page after 2 seconds
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setError(data.error || "Recovery failed")
        setRecoveryStatus("error")
      }
    } catch (error) {
      console.error("Recovery error:", error)
      setError("Recovery failed. Please try again.")
      setRecoveryStatus("error")
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        Recover Account
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recover Account</DialogTitle>
            <DialogDescription>Restore your account from this device's backup.</DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {recoveryStatus === "idle" && (
              <p className="text-sm text-muted-foreground">
                If you've previously used The Movie Game on this device, we can try to recover your account.
              </p>
            )}

            {recoveryStatus === "loading" && (
              <div className="flex flex-col items-center py-4">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                <p>Recovering your account...</p>
              </div>
            )}

            {recoveryStatus === "success" && (
              <div className="flex flex-col items-center py-4 text-green-600">
                <CheckCircle className="h-8 w-8 mb-2" />
                <p>Account recovered successfully!</p>
              </div>
            )}

            {recoveryStatus === "error" && (
              <div className="flex flex-col items-center py-4 text-red-600">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p>{error}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            {recoveryStatus === "idle" && (
              <>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRecovery}>Recover Account</Button>
              </>
            )}

            {(recoveryStatus === "success" || recoveryStatus === "error") && (
              <Button onClick={() => setIsOpen(false)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
