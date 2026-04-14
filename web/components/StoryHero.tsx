'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import MagneticButton from '@/components/MagneticButton'
import RevealText from '@/components/RevealText'

export default function StoryHero() {
  const sectionRef = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })

  const backgroundScale = useTransform(scrollYProgress, [0, 1], [1, 1.16])
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, -90])
  const headingY = useTransform(scrollYProgress, [0, 1], [0, -150])
  const headingOpacity = useTransform(scrollYProgress, [0, 0.78, 1], [1, 0.95, 0])
  const cardsY = useTransform(scrollYProgress, [0, 1], [0, -160])
  const cardsOpacity = useTransform(scrollYProgress, [0.2, 0.65, 1], [0.35, 1, 0])

  const orbNear = useTransform(scrollYProgress, [0, 1], [0, -180])
  const orbMid = useTransform(scrollYProgress, [0, 1], [0, -120])
  const orbFar = useTransform(scrollYProgress, [0, 1], [0, -70])

  return (
    <section ref={sectionRef} className="relative h-[185vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div
          style={{ scale: backgroundScale, y: backgroundY }}
          className="absolute inset-0"
        >
          <motion.div
            className="absolute inset-0"
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
            }}
            transition={{ duration: 24, ease: 'linear', repeat: Infinity }}
            style={{
              background:
                'radial-gradient(90rem 60rem at 10% -20%, rgba(88, 213, 255, 0.24), transparent 58%), radial-gradient(70rem 50rem at 92% 8%, rgba(255, 200, 138, 0.2), transparent 50%), linear-gradient(180deg, #081226 0%, #050b14 60%, #04070f 100%)',
            }}
          />
        </motion.div>

        <div className="noise-layer pointer-events-none absolute inset-0" />

        <motion.div
          style={{ y: orbFar }}
          className="pointer-events-none absolute left-[10%] top-[20%] h-36 w-36 rounded-full bg-[#58d5ff]/20 blur-3xl"
        />
        <motion.div
          style={{ y: orbMid }}
          className="pointer-events-none absolute right-[14%] top-[18%] h-56 w-56 rounded-full bg-[#82f3ce]/18 blur-3xl"
        />
        <motion.div
          style={{ y: orbNear }}
          className="pointer-events-none absolute right-[30%] top-[58%] h-40 w-40 rounded-full bg-[#ffc88a]/16 blur-3xl"
        />

        <div className="relative z-20 mx-auto flex h-full w-full max-w-7xl flex-col justify-between px-6 pb-16 pt-28 md:px-12">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display text-xs uppercase tracking-[0.34em] text-[#9ab2d4]"
          >
            HustleHub • Story Engine
          </motion.p>

          <motion.div style={{ y: headingY, opacity: headingOpacity }} className="max-w-5xl">
            <RevealText
              text="The social feed that feels directed, not dumped."
              className="font-display text-4xl font-semibold leading-[0.95] text-white sm:text-6xl md:text-7xl lg:text-8xl"
            />

            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.55 }}
              transition={{ delay: 0.2, duration: 0.7 }}
              className="mt-8 max-w-2xl text-base leading-relaxed text-[#a9bdd9] md:text-lg"
            >
              Publish progress, learning, and ambition through scenes. Discover people,
              opportunities, and momentum in a cinematic scroll journey built for high-agency careers.
            </motion.p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <MagneticButton href="#story">Start the experience</MagneticButton>
              <a
                href="#preview"
                className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-medium text-white/90 transition-colors duration-300 hover:bg-white/10"
              >
                Watch app preview
              </a>
            </div>
          </motion.div>

          <motion.div
            style={{ y: cardsY, opacity: cardsOpacity }}
            className="grid gap-4 sm:grid-cols-3"
          >
            <motion.div
              whileHover={{ y: -8 }}
              className="glass-card rounded-2xl p-4"
            >
              <p className="text-xs uppercase tracking-[0.26em] text-[#93abca]">Velocity</p>
              <p className="mt-2 text-sm text-[#d9e8ff]">Build streaks with focused learning scenes.</p>
            </motion.div>
            <motion.div
              whileHover={{ y: -8 }}
              className="glass-card rounded-2xl p-4"
            >
              <p className="text-xs uppercase tracking-[0.26em] text-[#93abca]">Credibility</p>
              <p className="mt-2 text-sm text-[#d9e8ff]">Signal depth with proof-driven progress posts.</p>
            </motion.div>
            <motion.div
              whileHover={{ y: -8 }}
              className="glass-card rounded-2xl p-4"
            >
              <p className="text-xs uppercase tracking-[0.26em] text-[#93abca]">Discovery</p>
              <p className="mt-2 text-sm text-[#d9e8ff]">Find mentors, peers, and teams in your lane.</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
