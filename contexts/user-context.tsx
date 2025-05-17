"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { UsernameSetup } from "@/components/username-setup"

interface UserContextType {
  username: string | null
  userId: string | null
  isLoading: boolean
  isUsernameSetupVisible: boolean // Expose this state to components
  setUser: (username: string, userId: string) => void
  clearUser: () => void
  showUsernameSetup: () => void
  hideUsernameSetup: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUsernameSetupVisible, setIsUsernameSetupVisible] = useState(false)

  useEffect(() => {
    // Load user data from localStorage on initial render
    const storedUsername = localStorage.getItem("movieGameUsername")
    const storedUserId = localStorage.getItem("movieGameUserId")

    if (storedUsername && storedUserId) {
      setUsername(storedUsername)
      setUserId(storedUserId)
    }

    setIsLoading(false)
  }, [])

  const setUser = (newUsername: string, newUserId: string) => {
    setUsername(newUsername)
    setUserId(newUserId)
    localStorage.setItem("movieGameUsername", newUsername)
    localStorage.setItem("movieGameUserId", newUserId)
    setIsUsernameSetupVisible(false)
  }

  const clearUser = () => {
    setUsername(null)
    setUserId(null)
    localStorage.removeItem("movieGameUsername")
    localStorage.removeItem("movieGameUserId")
  }

  const showUsernameSetup = () => {
    setIsUsernameSetupVisible(true)
  }

  const hideUsernameSetup = () => {
    setIsUsernameSetupVisible(false)
  }

  const handleSetupComplete = (newUsername: string, newUserId: string) => {
    setUser(newUsername, newUserId)
  }

  return (
    <UserContext.Provider
      value={{
        username,
        userId,
        isLoading,
        isUsernameSetupVisible, // Expose this state
        setUser,
        clearUser,
        showUsernameSetup,
        hideUsernameSetup,
      }}
    >
      {children}
      {isUsernameSetupVisible && <UsernameSetup onComplete={handleSetupComplete} onCancel={hideUsernameSetup} />}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
