import { type InputHTMLAttributes, type ReactNode } from 'react'

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  icon?: ReactNode
}

export default function AuthField({ label, hint, icon, ...props }: AuthFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--color-text-secondary)]">
        {label}
      </span>
      <div className="hh-input flex items-center gap-2 px-4 py-3">
        {icon}
        <input
          {...props}
          className="w-full bg-transparent text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
        />
      </div>
      {hint ? <p className="mt-1 text-xs text-[var(--color-text-muted)]">{hint}</p> : null}
    </label>
  )
}
