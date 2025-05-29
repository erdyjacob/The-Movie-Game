import { APP_VERSION } from "./config"

export interface VersionCheckResult {
  wasCleared: boolean
  previousVersion: string | null
  currentVersion: string
  clearedItems: string[]
}

export function performVersionCheck(): VersionCheckResult {
  // Only run in browser
  if (typeof window === "undefined") {
    return {
      wasCleared: false,
      previousVersion: null,
      currentVersion: APP_VERSION,
      clearedItems: [],
    }
  }

  // Get stored version (if any)
  const storedVersion = localStorage.getItem("movieGameVersion")
  const clearedItems: string[] = []

  // If no version or version mismatch, clear old data
  if (!storedVersion || storedVersion !== APP_VERSION) {
    console.log(`🧹 Version check: ${storedVersion || "none"} → ${APP_VERSION}. Clearing localStorage...`)

    // List of localStorage items to clear
    const itemsToClear = [
      "movieGameUsername",
      "movieGameUserId",
      "movieGamePlayerHistory",
      "movieGameCompletedGames",
      "movieGameLongestChain",
      "dailyChallengeCompletions",
      "dailyChallengeItems",
      "movieGameAchievements",
      "movieGameStats",
      "movieGameSessionData",
      "movieGameLastSync",
      "movieGameUserData",
    ]

    // Clear each item and track what was cleared
    itemsToClear.forEach((item) => {
      if (localStorage.getItem(item) !== null) {
        localStorage.removeItem(item)
        clearedItems.push(item)
      }
    })

    // Keep user preferences and settings (if they exist)
    // localStorage.removeItem("movieGamePreferences"); // Commented out to preserve settings

    // Update to current version
    localStorage.setItem("movieGameVersion", APP_VERSION)

    console.log(`✅ Cleared ${clearedItems.length} localStorage items:`, clearedItems)

    return {
      wasCleared: true,
      previousVersion: storedVersion,
      currentVersion: APP_VERSION,
      clearedItems,
    }
  }

  console.log(`✅ Version check passed: ${APP_VERSION}`)
  return {
    wasCleared: false,
    previousVersion: storedVersion,
    currentVersion: APP_VERSION,
    clearedItems: [],
  }
}

export function getAppVersion(): string {
  return APP_VERSION
}

export function getStoredVersion(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("movieGameVersion")
}
