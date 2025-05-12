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
  // The turn phases now clearly indicate what's expected:
  // player-pick-actor: Player needs to pick an actor from a movie
  // player-pick-movie: Player needs to pick a movie an actor was in
  // computer-pick-actor: Computer picks an actor from a movie
  // computer-pick-movie: Computer picks a movie an actor was in
  turnPhase: "player-pick-actor" | "player-pick-movie" | "computer-pick-actor" | "computer-pick-movie"
  timeRemaining?: number // For timed mode
  // Track newly unlocked items
  newUnlocks: {
    actors: GameItem[]
    movies: GameItem[]
  }
  // Track if daily challenge was completed
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
}
