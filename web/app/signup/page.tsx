'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { AtSign, Lock, Sparkles, UserCircle2 } from 'lucide-react'
import AuthField from '@/components/auth/AuthField'
import AuthShell from '@/components/auth/AuthShell'
import { useAuth } from '@/components/providers/AuthProvider'

const DEFAULT_SKILLS = ['react', 'javascript', 'backend', 'ui']

export default function SignupPage() {
  const router = useRouter()
  const { signup, isAuthenticated, isHydrated } = useAuth()

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [bio, setBio] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isHydrated && isAuthenticated) {
      router.replace('/app/feed')
    }
  }, [isAuthenticated, isHydrated, router])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    const result = await signup({
      name,
      username,
      email,
      password,
      bio,
      skills: DEFAULT_SKILLS,
      level: 'intermediate',
    })

    if (result.success) {
      router.replace('/app/feed')
      return
    }

    setError(result.error ?? 'Unable to create account.')
    setIsSubmitting(false)
  }

  return (
    <AuthShell
      title="Create Your HustleHub"
      subtitle="Set up your account and start receiving intelligent recommendations tuned to your craft."
      kicker="New Account"
      alternateCtaHref="/login"
      alternateCtaLabel="Back to login"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <AuthField
          label="Full Name"
          icon={<UserCircle2 className="h-4 w-4 text-[var(--color-text-muted)]" />}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your full name"
          autoComplete="name"
          required
        />

        <AuthField
          label="Username"
          icon={<AtSign className="h-4 w-4 text-[var(--color-text-muted)]" />}
          value={username}
          onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/\s+/g, '_'))}
          placeholder="lowercase_with_underscore"
          autoComplete="username"
          required
        />

        <AuthField
          label="Email"
          icon={<AtSign className="h-4 w-4 text-[var(--color-text-muted)]" />}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@company.com"
          autoComplete="email"
          type="email"
          required
        />

        <AuthField
          label="Password"
          icon={<Lock className="h-4 w-4 text-[var(--color-text-muted)]" />}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          type="password"
          required
          minLength={8}
        />

        <AuthField
          label="Bio"
          icon={<Sparkles className="h-4 w-4 text-[var(--color-text-muted)]" />}
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          placeholder="What are you building right now?"
          autoComplete="off"
        />

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
          {isSubmitting ? 'Creating account...' : 'Signup'}
        </motion.button>
      </form>

      <p className="mt-4 text-xs text-[var(--color-text-muted)]">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-[var(--color-accent)]">
          Login now
        </Link>
        .
      </p>
    </AuthShell>
  )
}
