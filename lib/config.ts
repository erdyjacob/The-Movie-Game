// API Configuration
export const API = {
  BASE_URL: "https://api.themoviedb.org/3",
  ANIMATION_GENRE_ID: 16,
  DOCUMENTARY_GENRE_ID: 99,
  MIN_MOVIE_POPULARITY: 1.0,
  MIN_MOVIE_VOTE_COUNT: 100,
  MIN_ACTOR_POPULARITY: 1.0,
  MAX_RETRIES: 3,
  INITIAL_RETRY_DELAY: 1000, // 1 second
  MAX_REQUESTS_PER_SECOND: 4, // TMDB allows 4 requests per second
}

// App Version for localStorage migration
export const APP_VERSION = "2.0.0" // Clean slate version with enhanced tracking

// Cache Configuration
export const CACHE = {
  TTL: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  STALE_TTL: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  MAX_SIZE: 1000, // Maximum number of items in the cache
  CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour in milliseconds
}

// Leaderboard Configuration
export const LEADERBOARD = {
  MAX_ENTRIES: 100,
  CACHE_TTL: 30 * 60, // 30 minutes in seconds
  MIN_SCORE_FOR_LEADERBOARD: 100,
}

// Game Configuration
export const GAME = {
  MAX_RECENT_ITEMS: 10,
  MAX_RECENT_FRANCHISES: 5,
  MAX_RECENT_ACTOR_TYPES: 5,
  PREFETCH_BATCH_SIZE: 5,
}

// Rank Configuration - Updated with more challenging thresholds
export const RANK = {
  THRESHOLDS: {
    SS: 50000, // 5x harder
    "S+": 35000, // 4.7x harder
    S: 25000, // 5x harder
    "S-": 18000, // new tier
    "A+": 12000, // 4x harder
    A: 8000, // 4x harder
    "A-": 6000, // new tier
    "B+": 4500, // 3x harder
    B: 3000, // 3x harder
    "B-": 2200, // new tier
    "C+": 1600, // 2.1x harder
    C: 1200, // 2.4x harder
    "C-": 900, // new tier
    "D+": 650, // 2.2x harder
    D: 450, // 2.3x harder
    "D-": 300, // new tier
    "F+": 150, // 1.5x harder
    F: 50, // new tier
    "F-": 0, // new bottom tier
  },
}

// User Configuration
export const USER = {
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 20,
  USERNAME_REGEX: /^[a-zA-Z0-9_-]+$/,
}

// Security Configuration
export const SECURITY = {
  RATE_LIMIT: {
    MAX_REQUESTS: 100,
    WINDOW_MS: 60 * 1000, // 1 minute
  },
  ADMIN_RATE_LIMIT: {
    MAX_REQUESTS: 20,
    WINDOW_MS: 60 * 1000, // 1 minute
  },
}
