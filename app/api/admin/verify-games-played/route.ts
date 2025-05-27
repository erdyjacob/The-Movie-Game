import { type NextRequest, NextResponse } from "next/server"
import {
  runGamesPlayedVerification,
  generateDiscrepancyReport,
  repairGamesPlayedDiscrepancies,
} from "@/lib/games-played-verification"

export async function POST(request: NextRequest) {
  try {
    // Check for admin password
    const { password, action } = await request.json()

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    switch (action) {
      case "verify":
        console.log("[ADMIN] Starting games played verification...")
        const verificationResult = await runGamesPlayedVerification()
        return NextResponse.json(verificationResult)

      case "discrepancy_report":
        console.log("[ADMIN] Generating discrepancy report...")
        const discrepancies = await generateDiscrepancyReport()
        return NextResponse.json({ discrepancies })

      case "repair":
        console.log("[ADMIN] Starting repair process...")
        const discrepancyList = await generateDiscrepancyReport()
        const repairResult = await repairGamesPlayedDiscrepancies(discrepancyList)
        return NextResponse.json({
          action: "repair",
          discrepanciesFound: discrepancyList.length,
          ...repairResult,
        })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("[ADMIN] Error in games played verification:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 })
}
