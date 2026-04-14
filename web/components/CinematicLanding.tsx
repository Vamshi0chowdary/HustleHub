'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import AppPreviewScene from '@/components/AppPreviewScene'
import MagneticButton from '@/components/MagneticButton'
import Preloader from '@/components/Preloader'
import StoryFeatureSection from '@/components/StoryFeatureSection'
import StoryHero from '@/components/StoryHero'

const FEATURES = [
  {
    id: 'story',
    eyebrow: 'Intent Graph',
    title: 'Recommendations that read your ambition, not random noise.',
    description:
      'Our ML feed captures trajectory, craft, and consistency. You do not just go viral once; you stay discoverable for meaningful opportunities.',
    bullets: [
      'Intent-aware ranking tuned for growth signals',
      'Collaborative + content intelligence blended in real time',
      'Career-relevant discovery over vanity engagement',
    ],
    accentFrom: 'rgba(88, 213, 255, 0.27)',
    accentTo: 'rgba(130, 243, 206, 0.16)',
  },
  {
    id: undefined,
    eyebrow: 'Collaboration Layer',
    title: 'Study circles, build squads, and mentor loops in one flow.',
    description:
      'Move from passive scrolling to active momentum. Find people by goals, stack projects together, and show visible progress scene by scene.',
    bullets: [
      'Skill-synced circles with curated accountability',
      'One-tap project room creation and role matching',
      'Mentor graph that expands as your output compounds',
    ],
    accentFrom: 'rgba(255, 200, 138, 0.23)',
    accentTo: 'rgba(88, 213, 255, 0.15)',
  },
  {
    id: undefined,
    eyebrow: 'Signal System',
    title: 'Your profile evolves from resume to living operating system.',
    description:
      'Timeline, proof, and outcomes are stitched into an immersive profile that recruiters and collaborators can evaluate in minutes.',
    bullets: [
      'Scene-based portfolio that keeps context intact',
      'Depth metrics for consistency and execution quality',
      'Instant share cards with layered credibility cues',
    ],
    accentFrom: 'rgba(130, 243, 206, 0.22)',
    accentTo: 'rgba(255, 200, 138, 0.16)',
  },
]

export default function CinematicLanding() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsLoading(false)
    }, 1700)

    return () => {
      window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = 'hidden'
      return
    }

    document.body.style.overflow = ''

    return () => {
      document.body.style.overflow = ''
    }
  }, [isLoading])

  return (
    <>
      <AnimatePresence>{isLoading ? <Preloader /> : null}</AnimatePresence>

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-x-clip"
      >
        <StoryHero />

        {FEATURES.map((feature, index) => (
          <StoryFeatureSection
            key={feature.title}
            id={feature.id}
            index={index + 1}
            eyebrow={feature.eyebrow}
            title={feature.title}
            description={feature.description}
            bullets={feature.bullets}
            accentFrom={feature.accentFrom}
            accentTo={feature.accentTo}
          />
        ))}

        <AppPreviewScene />

        <section id="finale" className="relative overflow-hidden px-6 pb-28 pt-24 md:px-12">
          <div className="mx-auto max-w-5xl rounded-[2.2rem] border border-white/15 bg-[linear-gradient(150deg,rgba(88,213,255,0.2),rgba(255,200,138,0.16),rgba(8,14,26,0.94))] p-10 shadow-[0_34px_85px_rgba(2,8,20,0.55)] backdrop-blur-2xl md:p-14">
            <p className="font-display text-xs uppercase tracking-[0.3em] text-[#9cb3d2]">
              Final Scene
            </p>
            <h2 className="mt-5 font-display text-4xl font-semibold leading-[0.95] text-white md:text-6xl">
              Build your public growth arc with HustleHub.
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#b4c9e5] md:text-lg">
              We are opening early access to creators, engineers, operators, and students who want
              a feed designed for long-term trajectory. Bring your ambition and let the product do
              the storytelling.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <MagneticButton href="#">Request early access</MagneticButton>
              <button className="rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-medium text-white/90 transition-colors duration-300 hover:bg-white/10">
                Read product manifesto
              </button>
            </div>
          </div>
        </section>
      </motion.main>
    </>
  )
}
