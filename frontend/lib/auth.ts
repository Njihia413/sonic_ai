/**
 * Auth helpers for Argus integration.
 *
 * The Argus token is stored as an httpOnly cookie — set and cleared exclusively
 * through server-side API routes (/api/login, /api/logout). Client JS never
 * reads or writes the token directly.
 */

export async function loginWithArgus(
  username: string,
  password: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    const data = await res.json()

    if (!res.ok || !data.success) {
      return { success: false, message: data.message || 'Login failed' }
    }

    return { success: true }
  } catch {
    return { success: false, message: 'Could not connect. Please try again.' }
  }
}

export async function logout() {
  try {
    await fetch('/api/logout', { method: 'POST' })
  } finally {
    window.location.href = '/'
  }
}
