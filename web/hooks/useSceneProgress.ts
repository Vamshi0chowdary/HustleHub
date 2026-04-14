'use client'

import { useRef, type RefObject } from 'react'
import {
  useScroll,
  type MotionValue,
  type UseScrollOptions,
} from 'framer-motion'

type SceneOffset = NonNullable<UseScrollOptions['offset']>

interface SceneProgressResult<T extends HTMLElement> {
  targetRef: RefObject<T | null>
  progress: MotionValue<number>
}

export function useSceneProgress<T extends HTMLElement>(
  offset: SceneOffset = ['start start', 'end end']
): SceneProgressResult<T> {
  const targetRef = useRef<T>(null)
  const { scrollYProgress } = useScroll({ target: targetRef, offset })

  return {
    targetRef,
    progress: scrollYProgress,
  }
}
