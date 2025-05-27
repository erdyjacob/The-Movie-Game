import { type NextRequest, NextResponse } from "next/server"
import { generateAnalyticsDashboardData, type AnalyticsFilters } from "@/lib/analytics"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password, filters } = body

    // Verify admin password
    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    console.log("[ANALYTICS_API] Generating dashboard data with filters:", filters)

    // Parse filters
    const analyticsFilters: AnalyticsFilters = {}

    if (filters?.startDate) {
      analyticsFilters.startDate = new Date(filters.startDate).getTime()
    }

    if (filters?.endDate) {
      analyticsFilters.endDate = new Date(filters.endDate).getTime()
    }

    if (filters?.playerIds && Array.isArray(filters.playerIds) && filters.playerIds.length > 0) {
      analyticsFilters.playerIds = filters.playerIds
    }

    if (filters?.gameMode) {
      analyticsFilters.gameMode = filters.gameMode
    }

    if (filters?.difficulty) {
      analyticsFilters.difficulty = filters.difficulty
    }

    // Generate analytics data
    const dashboardData = await generateAnalyticsDashboardData(analyticsFilters)

    console.log("[ANALYTICS_API] Dashboard data generated successfully")

    return NextResponse.json({
      success: true,
      data: dashboardData,
    })
  } catch (error) {
    console.error("[ANALYTICS_API] Error generating analytics:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate analytics data",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: "Use POST method with admin password" }, { status: 405 })
}
