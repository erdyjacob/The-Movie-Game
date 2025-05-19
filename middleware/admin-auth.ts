import { type NextRequest, NextResponse } from "next/server"
import { SECURITY } from "@/lib/config"

// Store timestamps for rate limiting
const requestTimestamps: { [ip: string]: number[] } = {}

// Store login attempts in memory (in a real app, this would be in Redis or similar)
const loginAttempts: Record<string, { count: number; lastAttempt: number }> = {}

// Middleware to authenticate admin requests
export async function adminAuth(request: NextRequest, password?: string) {
  try {
    // Get the client IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown"

    // Apply rate limiting
    if (!applyRateLimit(ip)) {
      console.error(`Rate limit exceeded for IP: ${ip}`)
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    // Check if password is provided directly
    let adminPassword = password

    // If not, try to get it from the request body
    if (!adminPassword) {
      try {
        const body = await request.json()
        adminPassword = body.password
      } catch (error) {
        console.error("Error parsing request body:", error)
        return NextResponse.json({ error: "Invalid request" }, { status: 400 })
      }
    }

    // Validate the admin password
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      console.error("Invalid admin password")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Authentication successful
    return null
  } catch (error) {
    console.error("Error in admin authentication:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Apply rate limiting
function applyRateLimit(ip: string): boolean {
  const now = Date.now()

  // Initialize timestamps array for this IP if it doesn't exist
  if (!requestTimestamps[ip]) {
    requestTimestamps[ip] = []
  }

  // Remove timestamps outside the window
  requestTimestamps[ip] = requestTimestamps[ip].filter(
    (timestamp) => now - timestamp < SECURITY.ADMIN_RATE_LIMIT.WINDOW_MS,
  )

  // Check if the IP has exceeded the rate limit
  if (requestTimestamps[ip].length >= SECURITY.ADMIN_RATE_LIMIT.MAX_REQUESTS) {
    return false
  }

  // Add the current timestamp
  requestTimestamps[ip].push(now)

  // Clean up old IPs periodically
  if (Math.random() < 0.01) {
    // 1% chance to clean up on each request
    cleanupOldIPs()
  }

  return true
}

// Clean up old IPs from the rate limiting store
function cleanupOldIPs(): void {
  const now = Date.now()

  for (const ip in requestTimestamps) {
    // If the IP has no recent requests, remove it
    if (
      requestTimestamps[ip].length === 0 ||
      now - Math.max(...requestTimestamps[ip]) > SECURITY.ADMIN_RATE_LIMIT.WINDOW_MS * 2
    ) {
      delete requestTimestamps[ip]
    }
  }
}

/**
 * Middleware to protect admin routes
 */
export function adminAuthMiddleware(request: NextRequest) {
  const ip = request.ip || "unknown"

  // Check if the IP is locked out
  if (
    loginAttempts[ip] &&
    loginAttempts[ip].count >= SECURITY.RATE_LIMIT.MAX_REQUESTS &&
    Date.now() - loginAttempts[ip].lastAttempt < SECURITY.RATE_LIMIT.WINDOW_MS
  ) {
    return NextResponse.json({ error: "Too many failed attempts. Please try again later." }, { status: 429 })
  }

  // Continue to the route handler
  return NextResponse.next()
}

/**
 * Validate admin credentials
 */
export function validateAdminCredentials(password: string): boolean {
  return password === process.env.ADMIN_PASSWORD
}

/**
 * Record a failed login attempt
 */
export function recordFailedLoginAttempt(ip: string): void {
  if (!loginAttempts[ip]) {
    loginAttempts[ip] = { count: 0, lastAttempt: Date.now() }
  }

  loginAttempts[ip].count += 1
  loginAttempts[ip].lastAttempt = Date.now()
}

/**
 * Reset login attempts for an IP
 */
export function resetLoginAttempts(ip: string): void {
  if (loginAttempts[ip]) {
    delete loginAttempts[ip]
  }
}

export function isAdmin(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false
  }

  const token = authHeader.split(" ")[1]
  return token === process.env.ADMIN_PASSWORD
}
