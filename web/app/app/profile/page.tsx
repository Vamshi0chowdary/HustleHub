'use client'

import { motion } from 'framer-motion'
import ProfilePostCard from '@/components/profile/ProfilePostCard'
import { useAuth } from '@/components/providers/AuthProvider'

const USER_POSTS = [
  {
    title: 'Built recommendation API in FastAPI',
    summary:
      'Shipped hybrid recommendation endpoint combining collaborative and content scores with benchmark traces.',
    metric: '+38% retention',
  },
  {
    title: 'Redesigned onboarding funnel',
    summary:
      'Improved clarity of first three screens and reduced time-to-value using progressive disclosure patterns.',
    metric: '-24% dropoff',
  },
  {
    title: 'Launched web app profile experience',
    summary:
      'Created premium profile with motion, skill tags, and progress insights for clearer personal positioning.',
    metric: 'Top 5% engagement',
  },
]

export default function ProfilePage() {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  const progress = Math.min((user.activity_score / 100) * 100, 100)

  return (
    <div className="space-y-6 pb-10">
      <section className="theme-animate overflow-hidden rounded-[28px] border border-[var(--glass-border)] bg-[var(--color-surface)] shadow-[var(--shadow-elev)]">
        <div className="h-28" style={{ background: 'linear-gradient(135deg, rgba(20,184,166,0.32), rgba(56,189,248,0.24))' }} />

        <div className="px-6 pb-6">
          <div className="-mt-12 flex items-end justify-between gap-4">
            <div className="theme-animate inline-flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-[var(--color-surface)] text-3xl font-semibold text-white" style={{ backgroundImage: 'var(--gradient-accent)', boxShadow: 'var(--shadow-elev)' }}>
              {user.name.charAt(0)}
            </div>
            <span className="theme-animate hh-badge rounded-full px-3 py-1 text-xs font-semibold">
              Level 07
            </span>
          </div>

          <h1 className="theme-animate mt-4 text-3xl font-semibold tracking-[-0.02em] text-[var(--color-text-primary)]">
            {user.name}
          </h1>
          <p className="theme-animate mt-2 text-sm text-[var(--color-text-secondary)]">@{user.username} · {user.level}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            {user.skills.map((skill) => (
              <span
                key={skill}
                className="theme-animate rounded-full border border-[var(--glass-border)] bg-[var(--color-card)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)]"
              >
                {skill}
              </span>
            ))}
          </div>

          <div className="theme-animate mt-6 rounded-2xl border border-[var(--glass-border)] bg-[var(--color-card)] px-4 py-4">
            <div className="theme-animate mb-2 flex items-center justify-between text-xs uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
              <span>Activity Index</span>
              <span>
                {user.activity_score} / 100
              </span>
            </div>
            <div className="theme-animate h-2 rounded-full bg-[var(--color-surface)]">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-full"
                style={{ backgroundImage: 'var(--gradient-accent)' }}
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-center text-xs text-[var(--color-text-secondary)] sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--color-card)] p-3">
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">{user.followers_count}</p>
              <p>Followers</p>
            </div>
            <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--color-card)] p-3">
              <p className="text-lg font-semibold text-[var(--color-text-primary)]">{user.following_count}</p>
              <p>Following</p>
            </div>
            <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--color-card)] p-3 sm:block hidden">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{user.email}</p>
              <p>Email</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="theme-animate text-lg font-semibold text-[var(--color-text-primary)]">Recent posts</h2>
        {USER_POSTS.map((post) => (
          <ProfilePostCard key={post.title} {...post} />
        ))}
      </section>
    </div>
  )
}
