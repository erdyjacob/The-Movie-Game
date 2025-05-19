import type { AccountRank, AccountScore } from "@/lib/types"
import { RANK } from "./config"

// Calculate the rank based on total points
export function calculateRank(totalPoints: number): AccountRank {
  if (totalPoints >= RANK.THRESHOLDS.SS) return "SS"
  if (totalPoints >= RANK.THRESHOLDS["S+"]) return "S+"
  if (totalPoints >= RANK.THRESHOLDS.S) return "S"
  if (totalPoints >= RANK.THRESHOLDS["S-"]) return "S-"
  if (totalPoints >= RANK.THRESHOLDS["A+"]) return "A+"
  if (totalPoints >= RANK.THRESHOLDS.A) return "A"
  if (totalPoints >= RANK.THRESHOLDS["A-"]) return "A-"
  if (totalPoints >= RANK.THRESHOLDS["B+"]) return "B+"
  if (totalPoints >= RANK.THRESHOLDS.B) return "B"
  if (totalPoints >= RANK.THRESHOLDS["B-"]) return "B-"
  if (totalPoints >= RANK.THRESHOLDS["C+"]) return "C+"
  if (totalPoints >= RANK.THRESHOLDS.C) return "C"
  if (totalPoints >= RANK.THRESHOLDS["C-"]) return "C-"
  if (totalPoints >= RANK.THRESHOLDS["D+"]) return "D+"
  if (totalPoints >= RANK.THRESHOLDS.D) return "D"
  if (totalPoints >= RANK.THRESHOLDS["D-"]) return "D-"
  if (totalPoints >= RANK.THRESHOLDS["F+"]) return "F+"
  if (totalPoints >= RANK.THRESHOLDS.F) return "F"
  return "F-"
}

// Helper function to calculate account score
export function calculateAccountScore(
  legendaryCount: number,
  epicCount: number,
  rareCount: number,
  uncommonCount: number,
  commonCount: number,
  dailyChallengesCompleted: number,
  moviesCount: number,
  actorsCount: number,
): AccountScore {
  const rarityPoints = {
    legendary: 100,
    epic: 50,
    rare: 25,
    uncommon: 10,
    common: 1,
  }

  let totalPoints =
    legendaryCount * rarityPoints.legendary +
    epicCount * rarityPoints.epic +
    rareCount * rarityPoints.rare +
    uncommonCount * rarityPoints.uncommon +
    commonCount * rarityPoints.common

  // Add bonus points for daily challenges
  totalPoints += dailyChallengesCompleted * 50

  const rank = calculateRank(totalPoints)

  // Calculate percentages
  const TOTAL_COLLECTIBLE_MOVIES = 10000
  const TOTAL_COLLECTIBLE_ACTORS = 5000

  const moviesPercentage = (moviesCount / TOTAL_COLLECTIBLE_MOVIES) * 100
  const actorsPercentage = (actorsCount / TOTAL_COLLECTIBLE_ACTORS) * 100
  const totalPercentage = ((moviesCount + actorsCount) / (TOTAL_COLLECTIBLE_MOVIES + TOTAL_COLLECTIBLE_ACTORS)) * 100

  return {
    rank,
    points: totalPoints,
    legendaryCount,
    epicCount,
    rareCount,
    uncommonCount,
    commonCount,
    totalItems: moviesCount + actorsCount,
    dailyChallengesCompleted,
    moviesPercentage,
    actorsPercentage,
    totalPercentage,
    moviesCount,
    actorsCount,
  }
}

export function getRankColor(rank: string): string {
  // S Tier (Gold/Yellow)
  if (rank === "SS") return "bg-amber-500 text-white"
  if (rank === "S+") return "bg-amber-400 text-amber-950"
  if (rank === "S") return "bg-amber-300 text-amber-950"
  if (rank === "S-") return "bg-amber-200 text-amber-950"

  // A Tier (Green)
  if (rank === "A+") return "bg-green-500 text-white"
  if (rank === "A") return "bg-green-400 text-green-950"
  if (rank === "A-") return "bg-green-300 text-green-950"

  // B Tier (Blue)
  if (rank === "B+") return "bg-blue-500 text-white"
  if (rank === "B") return "bg-blue-400 text-blue-950"
  if (rank === "B-") return "bg-blue-300 text-blue-950"

  // C Tier (Purple)
  if (rank === "C+") return "bg-purple-500 text-white"
  if (rank === "C") return "bg-purple-400 text-purple-950"
  if (rank === "C-") return "bg-purple-300 text-purple-950"

  // D Tier (Orange)
  if (rank === "D+") return "bg-orange-500 text-white"
  if (rank === "D") return "bg-orange-400 text-orange-950"
  if (rank === "D-") return "bg-orange-300 text-orange-950"

  // F Tier (Red)
  if (rank === "F+") return "bg-red-500 text-white"
  if (rank === "F") return "bg-red-400 text-red-950"
  if (rank === "F-") return "bg-red-300 text-red-950"

  // Default
  return "bg-gray-400 text-gray-950"
}
