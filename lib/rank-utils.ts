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

export function getRankBorderColor(rank: string): string {
  // S Tier (Gold/Yellow)
  if (rank.startsWith("S")) return "border-amber-600"

  // A Tier (Green)
  if (rank.startsWith("A")) return "border-green-600"

  // B Tier (Blue)
  if (rank.startsWith("B")) return "border-blue-600"

  // C Tier (Purple)
  if (rank.startsWith("C")) return "border-purple-600"

  // D Tier (Orange)
  if (rank.startsWith("D")) return "border-orange-600"

  // F Tier (Red)
  if (rank.startsWith("F")) return "border-red-600"

  // Default
  return "border-gray-600"
}
