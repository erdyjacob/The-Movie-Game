"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useUser } from "@/contexts/user-context"

interface UserSettingsPopupProps {
  isOpen: boolean
  onClose: () => void
}

export function UserSettingsPopup({ isOpen, onClose }: UserSettingsPopupProps) {
  const { username, userId, clearUser } = useUser()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleDeleteAccount = async () => {
    if (!showConfirmation) {
      setShowConfirmation(true)
      return
    }

    if (!userId) return

    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch("/api/user/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        setSuccess(true)
        // Clear local user data
        clearUser()

        // Wait a moment before closing the dialog
        setTimeout(() => {
          onClose()
          // Reload the page to reset the UI state
          window.location.reload()
        }, 2000)
      } else {
        const data = await response.json()
        setError(data.message || "Failed to delete account")
        setShowConfirmation(false)
      }
    } catch (err) {
      console.error("Error deleting account:", err)
      setError("An unexpected error occurred")
      setShowConfirmation(false)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancel = () => {
    setShowConfirmation(false)
    setError(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
          <DialogDescription>Manage your account settings and preferences.</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="space-y-4">
            <div className="p-3 bg-muted/30 rounded-md">
              <p className="text-sm font-medium">Username</p>
              <p className="text-sm text-muted-foreground">{username}</p>
            </div>

            {success ? (
              <div className="p-3 bg-green-100 text-green-800 rounded-md">
                <p className="text-sm">Your account has been successfully deleted.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Deleting your account will permanently remove all your data, including leaderboard entries and
                  collection progress.
                </p>

                {error && (
                  <div className="p-3 bg-red-100 text-red-800 rounded-md">
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                {showConfirmation ? (
                  <div className="space-y-3 p-3 border border-red-300 bg-red-50 rounded-md">
                    <p className="text-sm font-medium text-red-800">Are you absolutely sure?</p>
                    <p className="text-xs text-red-700">
                      This action cannot be undone. All your data will be permanently deleted.
                    </p>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={handleCancel} disabled={isDeleting}>
                        Cancel
                      </Button>
                      <Button variant="destructive" size="sm" onClick={handleDeleteAccount} disabled={isDeleting}>
                        {isDeleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          "Yes, delete my account"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="destructive" onClick={handleDeleteAccount} className="w-full">
                    Delete Account
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
