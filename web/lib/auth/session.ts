export const AUTH_STORAGE_KEY = 'hustlehub-auth-v2'

export interface AuthUser {
  id: string
  name: string
  username: string
  email: string
  phone?: string | null
  bio?: string
  skills: string[]
  level: string
  activity_score: number
  followers_count: number
  following_count: number
  created_at?: string
}

export interface AuthSession {
  accessToken: string
  tokenType: string
  user: AuthUser
}

export function normalizeIdentity(value: string): string {
  return value.trim().toLowerCase()
}

export function getStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as AuthSession
    if (!parsed?.accessToken || !parsed?.user?.id) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function setStoredSession(session: AuthSession | null): void {
  if (typeof window === 'undefined') {
    return
  }

  if (!session) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
    return
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}
