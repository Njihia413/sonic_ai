import { NextRequest, NextResponse } from 'next/server'

const ARGUS_URL = process.env.ARGUS_URL
const SONIC_APP_KEY = process.env.SONIC_APP_KEY

export async function POST(req: NextRequest) {
  if (!ARGUS_URL) {
    return NextResponse.json(
      { allowed: false, message: 'Auth service is not configured' },
      { status: 503 }
    )
  }

  if (!SONIC_APP_KEY) {
    return NextResponse.json(
      { allowed: false, message: 'Sonic AI is not registered with Argus yet' },
      { status: 503 }
    )
  }

  // Read the httpOnly cookie — never exposed to client JS
  const token = req.cookies.get('argus_token')?.value
  if (!token) {
    return NextResponse.json({ allowed: false, message: 'Not authenticated' }, { status: 401 })
  }

  try {
    // Forward the real client IP so Argus zone enforcement sees the user's IP
    const clientIp =
      req.headers.get('x-forwarded-for') ||
      req.headers.get('x-real-ip') ||
      ''

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    let res: Response
    try {
      res = await fetch(`${ARGUS_URL}/api/app-auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': clientIp,
        },
        body: JSON.stringify({
          api_key: SONIC_APP_KEY,
          user_token: token,
        }),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeout)
    }

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json(
      { allowed: false, message: 'Could not reach auth service. Please try again.' },
      { status: 502 }
    )
  }
}
