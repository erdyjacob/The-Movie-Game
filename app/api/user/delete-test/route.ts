import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"

// Simplified delete account API route for testing
export async function POST(request: Request) {
  try {
    console.log("Delete test API route called")

    // Parse request body
    const { userId, username } = await request.json()
    console.log("Request data:", { userId, username })

    // Validate inputs
    if (!userId || !username) {
      console.log("Missing required fields")
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 })
    }

    // Verify user exists and matches userId
    console.log("Verifying user exists...")
    const storedUserId = await kv.get(`username:${username.toLowerCase()}`)
    console.log("Stored userId:", storedUserId)

    if (!storedUserId) {
      console.log("User not found")
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    if (storedUserId !== userId) {
      console.log("User verification failed - userId mismatch")
      return NextResponse.json({ success: false, message: "User verification failed" }, { status: 403 })
    }

    // Simplified deletion - just remove the username mapping as a test
    console.log("Performing simplified deletion...")
    await kv.del(`username:${username.toLowerCase()}`)

    console.log("Simplified deletion completed successfully")
    return NextResponse.json({
      success: true,
      message: "Test deletion completed successfully",
    })
  } catch (error) {
    console.error("Error in delete-test route:", error)
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred while testing account deletion",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
