'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface WaitlistModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setLoading(false)
    setSubmitted(true)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/20 bg-[#081226] p-8 shadow-[0_30px_60px_rgba(0,0,0,0.5)] md:p-12"
          >
            <button 
              onClick={onClose}
              className="absolute right-6 top-6 text-white/50 transition-colors hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {!submitted ? (
              <>
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#58d5ff]/20 to-[#82f3ce]/20 text-[#58d5ff]">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699-2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-4.51 4.51M21 21l-2-2m-7-9l1.172-1.172a4.5 4.5 0 116.364 6.364L18 15.408m-7 1.418L9 18M18 9l2 2" />
                  </svg>
                </div>
                
                <h2 className="font-display text-3xl font-semibold text-white">Join the experience.</h2>
                <p className="mt-4 text-[#a9bdd9]">
                  We are gradually opening access to ensure the network quality remains high. Leave your email to get early priority.
                </p>

                <form onSubmit={handleSubmit} className="mt-10 space-y-4">
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-white outline-none ring-[#58d5ff]/30 transition-all focus:border-[#58d5ff]/50 focus:ring-4"
                    />
                  </div>
                  
                  <button
                    disabled={loading}
                    className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#58d5ff] via-[#82f3ce] to-[#ffc88a] py-4 font-semibold text-[#081226] transition-transform active:scale-95 disabled:opacity-70"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </span>
                    ) : 'Request priority access'}
                  </button>
                  <p className="text-center text-xs text-white/40">
                    No spam. Just product updates and early access links.
                  </p>
                </form>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 text-green-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-8 w-8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h2 className="font-display text-3xl font-semibold text-white">You&apos;re in the queue.</h2>
                <p className="mt-4 text-[#a9bdd9]">
                  Thank you! We&apos;ve added <strong>{email}</strong> to our early access list. We&apos;ll reach out as soon as a spot opens up in your track.
                </p>
                <button
                  onClick={onClose}
                  className="mt-10 rounded-full border border-white/20 px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-white/5"
                >
                  Close
                </button>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
