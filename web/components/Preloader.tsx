'use client'

import { motion } from 'framer-motion'

export default function Preloader() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050b14]"
    >
      <div className="w-[min(82vw,520px)] px-8">
        <div className="mb-7 flex items-center justify-between text-xs uppercase tracking-[0.32em] text-[#9fb4d3]">
          <span>HustleHub</span>
          <span>Initializing Scene</span>
        </div>

        <motion.div
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="h-[2px] rounded-full bg-gradient-to-r from-[#58d5ff] via-[#82f3ce] to-[#ffc88a]"
        />

        <motion.div
          animate={{ opacity: [0.35, 0.9, 0.35], scale: [1, 1.06, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          className="mt-10 text-center font-display text-5xl font-semibold tracking-[-0.05em] text-white md:text-6xl"
        >
          H
        </motion.div>
      </div>
    </motion.div>
  )
}
