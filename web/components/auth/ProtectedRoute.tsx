'use client'

import { useEffect, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/providers/AuthProvider'
import Logo from '@/components/branding/Logo'

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isHydrated, isAuthenticated } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!isHydrated) {
      return
    }

    if (!isAuthenticated) {
      const params = new URLSearchParams({ next: pathname || '/app/feed' })
      router.replace(`/login?${params.toString()}`)
    }
  }, [isAuthenticated, isHydrated, pathname, router])

  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="hh-shell theme-animate flex min-h-screen items-center justify-center">
        <motion.div
          animate={{ opacity: [0.55, 1, 0.55], scale: [0.98, 1, 0.98] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="theme-animate inline-flex items-center gap-3 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] px-5 py-3 text-sm font-medium text-[var(--color-text-secondary)] shadow-[var(--shadow-elev)] backdrop-blur-md"
        >
          <Logo size="small" showText={false} animated={false} />
          <span>Preparing your workspace...</span>
        </motion.div>
      </div>
    )
  }

  return <>{children}</>
}
