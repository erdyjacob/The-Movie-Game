import type { LeaderboardEntry, AccountRank, GameMode, Difficulty } from "./types"
import { v4 as uuidv4 } from "uuid"

// Movie-themed usernames
const usernamePool = [
  "MovieBuff",
  "FilmFanatic",
  "CinemaWizard",
  "ReelDeal",
  "ScreenHero",
  "FilmCritic",
  "MovieMaster",
  "CinephileKing",
  "FlickFan",
  "DirectorsCut",
  "SceneSteal",
  "ActionStar",
  "DramaQueen",
  "ComedyKing",
  "ThrillerChaser",
  "SciFiNerd",
  "HorrorBuff",
  "RomComLover",
  "ClassicFilm",
  "BlockbusterFan",
  "OscarWinner",
  "GoldenGlobe",
  "CameraRoll",
  "MovieMarathon",
  "FilmFestival",
  "ScreenWriter",
  "ProducerPro",
  "StarGazer",
  "CastingPro",
  "MovieMagic",
  "FilmScholar",
  "CinematicArt",
  "ReelLife",
  "FrameByFrame",
  "ScriptDoctor",
  "MovieQuoter",
  "FilmHistory",
  "CinemaScope",
  "ReelTime",
  "ScreenLegend",
]

// Generate a random username with a random number
function generateUsername(): string {
  const randomUsername = usernamePool[Math.floor(Math.random() * usernamePool.length)]
  const randomNumber = Math.floor(Math.random() * 100)
  return `${randomUsername}${randomNumber}`
}

// Determine rank based on score
function determineRank(score: number): AccountRank {
  if (score >= 9000) return "SS"
  if (score >= 8500) return "S+"
  if (score >= 8000) return "S"
  if (score >= 7500) return "S-"
  if (score >= 7000) return "A+"
  if (score >= 6500) return "A"
  if (score >= 6000) return "A-"
  if (score >= 5500) return "B+"
  if (score >= 5000) return "B"
  if (score >= 4500) return "B-"
  if (score >= 4000) return "C+"
  if (score >= 3500) return "C"
  if (score >= 3000) return "C-"
  if (score >= 2500) return "D+"
  if (score >= 2000) return "D"
  if (score >= 1500) return "D-"
  if (score >= 1000) return "F+"
  if (score >= 500) return "F"
  return "F-"
}

// Generate a random date within the last 30 days
function generateRandomDate(): string {
  const now = new Date()
  const daysAgo = Math.floor(Math.random() * 30)
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
  return date.toISOString()
}

// Game modes and difficulties
const gameModes: GameMode[] = ["classic", "timed", "dailyChallenge"]
const difficulties: Difficulty[] = ["easy", "medium", "hard"]

export function generateRandomLeaderboardEntries(count: number): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = []

  for (let i = 0; i < count; i++) {
    // Generate a random score between 100 and 10000
    const score = Math.floor(Math.random() * 9900) + 100
    const rank = determineRank(score)

    // Generate random counts for rare items
    const legendaryCount = Math.floor(Math.random() * 5)
    const epicCount = Math.floor(Math.random() * 10)
    const rareCount = Math.floor(Math.random() * 20)
    const uncommonCount = Math.floor(Math.random() * 30)
    const commonCount = Math.floor(Math.random() * 50)

    // Generate a random game mode and difficulty
    const gameMode = gameModes[Math.floor(Math.random() * gameModes.length)]
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)]

    entries.push({
      id: uuidv4(),
      playerName: generateUsername(),
      score,
      rank,
      legendaryCount,
      epicCount,
      rareCount,
      uncommonCount,
      commonCount,
      timestamp: generateRandomDate(),
      gameMode,
      difficulty,
    })
  }

  // Sort by score in descending order
  return entries.sort((a, b) => b.score - a.score)
}
