'use client'

import type { ReactNode } from 'react'
import SmoothScrollProvider from '@/components/SmoothScrollProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'

interface AppProvidersProps {
  children: ReactNode
}

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
