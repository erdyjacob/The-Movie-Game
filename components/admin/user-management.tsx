"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Trash2, AlertTriangle, GamepadIcon, BarChart3 } from "lucide-react"
import { UserAnalyticsDisplay } from "./user-analytics"

interface User {
  userId: string
  username: string
  score: number | null
  gamesPlayed: number
}

interface PaginationInfo {
  total: number
  page: number
  limit: number
  totalPages: number
}

interface UserManagementProps {
  adminPassword: string
}

export function UserManagement({ adminPassword }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Delete user dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [banUsername, setBanUsername] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchUsers = async (page = 1, search = searchQuery) => {
    if (!adminPassword) {
      setMessage("Admin password is required")
      setStatus("error")
      return
    }

    setIsLoading(true)
    setMessage("")
    setStatus("idle")

    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      })

      if (search) {
        queryParams.append("search", search)
      }

      const response = await fetch(`/api/admin/users?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${adminPassword}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to fetch users")
      }

      const data = await response.json()
      setUsers(data.users)
      setPagination(data.pagination)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "An unexpected error occurred")
      setStatus("error")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchUsers(1, searchQuery)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      fetchUsers(newPage)
    }
  }

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user)
    setBanUsername(false)
    setDeleteDialogOpen(true)
  }

  const handleDeleteUser = async () => {
    if (!userToDelete || !adminPassword) return

    setIsDeleting(true)
    setMessage("")
    setStatus("idle")

    try {
      const response = await fetch("/api/admin/users/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: userToDelete.userId,
          username: userToDelete.username,
          password: adminPassword,
          banUsername,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to delete user")
      }

      const data = await response.json()
      setMessage(data.message)
      setStatus("success")

      // Refresh the user list
      fetchUsers(pagination.page)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "An unexpected error occurred")
      setStatus("error")
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  // Format score with commas
  const formatScore = (score: number | null) => {
    if (score === null) return "N/A"
    return score.toLocaleString()
  }

  // Format games played count
  const formatGamesPlayed = (gamesPlayed: number) => {
    if (gamesPlayed === 0) return "0"
    return gamesPlayed.toLocaleString()
  }

  // Get activity level indicator
  const getActivityLevel = (gamesPlayed: number) => {
    if (gamesPlayed === 0) return { level: "inactive", color: "text-gray-400" }
    if (gamesPlayed < 5) return { level: "low", color: "text-yellow-600" }
    if (gamesPlayed < 20) return { level: "moderate", color: "text-blue-600" }
    if (gamesPlayed < 50) return { level: "active", color: "text-green-600" }
    return { level: "very active", color: "text-purple-600" }
  }

  useEffect(() => {
    if (adminPassword) {
      fetchUsers()
    }
  }, [adminPassword])

  return (
    <Tabs defaultValue="users" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="users">User Management</TabsTrigger>
        <TabsTrigger value="analytics" disabled={!selectedUser}>
          <BarChart3 className="w-4 h-4 mr-2" />
          User Analytics
        </TabsTrigger>
      </TabsList>

      <TabsContent value="users">
        <div className="space-y-6">
          <div className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Search users by username or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button type="submit" disabled={isLoading}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </form>

            {message && (
              <div
                className={`text-sm p-3 rounded ${
                  status === "success"
                    ? "bg-green-100 text-green-800"
                    : status === "error"
                      ? "bg-red-100 text-red-800"
                      : ""
                }`}
              >
                {message}
              </div>
            )}

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <GamepadIcon className="h-4 w-4" />
                        <span>Games Played</span>
                      </div>
                    </TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        {isLoading ? "Loading users..." : "No users found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => {
                      const activityLevel = getActivityLevel(user.gamesPlayed)
                      const isSelected = selectedUser?.userId === user.userId
                      return (
                        <TableRow
                          key={user.userId}
                          className={`cursor-pointer ${isSelected ? "bg-blue-50" : ""}`}
                          onClick={() => setSelectedUser(user)}
                        >
                          <TableCell className="font-medium">
                            {user.username || <span className="text-muted-foreground italic">Unknown</span>}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{user.userId}</TableCell>
                          <TableCell className={user.score ? "font-semibold text-amber-500" : "text-muted-foreground"}>
                            {formatScore(user.score)}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`font-semibold ${activityLevel.color}`}>
                                {formatGamesPlayed(user.gamesPlayed)}
                              </span>
                              <span className={`text-xs ${activityLevel.color} capitalize`}>{activityLevel.level}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                openDeleteDialog(user)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {users.length} of {pagination.total} users
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1 || isLoading}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages || isLoading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}

            {selectedUser && (
              <div className="p-4 bg-blue-50 rounded-lg border">
                <h3 className="font-semibold text-blue-900">Selected User</h3>
                <p className="text-blue-700">
                  {selectedUser.username || "Unknown"} ({selectedUser.userId})
                </p>
                <p className="text-sm text-blue-600">
                  Click the "User Analytics" tab to view detailed analytics for this user.
                </p>
              </div>
            )}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="analytics">
        {selectedUser ? (
          <UserAnalyticsDisplay
            adminToken={adminPassword}
            userId={selectedUser.userId}
            username={selectedUser.username || "Unknown"}
          />
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            Select a user from the User Management tab to view their analytics
          </div>
        )}
      </TabsContent>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the user{" "}
              {userToDelete?.username ? `"${userToDelete.username}"` : `with ID "${userToDelete?.userId}"`}? This action
              cannot be undone.
              {userToDelete?.gamesPlayed && userToDelete.gamesPlayed > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                  <strong>Warning:</strong> This user has played {formatGamesPlayed(userToDelete.gamesPlayed)} games.
                  Deleting will remove all their game history.
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {userToDelete?.username && (
            <div className="flex items-start space-x-2 pt-2">
              <Checkbox
                id="ban-username"
                checked={banUsername}
                onCheckedChange={(checked) => setBanUsername(checked === true)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="ban-username"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Ban username
                </Label>
                <p className="text-sm text-muted-foreground">Prevent this username from being registered again</p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
