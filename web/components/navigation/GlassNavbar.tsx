'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Compass, LogOut, Newspaper, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/providers/AuthProvider'
import ThemeToggle from '@/components/navigation/ThemeToggle'
import Logo from '@/components/branding/Logo'

const NAV_ITEMS = [
  { href: '/app/feed', label: 'Feed', icon: Newspaper },
  { href: '/app/discover', label: 'Discover', icon: Compass },
  { href: '/app/profile', label: 'Profile', icon: User },
] as const

export default function GlassNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.replace('/login')
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-4 md:pt-6">
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="theme-animate pointer-events-auto flex w-full max-w-5xl items-center justify-between gap-3 rounded-[24px] border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 py-2 shadow-[var(--shadow-elev)] backdrop-blur-2xl"
      >
        <div className="theme-animate hidden items-center gap-3 rounded-2xl border border-[var(--glass-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text-secondary)] sm:flex">
          <Logo size="small" showText className="mr-1" textClassName="leading-none" />
          <div>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{user?.name ?? 'Workspace'}</p>
          </div>
        </div>

        <div className="theme-animate relative flex items-center gap-1 rounded-2xl border border-[var(--glass-border)] bg-[var(--color-card)] p-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative"
              >
                <motion.span
                  whileTap={{ scale: 0.95 }}
                  className={`theme-animate relative z-10 flex items-center gap-2 rounded-xl px-3 py-2 text-sm md:px-4 ${
                    isActive
                      ? 'text-[var(--color-text-primary)]'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </motion.span>

                {isActive ? (
                  <motion.span
                    layoutId="active-nav-pill"
                    className="absolute inset-0 rounded-xl border border-[var(--glass-border)]"
                    style={{
                      background: 'var(--color-surface)',
                    }}
                    transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                  />
                ) : null}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="theme-animate inline-flex items-center gap-2 rounded-xl border border-[var(--glass-border)] bg-[var(--color-card)] px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </motion.button>
        </div>
      </motion.nav>
    </div>
  )
}
