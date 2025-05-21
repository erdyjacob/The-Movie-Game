"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from "@/contexts/user-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function DeleteAccountTest() {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const { toast } = useToast()
  const { username, userId, clearUser } = useUser()

  // Simplified delete account function for testing
  const handleDeleteAccountTest = async () => {
    if (!username || !userId) {
      toast({
        title: "Error",
        description: "Username or userId is missing",
        variant: "destructive",
      })
      return
    }

    try {
      setIsDeleting(true)
      setResult(null)

      console.log("Sending delete test request with:", { userId, username })

      // Call the test API endpoint
      const response = await fetch("/api/user/delete-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          username,
        }),
      })

      console.log("Response status:", response.status)

      // Parse the response
      const data = await response.json()
      console.log("Response data:", data)

      // Store the result for display
      setResult(data)

      if (!response.ok) {
        throw new Error(data.message || "Failed to test account deletion")
      }

      // Show success toast
      toast({
        title: "Test Successful",
        description: "The delete account test was successful.",
      })
    } catch (error) {
      console.error("Error in test deletion:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to test account deletion",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-red-500" />
          Delete Account Test
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 border rounded-md">
            <h3 className="font-medium">Current User Info:</h3>
            <p className="text-sm mt-2">Username: {username || "Not logged in"}</p>
            <p className="text-sm">User ID: {userId || "Not available"}</p>
          </div>

          <Button
            variant="destructive"
            className="w-full"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={!username || !userId}
          >
            Test Delete Account
          </Button>

          {result && (
            <div className={`p-4 border rounded-md ${result.success ? "bg-green-50" : "bg-red-50"}`}>
              <h3 className="font-medium">Test Result:</h3>
              <pre className="text-xs mt-2 overflow-auto p-2 bg-gray-100 rounded">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Test Delete Account
              </DialogTitle>
              <DialogDescription>
                This will test the account deletion process for <span className="font-semibold">{username}</span>.
              </DialogDescription>
              <div className="mt-2 text-sm">
                This is a simplified test that will only remove the username mapping. It will not delete all user data.
              </div>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteAccountTest} disabled={isDeleting}>
                {isDeleting ? "Testing..." : "Run Test"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
