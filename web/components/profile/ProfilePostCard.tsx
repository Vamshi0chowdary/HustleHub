import { Trophy } from 'lucide-react'

interface ProfilePostCardProps {
  title: string
  summary: string
  metric: string
}

export default function ProfilePostCard({
  title,
  summary,
  metric,
}: ProfilePostCardProps) {
  return (
    <article className="theme-animate hh-card hh-card-hover rounded-[24px] p-5">
      <div className="flex items-center justify-between">
        <h3 className="theme-animate text-lg font-semibold text-[var(--color-text-primary)]">{title}</h3>
        <span className="theme-animate hh-badge inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs">
          <Trophy className="h-3.5 w-3.5" />
          {metric}
        </span>
      </div>
      <p className="theme-animate mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">{summary}</p>
    </article>
  )
}
