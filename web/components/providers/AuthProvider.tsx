'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { loginRequest, signupRequest } from '@/lib/api/auth'
import type { SignupRequest } from '@/lib/api/types'
import {
  getStoredSession,
  setStoredSession,
  type AuthSession,
  type AuthUser,
} from '@/lib/auth/session'

interface LoginResult {
  success: boolean
  error?: string
}

interface SignupResult {
  success: boolean
  error?: string
}

interface AuthContextValue {
  user: AuthUser | null
  accessToken: string | null
  isHydrated: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<LoginResult>
  signup: (payload: SignupRequest) => Promise<SignupResult>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    try {
      const session = getStoredSession()
      if (session) {
        setUser(session.user)
        setAccessToken(session.accessToken)
      }
    } catch {
      setStoredSession(null)
    } finally {
      setIsHydrated(true)
    }
  }, [])

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      if (!email.trim() || !password.trim()) {
        return { success: false, error: 'Please fill in all fields.' }
      }

      try {
        const session = await loginRequest({ email: email.trim().toLowerCase(), password })
        setUser(session.user)
        setAccessToken(session.accessToken)
        setStoredSession(session)
        return { success: true }
      } catch (error) {
        const message =
          typeof error === 'object' && error && 'message' in error
            ? String(error.message)
            : 'Invalid credentials.'
        return { success: false, error: message }
      }
    },
    []
  )

  const signup = useCallback(async (payload: SignupRequest): Promise<SignupResult> => {
    try {
      const session = await signupRequest(payload)
      setUser(session.user)
      setAccessToken(session.accessToken)
      setStoredSession(session)
      return { success: true }
    } catch (error) {
      const message =
        typeof error === 'object' && error && 'message' in error
          ? String(error.message)
          : 'Signup failed.'
      return { success: false, error: message }
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setAccessToken(null)
    setStoredSession(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isHydrated,
      isAuthenticated: Boolean(user),
      login,
      signup,
      logout,
    }),
    [accessToken, isHydrated, login, logout, signup, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
