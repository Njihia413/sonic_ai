import { NextRequest, NextResponse } from 'next/server'

const ARGUS_URL = process.env.ARGUS_URL

export async function POST(req: NextRequest) {
  if (!ARGUS_URL) {
    return NextResponse.json(
      { success: false, message: 'Auth service is not configured' },
      { status: 503 }
    )
  }

  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      )
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    let argusRes: Response
    try {
      argusRes = await fetch(`${ARGUS_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeout)
    }

    const data = await argusRes.json()

    if (!argusRes.ok) {
      // Pass through the actual status from Argus rather than hardcoding 401
      return NextResponse.json(
        { success: false, message: data.message || data.error || 'Invalid credentials' },
        { status: argusRes.status }
      )
    }

    const token = data.auth_token || data.token
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'No token returned from auth service' },
        { status: 502 }
      )
    }

    const response = NextResponse.json({ success: true })

    // Set token as httpOnly cookie — JS cannot read this
    response.cookies.set('argus_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hours
    })

    return response
  } catch {
    return NextResponse.json(
      { success: false, message: 'Could not connect to auth service' },
      { status: 502 }
    )
  }
}
