// Cache structure
interface CacheItem<T> {
  data: T
  timestamp: number
  expiresAt: number
}

// Cache durations
const CACHE_DURATIONS = {
  // Movies and actors don't change often
  MOVIE_DETAILS: 7 * 24 * 60 * 60 * 1000, // 7 days
  ACTOR_DETAILS: 7 * 24 * 60 * 60 * 1000, // 7 days
  // Credits and filmographies change occasionally
  MOVIE_CREDITS: 3 * 24 * 60 * 60 * 1000, // 3 days
  ACTOR_CREDITS: 3 * 24 * 60 * 60 * 1000, // 3 days
  // Discovery endpoints change more frequently
  DISCOVER: 24 * 60 * 60 * 1000, // 1 day
  // Popular lists change frequently
  POPULAR: 12 * 60 * 60 * 1000, // 12 hours
  // Default for other endpoints
  DEFAULT: 24 * 60 * 60 * 1000, // 1 day
}

// Determine cache duration based on URL pattern
function getCacheDuration(url: string): number {
  if (url.includes("/movie/") && url.includes("/credits")) {
    return CACHE_DURATIONS.MOVIE_CREDITS
  } else if (url.includes("/person/") && url.includes("/movie_credits")) {
    return CACHE_DURATIONS.ACTOR_CREDITS
  } else if (url.includes("/movie/") && !url.includes("/credits")) {
    return CACHE_DURATIONS.MOVIE_DETAILS
  } else if (url.includes("/person/") && !url.includes("/credits")) {
    return CACHE_DURATIONS.ACTOR_DETAILS
  } else if (url.includes("/discover/")) {
    return CACHE_DURATIONS.DISCOVER
  } else if (url.includes("/popular")) {
    return CACHE_DURATIONS.POPULAR
  }
  return CACHE_DURATIONS.DEFAULT
}

// In-memory cache
const memoryCache: Record<string, CacheItem<any>> = {}

// Initialize cache from localStorage
export function initializeCache(): void {
  if (typeof window === "undefined") return

  try {
    const savedCache = localStorage.getItem("tmdbApiCache")
    if (savedCache) {
      const parsedCache = JSON.parse(savedCache)

      // Only keep non-expired items
      const now = Date.now()
      Object.entries(parsedCache).forEach(([key, value]) => {
        const item = value as CacheItem<any>
        if (item.expiresAt > now) {
          memoryCache[key] = item
        }
      })

      console.log(`Loaded ${Object.keys(memoryCache).length} cached items from localStorage`)
    }
  } catch (error) {
    console.error("Error loading cache from localStorage:", error)
  }
}

// Save cache to localStorage
export function persistCache(): void {
  if (typeof window === "undefined") return

  try {
    // Only persist non-expired items
    const now = Date.now()
    const cacheToSave = Object.fromEntries(Object.entries(memoryCache).filter(([_, value]) => value.expiresAt > now))

    // Limit the size of what we store
    const cacheString = JSON.stringify(cacheToSave)
    if (cacheString.length < 5 * 1024 * 1024) {
      // 5MB limit
      localStorage.setItem("tmdbApiCache", cacheString)
      console.log(`Saved ${Object.keys(cacheToSave).length} cached items to localStorage`)
    } else {
      console.warn("Cache too large to persist to localStorage")
      // Save only the most recent items
      const recentEntries = Object.entries(cacheToSave)
        .sort((a, b) => b[1].timestamp - a[1].timestamp)
        .slice(0, 100)

      const reducedCache = Object.fromEntries(recentEntries)
      localStorage.setItem("tmdbApiCache", JSON.stringify(reducedCache))
      console.log(`Saved 100 most recent cached items to localStorage`)
    }
  } catch (error) {
    console.error("Error saving cache to localStorage:", error)
  }
}

// Set up periodic cache persistence
export function setupCachePersistence(): void {
  if (typeof window === "undefined") return

  // Save cache every 5 minutes
  const intervalId = setInterval(persistCache, 5 * 60 * 1000)

  // Also save on page unload
  window.addEventListener("beforeunload", persistCache)

  return () => {
    clearInterval(intervalId)
    window.removeEventListener("beforeunload", persistCache)
  }
}

// Get item from cache
export function getCachedItem<T>(key: string): T | null {
  const item = memoryCache[key]
  if (!item) return null

  const now = Date.now()
  if (item.expiresAt < now) {
    // Item expired
    delete memoryCache[key]
    return null
  }

  return item.data
}

// Set item in cache
export function setCachedItem<T>(key: string, data: T, url: string): void {
  const now = Date.now()
  const duration = getCacheDuration(url)

  memoryCache[key] = {
    data,
    timestamp: now,
    expiresAt: now + duration,
  }

  // If we have too many items in memory, remove the oldest ones
  const MAX_CACHE_ITEMS = 500
  if (Object.keys(memoryCache).length > MAX_CACHE_ITEMS) {
    const oldestEntries = Object.entries(memoryCache)
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, Object.keys(memoryCache).length - MAX_CACHE_ITEMS)

    oldestEntries.forEach(([key]) => {
      delete memoryCache[key]
    })
  }
}

// Clear expired items from cache
export function clearExpiredCache(): void {
  const now = Date.now()
  let expiredCount = 0

  Object.keys(memoryCache).forEach((key) => {
    if (memoryCache[key].expiresAt < now) {
      delete memoryCache[key]
      expiredCount++
    }
  })

  if (expiredCount > 0) {
    console.log(`Cleared ${expiredCount} expired items from cache`)
  }
}

// Clear entire cache
export function clearCache(): void {
  Object.keys(memoryCache).forEach((key) => {
    delete memoryCache[key]
  })

  if (typeof window !== "undefined") {
    localStorage.removeItem("tmdbApiCache")
  }

  console.log("Cache cleared")
}

// Get cache stats
export function getCacheStats(): {
  totalItems: number
  movieDetails: number
  actorDetails: number
  movieCredits: number
  actorCredits: number
  discover: number
  popular: number
  other: number
  totalSizeMB: number
} {
  const stats = {
    totalItems: Object.keys(memoryCache).length,
    movieDetails: 0,
    actorDetails: 0,
    movieCredits: 0,
    actorCredits: 0,
    discover: 0,
    popular: 0,
    other: 0,
    totalSizeMB: 0,
  }

  Object.entries(memoryCache).forEach(([key, value]) => {
    if (key.includes("/movie/") && key.includes("/credits")) {
      stats.movieCredits++
    } else if (key.includes("/person/") && key.includes("/movie_credits")) {
      stats.actorCredits++
    } else if (key.includes("/movie/") && !key.includes("/credits")) {
      stats.movieDetails++
    } else if (key.includes("/person/") && !key.includes("/credits")) {
      stats.actorDetails++
    } else if (key.includes("/discover/")) {
      stats.discover++
    } else if (key.includes("/popular")) {
      stats.popular++
    } else {
      stats.other++
    }
  })

  // Estimate cache size
  const cacheString = JSON.stringify(memoryCache)
  stats.totalSizeMB = cacheString.length / (1024 * 1024)

  return stats
}
