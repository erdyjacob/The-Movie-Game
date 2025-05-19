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

// Rank Configuration
export const RANK = {
  THRESHOLDS: {
    SS: 10000,
    "S+": 7500,
    S: 5000,
    "A+": 3000,
    A: 2000,
    "B+": 1500,
    B: 1000,
    "C+": 750,
    C: 500,
    "D+": 300,
    D: 200,
    "F+": 100,
    F: 0,
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
