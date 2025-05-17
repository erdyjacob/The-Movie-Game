import { kv } from "@vercel/kv"
import { type NextRequest, NextResponse } from "next/server"

const USERS_KEY = "movie-game:users"
const USERNAMES_KEY = "movie-game:usernames"

export async function POST(request: NextRequest) {
  try {
    // Check admin password
    const { password } = await request.json()
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ message: "Invalid admin password" }, { status: 401 })
    }

    // Get all user keys
    const userKeys = await kv.keys("user:*")
    const usernameKeys = await kv.keys("username:*")

    console.log(`Found ${userKeys.length} user keys and ${usernameKeys.length} username keys`)

    // Prepare for migration
    const pipeline = kv.pipeline()
    let migratedCount = 0
    const errors = []

    // Process each user key
    for (const userKey of userKeys) {
      try {
        const userId = userKey.replace("user:", "")
        const userData = await kv.get(userKey)

        if (userData && userData.username) {
          const username = userData.username
          const lowercaseUsername = username.toLowerCase()

          // Add to the users hash
          pipeline.hset(USERS_KEY, { [userId]: username })

          // Add to the usernames set
          pipeline.sadd(USERNAMES_KEY, lowercaseUsername)

          migratedCount++
        }
      } catch (err) {
        errors.push(`Error processing ${userKey}: ${err.message}`)
      }
    }

    // Execute all commands
    await pipeline.exec()

    return NextResponse.json({
      success: true,
      message: `Migration completed. Migrated ${migratedCount} users.`,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error("Error migrating users:", error)
    return NextResponse.json(
      {
        success: false,
        message: "An error occurred during migration",
        error: error.message,
      },
      { status: 500 },
    )
  }
}
