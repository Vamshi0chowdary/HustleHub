'use client'

import { useThemeContext } from '@/components/providers/ThemeProvider'

export function useTheme() {
  return useThemeContext()
}
