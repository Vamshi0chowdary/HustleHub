'use client'

import { type MouseEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { motion, useMotionValue, useSpring } from 'framer-motion'

interface MagneticButtonProps {
  href: string
  children: ReactNode
  className?: string
}

export default function MagneticButton({
  href,
  children,
  className = '',
}: MagneticButtonProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springX = useSpring(x, { stiffness: 170, damping: 14, mass: 0.25 })
  const springY = useSpring(y, { stiffness: 170, damping: 14, mass: 0.25 })

  const onMove = (event: MouseEvent<HTMLAnchorElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    const offsetX = event.clientX - bounds.left - bounds.width / 2
    const offsetY = event.clientY - bounds.top - bounds.height / 2

    x.set(offsetX * 0.22)
    y.set(offsetY * 0.22)
  }

  const onLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      style={{ x: springX, y: springY }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 240, damping: 18 }}
      className="inline-flex"
    >
      <Link
        href={href}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className={`group relative inline-flex items-center justify-center overflow-hidden rounded-full border border-white/20 px-7 py-3 text-sm font-semibold text-white transition-colors duration-500 ${className}`}
      >
        <span className="absolute inset-0 bg-gradient-to-r from-[#58d5ff] via-[#82f3ce] to-[#ffc88a] opacity-85 transition-opacity duration-500 group-hover:opacity-100" />
        <span className="absolute inset-[1px] rounded-full bg-[#071021]/85 backdrop-blur-md" />
        <span className="relative z-10">{children}</span>
      </Link>
    </motion.div>
  )
}
