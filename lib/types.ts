export type ItemType = "movie" | "actor"
export type Difficulty = "easy" | "medium" | "hard"

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
}

export interface GameState {
  status: "start" | "playing" | "gameOver"
  currentItem: GameItem | null
  history: GameItem[]
  usedIds: Set<number>
  score: number
  highScore: number
  difficulty: Difficulty
  filters: GameFilters
  isComputerTurn: boolean
  strikes: number
  // The turn phases now clearly indicate what's expected:
  // player-pick-actor: Player needs to pick an actor from a movie
  // player-pick-movie: Player needs to pick a movie an actor was in
  // computer-pick-actor: Computer picks an actor from a movie
  // computer-pick-movie: Computer picks a movie an actor was in
  turnPhase: "player-pick-actor" | "player-pick-movie" | "computer-pick-actor" | "computer-pick-movie"
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
