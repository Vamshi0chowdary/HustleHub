'use client'

import type { ReactNode } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import AppPageTransition from '@/components/navigation/AppPageTransition'
import GlassNavbar from '@/components/navigation/GlassNavbar'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="hh-shell theme-animate pb-14">
        <GlassNavbar />
        <main className="mx-auto w-full max-w-5xl px-4 pt-28 sm:px-6 md:px-8">
          <AppPageTransition>{children}</AppPageTransition>
        </main>
      </div>
    </ProtectedRoute>
  )
}
