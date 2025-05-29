import { NextResponse } from "next/server"
import { getUserAnalytics } from "@/lib/user-analytics-calculator"
import { getAuthToken } from "@/lib/admin-utils"

export async function GET(request: Request) {
  try {
    // Check for admin authorization
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const isAuthorized = (await getAuthToken()) === token

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get userId from query params
    const url = new URL(request.url)
    const userId = url.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 })
    }

    // Get user analytics
    const analytics = await getUserAnalytics(userId)

    if (!analytics) {
      return NextResponse.json({ error: "Failed to retrieve user analytics" }, { status: 500 })
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Error in user analytics API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
