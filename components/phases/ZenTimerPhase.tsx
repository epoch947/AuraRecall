'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useRitualStore } from '@/lib/store/useRitualStore'
import { phaseVariants } from '@/components/RitualContainer'

export default function ZenTimerPhase() {
  const { advanceTo, markZenCompleted } = useRitualStore()
  const [seconds, setSeconds] = useState(60)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const advance = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    markZenCompleted()
    advanceTo('SAMPLING')
  }

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!)
          // Use setTimeout to avoid state update during render
          setTimeout(advance, 0)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatted = String(seconds).padStart(2, '0')

  return (
    <motion.div
      variants={phaseVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative w-full h-full flex flex-col items-center justify-center bg-charcoal"
    >
      {/* Centered video card */}
      <div className="relative w-[min(380px,80vw)] rounded-2xl overflow-hidden shadow-2xl aspect-[9/16]">
        <video
          src="/assets/1_1.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Countdown overlay on video */}
        <div className="absolute inset-x-0 bottom-8 flex justify-center">
          <span className="font-mono text-7xl text-oatmeal tabular-nums tracking-tight drop-shadow-lg">
            {formatted}
          </span>
        </div>
      </div>

      {/* Breathing instruction */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="mt-8 font-mono text-xs text-sage tracking-[0.3em] uppercase"
      >
        breathe. clear. arrive.
      </motion.p>

      {/* Skip button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35 }}
        transition={{ delay: 3, duration: 1.2 }}
        whileHover={{ opacity: 0.8 }}
        onClick={advance}
        className="absolute bottom-8 font-mono text-xs text-sage tracking-[0.25em] uppercase"
      >
        skip →
      </motion.button>
    </motion.div>
  )
}
