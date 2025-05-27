// Don't import d3 types directly, just declare them
export type ItemType = "movie" | "actor"
export type Difficulty = "easy" | "medium" | "hard"
export type GameMode = "classic" | "timed" | "dailyChallenge"
export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary"
export type AccountRank =
  | "SS"
  | "S+"
  | "S"
  | "S-"
  | "A+"
  | "A"
  | "A-"
  | "B+"
  | "B"
  | "B-"
  | "C+"
  | "C"
  | "C-"
  | "D+"
  | "D"
  | "D-"
  | "F+"
  | "F"
  | "F-"

export interface GameFilters {
  includeAnimated: boolean
  includeSequels: boolean
  includeForeign: boolean
}

export interface GameItem {
  id: number
  name: string
  image: string | null
  type: ItemType
  details: any
  // Track who made this selection (player or computer)
  selectedBy?: "player" | "computer"
  // Track if this was newly unlocked in this game
  isNewUnlock?: boolean
  // Item rarity
  rarity?: Rarity
  // Is this a daily challenge item
  isDailyChallenge?: boolean
}

export interface PlayerHistoryItem {
  id: number
  name: string
  date: string
  count: number
  image: string | null
  rarity?: Rarity
}

export interface PlayerHistory {
  movies: PlayerHistoryItem[]
  actors: PlayerHistoryItem[]
}

export interface GameState {
  status: "start" | "playing" | "gameOver"
  currentItem: GameItem | null
  history: GameItem[]
  usedIds: Set<number>
  score: number
  highScore: number
  difficulty: Difficulty
  gameMode: GameMode
  filters: GameFilters
  isComputerTurn: boolean
  strikes: number
  turnPhase: "player-pick-actor" | "player-pick-movie" | "computer-pick-actor" | "computer-pick-movie"
  timeRemaining?: number // For timed mode
  turnsRemaining?: number // For daily challenge mode
  maxTurns?: number // Maximum turns allowed (for daily challenge)
  newUnlocks: {
    actors: GameItem[]
    movies: GameItem[]
  }
  dailyChallengeCompleted?: boolean
}

export interface TMDBMovie {
  id: number
  title: string
  poster_path: string | null
  release_date: string
  overview: string
  vote_count?: number
  popularity?: number
  genre_ids?: number[]
  belongs_to_collection?: any
  original_language?: string
  [key: string]: any
}

export interface TMDBActor {
  id: number
  name: string
  profile_path: string | null
  character?: string
  popularity?: number
  [key: string]: any
}

export interface AccountScore {
  rank: AccountRank
  points: number
  legendaryCount: number
  epicCount: number
  rareCount: number
  uncommonCount: number
  commonCount: number
  totalItems: number
  dailyChallengesCompleted: number
  // Add these new properties
  moviesPercentage?: number
  actorsPercentage?: number
  totalPercentage?: number
  moviesCount?: number
  actorsCount?: number
}

export interface Connection {
  movieId: number
  actorId: number
  movieName: string
  actorName: string
  timestamp: string // ISO string
  gameId?: string // Optional game session identifier
  source?: "explicit" | "inferred" | "manual"
}

// New leaderboard types
export interface LeaderboardEntry {
  id: string
  userId?: string // Add this line to store the user ID
  playerName: string
  score: number
  rank: AccountRank
  legendaryCount: number
  epicCount: number
  rareCount: number
  uncommonCount: number
  commonCount: number
  gamesPlayed: number // Add games played count
  timestamp: string
  avatarUrl?: string
  gameMode: GameMode
  difficulty: Difficulty
}

// Define the Node interface for the visualization
export interface Node {
  id: string
  name: string
  type: "movie" | "actor"
  image: string | null
  rarity?: string
  count: number
  // d3 specific properties
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
  index?: number
  vx?: number
  vy?: number
}

// Define the GraphLink interface for the visualization
export interface GraphLink {
  source: string | Node
  target: string | Node
  value: number
  source_type?: "explicit" | "inferred" | "manual"
}

export interface Achievement {
  id: string
  name: string
  description: string
  category: "milestone" | "collection" | "skill" | "discovery"
  requirement: number
  progress: number
  unlocked: boolean
  unlockedAt?: string
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary"
}
