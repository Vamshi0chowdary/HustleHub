'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import ThemeToggle from '@/components/navigation/ThemeToggle'
import Logo from '@/components/branding/Logo'
import type { ReactNode } from 'react'

interface AuthShellProps {
  title: string
  subtitle: string
  kicker: string
  alternateCtaLabel: string
  alternateCtaHref: string
  children: ReactNode
}

export default function AuthShell({
  title,
  subtitle,
  kicker,
  alternateCtaLabel,
  alternateCtaHref,
  children,
}: AuthShellProps) {
  return (
    <div className="hh-shell theme-animate relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-80" style={{ backgroundImage: 'radial-gradient(48rem 32rem at 12% -2%, rgba(20,184,166,0.16), transparent 62%), radial-gradient(40rem 26rem at 92% -8%, rgba(56,189,248,0.11), transparent 58%)' }} />
      <motion.div
        aria-hidden
        animate={{ y: [0, -14, 0], x: [0, 6, 0] }}
        transition={{ duration: 7.2, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute left-[10%] top-[18%] h-52 w-52 rounded-full bg-[rgba(20,184,166,0.12)] blur-3xl"
      />
      <motion.div
        aria-hidden
        animate={{ y: [0, 18, 0], x: [0, -8, 0] }}
        transition={{ duration: 8.8, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute right-[8%] top-[20%] h-56 w-56 rounded-full bg-[rgba(56,189,248,0.12)] blur-3xl"
      />

      <motion.section
        initial={{ opacity: 0, scale: 0.97, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
        className="theme-animate relative z-10 w-full max-w-lg overflow-hidden rounded-[32px] border border-[var(--glass-border)] bg-[var(--glass-bg)] p-7 shadow-[var(--shadow-elev)] backdrop-blur-3xl sm:p-8"
      >
        <header className="mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-3"
          >
            <Logo size="medium" showText={false} />
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--color-text-muted)]">{kicker}</p>
          </motion.div>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-[var(--color-text-primary)] sm:text-[2rem]">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">{subtitle}</p>
        </header>

        {children}

        <footer className="mt-6 flex items-center justify-between rounded-2xl border border-[var(--glass-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
          <span>Need another route?</span>
          <Link className="font-semibold text-[var(--color-accent)] hover:opacity-90" href={alternateCtaHref}>
            {alternateCtaLabel}
          </Link>
        </footer>
      </motion.section>
    </div>
  )
}
