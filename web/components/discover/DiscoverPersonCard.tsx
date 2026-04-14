'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import type { RecommendedUser } from '@/lib/api/types'

interface DiscoverPersonCardProps {
  person: RecommendedUser
}

export default function DiscoverPersonCard({ person }: DiscoverPersonCardProps) {
  const relevance = Math.min(99, Math.max(58, Math.round((person.score ?? person.embedding_similarity ?? 0.45) * 100)))

  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="theme-animate hh-card hh-card-hover rounded-[24px] p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="theme-animate text-lg font-semibold text-[var(--color-text-primary)]">{person.name}</p>
          <p className="theme-animate mt-1 text-sm text-[var(--color-text-secondary)]">@{person.username}</p>
        </div>
        <span className="theme-animate hh-badge rounded-full px-3 py-1 text-xs font-medium">
          {relevance}% match
        </span>
      </div>

      <div className="theme-animate mt-4 rounded-2xl border border-[var(--glass-border)] bg-[var(--color-surface)] px-4 py-3">
        <p className="theme-animate text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)]">Current focus</p>
        <p className="theme-animate mt-2 text-sm text-[var(--color-text-secondary)]">
          {person.bio || 'Building consistently and looking for high-signal collaborators.'}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {person.skills.slice(0, 4).map((skill) => (
          <span key={skill} className="rounded-full border border-[var(--glass-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
            {skill}
          </span>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-center text-xs text-[var(--color-text-secondary)]">
        <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--color-surface)] p-2">
          <p className="font-semibold text-[var(--color-text-primary)]">{person.followers_count}</p>
          <p>Followers</p>
        </div>
        <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--color-surface)] p-2">
          <p className="font-semibold text-[var(--color-text-primary)]">{person.activity_score}</p>
          <p>Activity</p>
        </div>
      </div>

      <motion.button
        whileTap={{ scale: 0.95 }}
        className="hh-button-accent mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
      >
        <Sparkles className="h-4 w-4" />
        Connect
        <ArrowUpRight className="h-4 w-4" />
      </motion.button>
    </motion.article>
  )
}
