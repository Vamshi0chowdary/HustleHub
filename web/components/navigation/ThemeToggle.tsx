'use client'

import { Moon, Sun } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme } from '@/hooks/useTheme'

export default function ThemeToggle() {
  const { isDark, mounted, toggleTheme } = useTheme()

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className="theme-animate inline-flex items-center gap-2 rounded-[14px] border border-[var(--glass-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
      aria-label="Toggle color theme"
    >
      {mounted && isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      <span className="hidden sm:inline">{mounted && isDark ? 'Dark' : 'Light'}</span>
    </motion.button>
  )
}
