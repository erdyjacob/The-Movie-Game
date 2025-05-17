import { NextResponse } from "next/server"
import { kv } from "@vercel/kv"
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

    // Get all keys in Redis
    const keys = await kv.keys("*")

    // Group keys by prefix
    const keyGroups: Record<string, string[]> = {}
    keys.forEach((key) => {
      const prefix = key.split(":")[0]
      if (!keyGroups[prefix]) {
        keyGroups[prefix] = []
      }
      keyGroups[prefix].push(key)
    })

    // Get sample data for each key type
    const samples: Record<string, any> = {}

    // Sample username data
    if (keyGroups.username && keyGroups.username.length > 0) {
      const sampleUsernameKey = keyGroups.username[0]
      samples.username = {
        key: sampleUsernameKey,
        value: await kv.get(sampleUsernameKey),
      }
    }

    // Sample user data
    if (keyGroups.user && keyGroups.user.length > 0) {
      const sampleUserKey = keyGroups.user[0]
      samples.user = {
        key: sampleUserKey,
        value: await kv.get(sampleUserKey),
      }
    }

    // Get counts
    const counts = {
      total: keys.length,
      byPrefix: Object.fromEntries(Object.entries(keyGroups).map(([prefix, keys]) => [prefix, keys.length])),
    }

    return NextResponse.json({
      diagnostics: {
        keys: {
          counts,
          groups: keyGroups,
        },
        samples,
      },
    })
  } catch (error) {
    console.error("Error in Redis diagnostics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
