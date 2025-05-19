import { CACHE } from "./config"

// Cache item interface
interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
  url?: string
}

// Initialize the cache
let apiCache: { [key: string]: CacheItem<any> } = {}

// Initialize the cache
export function initializeCache(): void {
  apiCache = {}
  console.log("Cache initialized")
}

// Get an item from the cache
export function getCachedItem<T>(key: string): T | null {
  const item = apiCache[key]

  // If the item doesn't exist, return null
  if (!item) {
    return null
  }

  const now = Date.now()
  const age = now - item.timestamp

  // If the item is fresh, return it
  if (age < item.ttl) {
    return item.data
  }

  // If the item is stale but not too old, return it but mark it for refresh
  if (age < CACHE.STALE_TTL) {
    console.log(`Returning stale cache item: ${key.substring(0, 50)}...`)
    return item.data
  }

  // If the item is too old, remove it and return null
  delete apiCache[key]
  return null
}

// Set an item in the cache
export function setCachedItem<T>(key: string, data: T, url?: string, ttl: number = CACHE.TTL): void {
  // Check if we need to clean up the cache
  if (Object.keys(apiCache).length >= CACHE.MAX_SIZE) {
    cleanupCache()
  }

  apiCache[key] = {
    data,
    timestamp: Date.now(),
    ttl,
    url,
  }
}

// Clean up the cache by removing the oldest items
function cleanupCache(): void {
  const now = Date.now()
  const keys = Object.keys(apiCache)

  // Sort the keys by age (oldest first)
  keys.sort((a, b) => apiCache[a].timestamp - apiCache[b].timestamp)

  // Remove the oldest 20% of items
  const itemsToRemove = Math.ceil(keys.length * 0.2)
  for (let i = 0; i < itemsToRemove; i++) {
    delete apiCache[keys[i]]
  }

  console.log(`Cleaned up ${itemsToRemove} cache items`)
}

// Clear expired items from the cache
export function clearExpiredCache(): void {
  const now = Date.now()
  let count = 0

  for (const key in apiCache) {
    const item = apiCache[key]
    if (now - item.timestamp > CACHE.STALE_TTL) {
      delete apiCache[key]
      count++
    }
  }

  if (count > 0) {
    console.log(`Cleared ${count} expired cache items`)
  }
}

// Clear the entire cache
export function clearCache(): void {
  apiCache = {}
  console.log("Cache cleared")
}

// Get cache statistics
export function getCacheStats(): { size: number; oldestItem: number; newestItem: number } {
  const keys = Object.keys(apiCache)
  if (keys.length === 0) {
    return { size: 0, oldestItem: 0, newestItem: 0 }
  }

  let oldest = Date.now()
  let newest = 0

  for (const key in apiCache) {
    const timestamp = apiCache[key].timestamp
    if (timestamp < oldest) {
      oldest = timestamp
    }
    if (timestamp > newest) {
      newest = timestamp
    }
  }

  return {
    size: keys.length,
    oldestItem: Date.now() - oldest,
    newestItem: Date.now() - newest,
  }
}
