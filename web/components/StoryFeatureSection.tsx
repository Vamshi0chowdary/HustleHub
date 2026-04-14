'use client'

import { motion, useTransform } from 'framer-motion'
import { useParallax } from '@/hooks/useParallax'
import { useSceneProgress } from '@/hooks/useSceneProgress'

interface StoryFeatureSectionProps {
  id?: string
  index: number
  eyebrow: string
  title: string
  description: string
  bullets: string[]
  accentFrom: string
  accentTo: string
}

export default function StoryFeatureSection({
  id,
  index,
  eyebrow,
  title,
  description,
  bullets,
  accentFrom,
  accentTo,
}: StoryFeatureSectionProps) {
  const { targetRef, progress } = useSceneProgress<HTMLElement>([
    'start start',
    'end end',
  ])

  const textOpacity = useTransform(progress, [0.04, 0.2, 0.62, 0.8], [0, 1, 1, 0])
  const textY = useTransform(progress, [0.05, 0.3, 0.78], [90, 0, -50])

  const visualOpacity = useTransform(progress, [0.25, 0.45, 0.9], [0, 1, 1])
  const visualScale = useTransform(progress, [0.3, 0.6, 1], [0.84, 1, 1.08])
  const visualRotateX = useTransform(progress, [0, 0.5, 1], [18, 0, -8])
  const visualY = useParallax(progress, [130, -70])

  const ambianceY = useParallax(progress, [90, -90])

  return (
    <section id={id} ref={targetRef} className="relative h-[220vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div
          style={{ y: ambianceY }}
          className="pointer-events-none absolute inset-0 opacity-70"
        >
          <div className="absolute left-[6%] top-[18%] h-60 w-60 rounded-full bg-[#58d5ff]/12 blur-3xl" />
          <div className="absolute bottom-[12%] right-[10%] h-64 w-64 rounded-full bg-[#ffc88a]/12 blur-3xl" />
        </motion.div>

        <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl items-center px-6 md:px-12">
          <div className="grid w-full items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
            <motion.div style={{ opacity: textOpacity, y: textY }} className="space-y-6">
              <p className="font-display text-xs uppercase tracking-[0.28em] text-[#96aecf]">
                Scene {index}
              </p>
              <h2 className="font-display text-4xl font-semibold leading-[0.95] text-white md:text-6xl">
                {title}
              </h2>
              <p className="max-w-xl text-base leading-relaxed text-[#abc0dd] md:text-lg">
                {description}
              </p>

              <div className="space-y-3 pt-2">
                {bullets.map((bullet) => (
                  <motion.div
                    key={bullet}
                    whileHover={{ x: 6 }}
                    className="glass-panel flex items-center gap-3 rounded-xl px-4 py-3"
                  >
                    <span className="h-2 w-2 rounded-full bg-[#82f3ce]" />
                    <span className="text-sm text-[#dce9ff]">{bullet}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              style={{
                opacity: visualOpacity,
                scale: visualScale,
                y: visualY,
                rotateX: visualRotateX,
                transformStyle: 'preserve-3d',
              }}
              className="relative"
            >
              <div className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-[#58d5ff]/10 blur-3xl" />
              <div
                className="glass-card glow-border relative overflow-hidden rounded-[2rem] p-8 md:p-10"
                style={{
                  background: `linear-gradient(160deg, ${accentFrom} 0%, ${accentTo} 55%, rgba(8, 14, 25, 0.95) 100%)`,
                }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.32),transparent_40%)] opacity-40" />

                <div className="relative space-y-4">
                  <p className="font-display text-xs uppercase tracking-[0.3em] text-white/70">
                    {eyebrow}
                  </p>

                  <div className="space-y-3">
                    {bullets.map((bullet, bulletIndex) => (
                      <motion.div
                        key={`${bullet}-${bulletIndex}`}
                        whileHover={{ y: -6, scale: 1.01 }}
                        className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 shadow-[0_16px_45px_rgba(1,6,15,0.35)] backdrop-blur-md"
                      >
                        <p className="text-sm text-white/90">{bullet}</p>
                      </motion.div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-white/20 bg-[#061022]/45 px-5 py-4">
                    <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.26em] text-[#a9c1df]">
                      <span>Progress Depth</span>
                      <span>Realtime</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: '24%' }}
                        whileInView={{ width: '86%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full bg-gradient-to-r from-[#58d5ff] via-[#82f3ce] to-[#ffc88a]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
