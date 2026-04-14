'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCcw } from 'lucide-react'
import FeedPostCard from '@/components/feed/FeedPostCard'
import { useAuth } from '@/components/providers/AuthProvider'
import {
  getRecommendedFeed,
  sendRecommendationFeedback,
} from '@/lib/api/recommendations'
import type { FeedbackAction, VideoFeedItem } from '@/lib/api/types'

const WATCH_RATIO_BY_ACTION: Record<FeedbackAction, number> = {
  watch: 0.62,
  like: 0.9,
  save: 0.86,
  skip: 0.2,
  share: 0.88,
}

function nextQueue(current: VideoFeedItem[], consumedId: string): VideoFeedItem[] {
  return current.filter((item) => item.id !== consumedId)
}

export default function FeedPage() {
  const { accessToken } = useAuth()
  const [videos, setVideos] = useState<VideoFeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [pendingByVideo, setPendingByVideo] = useState<Record<string, FeedbackAction | null>>({})

  const fetchFeed = useCallback(
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
        const data = await getRecommendedFeed(accessToken, 20)
        setVideos(data.videos)
      } catch (requestError) {
        const message =
          typeof requestError === 'object' && requestError && 'message' in requestError
            ? String(requestError.message)
            : 'Unable to load recommendations right now.'
        setError(message)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [accessToken]
  )

  useEffect(() => {
    void fetchFeed('initial')
  }, [fetchFeed])

  const handleAction = useCallback(
    async (videoId: string, action: FeedbackAction) => {
      if (!accessToken) {
        return
      }

      const snapshot = videos
      setPendingByVideo((prev) => ({ ...prev, [videoId]: action }))
      setVideos((current) => nextQueue(current, videoId))

      try {
        await sendRecommendationFeedback(accessToken, {
          video_id: videoId,
          action,
          watch_time_ratio: WATCH_RATIO_BY_ACTION[action],
          session_time: 32,
        })

        if (videos.length <= 6) {
          void fetchFeed('refresh')
        }
      } catch (requestError) {
        const message =
          typeof requestError === 'object' && requestError && 'message' in requestError
            ? String(requestError.message)
            : 'Could not submit feedback. Restoring card.'
        setError(message)
        setVideos(snapshot)
      } finally {
        setPendingByVideo((prev) => ({ ...prev, [videoId]: null }))
      }
    },
    [accessToken, fetchFeed, videos]
  )

  const statusPill = useMemo(() => {
    if (refreshing) {
      return 'Syncing'
    }
    if (videos.length > 0) {
      return `${videos.length} live cards`
    }
    return 'Empty queue'
  }, [refreshing, videos.length])

  return (
    <div className="space-y-6 pb-10">
      <header className="theme-animate hh-surface p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="theme-animate text-xs uppercase tracking-[0.28em] text-[var(--color-text-muted)]">Feed</p>
            <h1 className="theme-animate mt-2 text-3xl font-semibold tracking-[-0.02em] text-[var(--color-text-primary)] sm:text-4xl">
              Your momentum stream
            </h1>
            <p className="theme-animate mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base">
              Fresh recommendations from your model profile, optimized continuously by your feedback.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[var(--glass-border)] bg-[var(--color-card)] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
              {statusPill}
            </span>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => void fetchFeed('refresh')}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--color-card)] px-3 py-2 text-xs font-medium uppercase tracking-[0.16em] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-70"
            >
              <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </motion.button>
          </div>
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--color-card)] p-4 text-sm text-[var(--color-text-secondary)]">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-[28px] border border-[var(--glass-border)] bg-[var(--color-card)]" />
          ))}
        </div>
      ) : null}

      {!loading && videos.length === 0 ? (
        <div className="rounded-[28px] border border-[var(--glass-border)] bg-[var(--color-card)] p-6 text-center">
          <p className="text-lg font-semibold text-[var(--color-text-primary)]">No recommendations yet</p>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Trigger refresh to request a new ranked batch from the backend.</p>
          <button
            onClick={() => void fetchFeed('refresh')}
            className="hh-button-accent mt-4 rounded-xl px-4 py-2 text-sm font-semibold"
          >
            Retry feed
          </button>
        </div>
      ) : null}

      <div className="space-y-6">
        {videos.map((video) => (
          <FeedPostCard
            key={video.id}
            video={video}
            pendingAction={pendingByVideo[video.id]}
            onAction={handleAction}
          />
        ))}
      </div>
    </div>
  )
}
