'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCcw } from 'lucide-react'
import DiscoverPersonCard from '@/components/discover/DiscoverPersonCard'
import { useAuth } from '@/components/providers/AuthProvider'
import { getRecommendedUsers } from '@/lib/api/recommendations'
import type { RecommendedUser } from '@/lib/api/types'

export default function DiscoverPage() {
  const { accessToken } = useAuth()
  const [users, setUsers] = useState<RecommendedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const fetchUsers = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (!accessToken) {
        return
      }

      setError('')
      if (mode === 'initial') {
        setLoading(true)
      } else {
        setRefreshing(true)
      }

      try {
        const response = await getRecommendedUsers(accessToken, 18)
        setUsers(response.users)
      } catch (requestError) {
        const message =
          typeof requestError === 'object' && requestError && 'message' in requestError
            ? String(requestError.message)
            : 'Unable to load discover recommendations.'
        setError(message)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [accessToken]
  )

  useEffect(() => {
    void fetchUsers('initial')
  }, [fetchUsers])

  const highRelevance = useMemo(
    () => users.filter((row) => (row.score ?? row.embedding_similarity ?? 0) >= 0.45),
    [users]
  )
  const growthCandidates = useMemo(
    () => users.filter((row) => row.activity_score >= 40),
    [users]
  )

  return (
    <div className="space-y-8 pb-10">
      <header className="theme-animate hh-surface p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="theme-animate text-xs uppercase tracking-[0.28em] text-[var(--color-text-muted)]">Discover</p>
            <h1 className="theme-animate mt-2 text-3xl font-semibold tracking-[-0.02em] text-[var(--color-text-primary)] sm:text-4xl">
              People like you
            </h1>
            <p className="theme-animate mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base">
              Similar builders from your recommendation graph, ranked by profile affinity.
            </p>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => void fetchUsers('refresh')}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--color-card)] px-3 py-2 text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-70"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </motion.button>
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--color-card)] p-4 text-sm text-[var(--color-text-secondary)]">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-48 animate-pulse rounded-[24px] border border-[var(--glass-border)] bg-[var(--color-card)]" />
          ))}
        </div>
      ) : null}

      {!loading && users.length === 0 ? (
        <div className="rounded-[28px] border border-[var(--glass-border)] bg-[var(--color-card)] p-6 text-center">
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">No discover matches yet</p>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Use refresh to fetch a new user recommendation batch.</p>
        </div>
      ) : null}

      {!loading ? (
        <section>
          <h2 className="theme-animate mb-4 text-lg font-semibold text-[var(--color-text-primary)]">High relevance</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {highRelevance.map((person) => (
              <DiscoverPersonCard key={person.id} person={person} />
            ))}
          </div>
        </section>
      ) : null}

      {!loading ? (
        <section>
          <h2 className="theme-animate mb-4 text-lg font-semibold text-[var(--color-text-primary)]">Active builders</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {growthCandidates.slice(0, 6).map((person) => (
              <DiscoverPersonCard key={`active-${person.id}`} person={person} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
