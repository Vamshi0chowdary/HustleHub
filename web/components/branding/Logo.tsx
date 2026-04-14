'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

type LogoSize = 'small' | 'medium' | 'large'

interface LogoProps {
  size?: LogoSize
  showText?: boolean
  animated?: boolean
  className?: string
  textClassName?: string
}

const ICON_SIZE: Record<LogoSize, number> = {
  small: 28,
  medium: 40,
  large: 64,
}

const TEXT_SIZE: Record<LogoSize, string> = {
  small: 'text-base',
  medium: 'text-xl',
  large: 'text-3xl',
}

export default function Logo({
  size = 'medium',
  showText = true,
  animated = true,
  className = '',
  textClassName = '',
}: LogoProps) {
  const iconSize = ICON_SIZE[size]

  const content = (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <span
        className="hh-logo-badge inline-flex items-center justify-center overflow-hidden rounded-2xl border border-[var(--glass-border)] bg-[var(--color-surface)]"
        style={{ width: iconSize, height: iconSize }}
      >
        <Image
          src="/logo.png"
          alt="HustleHub logo"
          width={iconSize}
          height={iconSize}
          priority={size === 'large'}
          className="h-full w-full object-contain"
        />
      </span>

      {showText ? (
        <span
          className={`font-display ${TEXT_SIZE[size]} font-semibold tracking-[-0.02em] text-[var(--color-text-primary)] ${textClassName}`}
        >
          HustleHub
        </span>
      ) : null}
    </div>
  )

  if (!animated) {
    return content
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.05 }}
      className="inline-flex"
    >
      {content}
    </motion.div>
  )
}
