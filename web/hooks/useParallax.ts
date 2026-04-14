'use client'

import { useTransform, type MotionValue } from 'framer-motion'

export function useParallax(
  progress: MotionValue<number>,
  range: [number, number]
) {
  return useTransform(progress, [0, 1], range)
}
