'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Lock, UserCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/components/providers/AuthProvider'
import AuthShell from '@/components/auth/AuthShell'
import AuthField from '@/components/auth/AuthField'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, isAuthenticated, isHydrated } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isVisible, setIsVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const nextPath = useMemo(() => {
    const next = searchParams.get('next')
    if (!next || !next.startsWith('/app')) {
      return '/app/feed'
    }
    return next
  }, [searchParams])

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace(nextPath)
    }
  }, [isAuthenticated, isHydrated, nextPath, router])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    const result = await login(email, password)

    if (result.success) {
      router.replace(nextPath)
      return
    }

    setError(result.error ?? 'Login failed.')
    setIsSubmitting(false)
  }

  return (
    <AuthShell
      title="Welcome Back"
      subtitle="Enter your credentials to unlock your personalized momentum feed."
      kicker="Secure Access"
      alternateCtaHref="/signup"
      alternateCtaLabel="Create account"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          label="Email"
          icon={<UserCircle2 className="h-4 w-4 text-[var(--color-text-muted)]" />}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@company.com"
          autoComplete="email"
          type="email"
          required
        />

        <div>
          <AuthField
            label="Password"
            icon={<Lock className="h-4 w-4 text-[var(--color-text-muted)]" />}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type={isVisible ? 'text' : 'password'}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setIsVisible((prev) => !prev)}
            className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            aria-label={isVisible ? 'Hide password' : 'Show password'}
          >
            {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {isVisible ? 'Hide password' : 'Show password'}
          </button>
        </div>

        {error ? (
          <p className="rounded-xl border border-[var(--glass-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text-secondary)]">
            {error}
          </p>
        ) : null}

        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={isSubmitting}
          type="submit"
          className="hh-button-accent w-full rounded-2xl px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Signing in...' : 'Login'}
        </motion.button>
      </form>

      <p className="mt-4 text-xs text-[var(--color-text-muted)]">
        Need an account first?{' '}
        <Link href="/signup" className="font-semibold text-[var(--color-accent)]">
          Signup in under a minute
        </Link>
        .
      </p>
    </AuthShell>
  )
}
