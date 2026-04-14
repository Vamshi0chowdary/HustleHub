'use client'

import { motion, useTransform } from 'framer-motion'
import MagneticButton from '@/components/MagneticButton'
import { useParallax } from '@/hooks/useParallax'
import { useSceneProgress } from '@/hooks/useSceneProgress'

export default function AppPreviewScene() {
  const { targetRef, progress } = useSceneProgress<HTMLElement>([
    'start start',
    'end end',
  ])

  const textOpacity = useTransform(progress, [0.05, 0.2, 0.75, 0.95], [0, 1, 1, 0])
  const textY = useTransform(progress, [0.05, 0.4, 0.92], [70, 0, -42])

  const phoneScale = useTransform(progress, [0.18, 0.48, 0.9], [0.88, 1.05, 0.94])
  const phoneRotateY = useTransform(progress, [0, 0.5, 1], [-10, 0, 10])
  const phoneRotateX = useTransform(progress, [0, 0.4, 1], [18, 0, -11])
  const phoneY = useParallax(progress, [120, -90])

  const glowOpacity = useTransform(progress, [0.15, 0.5, 0.95], [0.2, 0.7, 0.25])

  return (
    <section id="preview" ref={targetRef} className="relative h-[240vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(70rem_40rem_at_50%_6%,rgba(88,213,255,0.2),transparent_55%),linear-gradient(180deg,#060d18_0%,#050b14_50%,#04070f_100%)]" />

        <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col justify-center gap-12 px-6 md:px-12 lg:flex-row lg:items-center lg:justify-between">
          <motion.div style={{ opacity: textOpacity, y: textY }} className="max-w-xl">
            <p className="font-display text-xs uppercase tracking-[0.28em] text-[#97aed0]">
              Scene 04
            </p>
            <h2 className="mt-4 font-display text-4xl font-semibold leading-[0.95] text-white sm:text-5xl md:text-6xl">
              A mobile studio with cinematic depth.
            </h2>
            <p className="mt-6 text-base leading-relaxed text-[#adc2de] md:text-lg">
              HustleHub feels tactile. Feed, profile, and progress timelines float in layers,
              so every interaction reads as deliberate craft.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <MagneticButton href="#finale">Join beta waitlist</MagneticButton>
              <button className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-medium text-white/90 transition-colors duration-300 hover:bg-white/10">
                View prototype deck
              </button>
            </div>
          </motion.div>

          <motion.div
            style={{
              y: phoneY,
              scale: phoneScale,
              rotateY: phoneRotateY,
              rotateX: phoneRotateX,
              transformStyle: 'preserve-3d',
            }}
            className="relative mx-auto w-[min(88vw,340px)] [perspective:1600px]"
          >
            <motion.div
              style={{ opacity: glowOpacity }}
              className="pointer-events-none absolute -inset-8 rounded-[3rem] bg-[#58d5ff]/20 blur-[120px]"
            />

            <div className="relative h-[620px] rounded-[3rem] border border-white/25 bg-[#081021]/80 p-3 shadow-[0_60px_120px_rgba(2,8,20,0.65)] backdrop-blur-xl">
              <div className="absolute left-1/2 top-3 h-1.5 w-24 -translate-x-1/2 rounded-full bg-white/35" />

              <div className="h-full rounded-[2.3rem] border border-white/15 bg-[linear-gradient(170deg,#0d1830_0%,#081425_48%,#060f1f_100%)] p-4">
                <div className="glass-panel rounded-2xl p-4">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[#97afd2]">Today</p>
                  <h3 className="mt-2 font-display text-lg text-white">You posted a deep-dive scene</h3>
                  <p className="mt-2 text-xs text-[#bdd0e8]">Engagement +42% from peers in ML and Product.</p>
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
                    <p className="text-xs text-white/90">Scene performance timeline</p>
                    <div className="mt-3 h-2 rounded-full bg-white/10">
                      <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-[#58d5ff] via-[#82f3ce] to-[#ffc88a]" />
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
                    <p className="text-xs text-white/90">Mentor matches this week</p>
                    <p className="mt-2 font-display text-2xl text-white">12</p>
                  </div>

                  <div className="rounded-xl border border-white/20 bg-white/10 px-4 py-3">
                    <p className="text-xs text-white/90">Portfolio visibility</p>
                    <p className="mt-2 text-sm text-[#b9d0ea]">Top 3% in your track</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
