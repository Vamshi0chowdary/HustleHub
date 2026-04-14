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

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  isDark: boolean
  mounted: boolean
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const THEME_STORAGE_KEY = 'hustlehub-theme'

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.dataset.theme = theme
}

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    const hasStoredTheme = storedTheme === 'light' || storedTheme === 'dark'
    const initialTheme = hasStoredTheme ? (storedTheme as Theme) : getSystemTheme()

    setThemeState(initialTheme)
    applyTheme(initialTheme)
    document.documentElement.classList.add('theme-ready')
    setMounted(true)

    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const handleSystemTheme = (event: MediaQueryListEvent) => {
      const hasManualPreference = window.localStorage.getItem(THEME_STORAGE_KEY)
      if (hasManualPreference) {
        return
      }

      const nextTheme: Theme = event.matches ? 'dark' : 'light'
      setThemeState(nextTheme)
      applyTheme(nextTheme)
    }

    media.addEventListener('change', handleSystemTheme)

    return () => {
      media.removeEventListener('change', handleSystemTheme)
    }
  }, [])

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme)
    applyTheme(nextTheme)
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [setTheme, theme])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDark: theme === 'dark',
      mounted,
      setTheme,
      toggleTheme,
    }),
    [mounted, setTheme, theme, toggleTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useThemeContext() {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }

  return context
}
