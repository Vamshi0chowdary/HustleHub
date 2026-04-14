'use client'

import { Bookmark, CheckCircle2, Clock3, Heart, SkipForward } from 'lucide-react'
import { motion } from 'framer-motion'
import type { FeedbackAction, VideoFeedItem } from '@/lib/api/types'

interface FeedPostCardProps {
  video: VideoFeedItem
  onAction: (videoId: string, action: FeedbackAction) => Promise<void>
  pendingAction?: FeedbackAction | null
}

const ACTION_LABELS: Record<FeedbackAction, string> = {
  watch: 'Watch',
  like: 'Like',
  skip: 'Skip',
  save: 'Save',
  share: 'Share',
}

const ACTION_META = {
  like: { icon: Heart, className: 'text-emerald-300 border-emerald-300/30 bg-emerald-400/10' },
  skip: { icon: SkipForward, className: 'text-zinc-300 border-zinc-300/20 bg-zinc-400/10' },
  save: { icon: Bookmark, className: 'text-cyan-300 border-cyan-300/30 bg-cyan-400/10' },
} as const

function formatRelativeDate(value?: string): string {
  if (!value) {
    return 'Now'
  }

  const current = Date.now()
  const created = new Date(value).getTime()
  const diffHours = Math.max(1, Math.floor((current - created) / 3600000))
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }
  const days = Math.floor(diffHours / 24)
  return `${days}d ago`
}

export default function FeedPostCard({ video, onAction, pendingAction }: FeedPostCardProps) {
  const title = video.title || 'Recommended for you'
  const subtitle = video.category ? video.category.replace('-', ' ') : 'Personalized signal'
  const status = pendingAction ? `Sending ${ACTION_LABELS[pendingAction]}...` : 'Ready'

  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="theme-animate hh-card hh-card-hover group overflow-hidden rounded-[28px]"
    >
      <div className="relative h-[300px] overflow-hidden sm:h-[360px]">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(7,10,16,0.78), rgba(12,32,36,0.72))' }} />
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(26rem 20rem at 85% 12%, rgba(20,184,166,0.25), transparent 70%), radial-gradient(20rem 18rem at 12% 90%, rgba(56,189,248,0.22), transparent 65%)' }} />

        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-white/85 backdrop-blur-md">
          <span>{subtitle}</span>
          {video.difficulty_level ? <span className="text-white/55">{video.difficulty_level}</span> : null}
        </div>

        <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/15 bg-black/20 p-4 backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.22em] text-white/60">Signal score</p>
          <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
          <div className="mt-3 flex items-center gap-3 text-xs text-white/65">
            <span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{formatRelativeDate(video.created_at)}</span>
            <span>{video.duration_seconds ? `${video.duration_seconds}s` : 'Short-form'}</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        <p className="theme-animate text-sm leading-relaxed text-[var(--color-text-secondary)]">{video.caption}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {video.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-full border border-[var(--glass-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {(['like', 'save', 'skip'] as const).map((action) => {
              const meta = ACTION_META[action]
              const Icon = meta.icon
              const isPending = pendingAction === action

              return (
                <motion.button
                  key={action}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onAction(video.id, action)}
                  disabled={Boolean(pendingAction)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${meta.className} ${isPending ? 'opacity-75' : 'hover:brightness-110'} disabled:cursor-not-allowed`}
                >
                  <Icon className="h-4 w-4" />
                  {ACTION_LABELS[action]}
                </motion.button>
              )
            })}
          </div>

          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {status}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-[var(--color-text-secondary)]">
          <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--color-surface)] p-2">
            <p className="font-semibold text-[var(--color-text-primary)]">{video.likes_count}</p>
            <p>Likes</p>
          </div>
          <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--color-surface)] p-2">
            <p className="font-semibold text-[var(--color-text-primary)]">{video.comments_count}</p>
            <p>Comments</p>
          </div>
          <div className="rounded-xl border border-[var(--glass-border)] bg-[var(--color-surface)] p-2">
            <p className="font-semibold text-[var(--color-text-primary)]">{Math.round((video.score ?? 0) * 1000) / 1000}</p>
            <p>Rank</p>
          </div>
        </div>
      </div>
    </motion.article>
  )
}
