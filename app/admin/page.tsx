"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Loader2, Search, Trash2, Edit, RefreshCw, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface User {
  id: string
  username: string
  points: number
  lastActive: number
  created: number
  gameStats: {
    gamesPlayed: number
    highScore: number
    legendaryCount: number
    epicCount: number
    rareCount: number
    uncommonCount: number
    commonCount: number
  }
}

interface GameStats {
  totalUsers: number
  activeUsers: number
  totalGamesPlayed: number
  averageScore: number
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<GameStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalGamesPlayed: 0,
    averageScore: 0,
  })
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newUsername, setNewUsername] = useState("")

  async function handleLogin() {
    try {
      // For now, use a simple hardcoded password
      // In production, this should be replaced with a proper API call
      if (password === "movieadmin123") {
        setIsAuthenticated(true)
        localStorage.setItem("adminAuthenticated", "true")
        fetchUsers()
        fetchStats()
      } else {
        setError("Invalid password")
      }
    } catch (error) {
      setError("Login failed")
    }
  }

  async function fetchUsers() {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/users")
      const data = await response.json()
      if (data.users) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats() {
    try {
      const response = await fetch("/api/admin/stats")
      const data = await response.json()
      if (data) {
        setStats(data)
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error)
    }
  }

  async function handleDeleteUser(userId: string) {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchUsers()
        fetchStats()
      }
    } catch (error) {
      console.error("Failed to delete user:", error)
    }
  }

  async function handleEditUsername() {
    if (!editingUser) return

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}/username`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername }),
      })

      if (response.ok) {
        setEditingUser(null)
        setNewUsername("")
        fetchUsers()
      }
    } catch (error) {
      console.error("Failed to update username:", error)
    }
  }

  // Check if admin is already authenticated
  useEffect(() => {
    const isAdmin = localStorage.getItem("adminAuthenticated") === "true"
    if (isAdmin) {
      setIsAuthenticated(true)
      fetchUsers()
      fetchStats()
    }
  }, [])

  // Filter users based on search term
  const filteredUsers = users.filter((user) => user.username.toLowerCase().includes(searchTerm.toLowerCase()))

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-muted/30">
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <Button className="w-full" onClick={handleLogin}>
                Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Game
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="users">
          <TabsList className="mb-6">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="stats">Game Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>User Management</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      className="pl-8 w-[250px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button size="sm" variant="outline" onClick={fetchUsers}>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>Games Played</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{user.points.toLocaleString()}</TableCell>
                            <TableCell>{user.gameStats.gamesPlayed}</TableCell>
                            <TableCell>{new Date(user.lastActive).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(user.created).toLocaleDateString()}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingUser(user)
                                    setNewUsername(user.username)
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="destructive">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete User</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete {user.username}? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                            {searchTerm ? "No users found matching your search" : "No users found"}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats">
            <Card>
              <CardHeader>
                <CardTitle>Game Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-muted/30 p-6 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Total Users</h3>
                    <p className="text-3xl font-bold">{stats.totalUsers}</p>
                  </div>
                  <div className="bg-muted/30 p-6 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Active Users (30d)</h3>
                    <p className="text-3xl font-bold">{stats.activeUsers}</p>
                  </div>
                  <div className="bg-muted/30 p-6 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Total Games Played</h3>
                    <p className="text-3xl font-bold">{stats.totalGamesPlayed}</p>
                  </div>
                  <div className="bg-muted/30 p-6 rounded-lg">
                    <h3 className="text-lg font-medium mb-2">Average Score</h3>
                    <p className="text-3xl font-bold">{stats.averageScore.toFixed(0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Username Dialog */}
        <AlertDialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Edit Username</AlertDialogTitle>
              <AlertDialogDescription>Change username for {editingUser?.username}</AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                maxLength={10}
                placeholder="New username"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleEditUsername}>Save Changes</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
