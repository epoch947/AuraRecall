'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRitualStore } from '@/lib/store/useRitualStore'
import { useTypewriter } from '@/lib/hooks/useTypewriter'
import { phaseVariants } from '@/components/RitualContainer'

const LOADING_MESSAGES = [
  'Distilling the shape of your day…',
  'Weaving memory into form…',
  'Reading the texture of your words…',
  'Translating signals into imagery…',
]

export default function VizLabPhase() {
  const { advanceTo, moodText, weatherData, setEchoData, setMoodColor } = useRitualStore()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoEnded, setVideoEnded] = useState(false)
  const [apiReady, setApiReady] = useState(false)
  const [msgIndex, setMsgIndex] = useState(0)
  const hasAdvanced = useRef(false)

  // Cycle loading messages after video ends
  useEffect(() => {
    if (!videoEnded) return
    const timer = setInterval(() => {
      setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length)
    }, 2800)
    return () => clearInterval(timer)
  }, [videoEnded])

  // Fire API call immediately on mount (parallel with video)
  useEffect(() => {
    fetch('/api/generate-echo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moodText,
        weather: weatherData?.description ?? 'Unknown Skies',
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.semanticColor) setMoodColor(data.semanticColor)
        setEchoData(data)
        setApiReady(true)
      })
      .catch(() => {
        setEchoData({ imageUrl: null, insight: 'Your moment is held in stillness.' })
        setApiReady(true)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Advance when BOTH video ended AND API ready
  useEffect(() => {
    if (videoEnded && apiReady && !hasAdvanced.current) {
      hasAdvanced.current = true
      const timer = setTimeout(() => advanceTo('CINEMA'), 700)
      return () => clearTimeout(timer)
    }
  }, [videoEnded, apiReady, advanceTo])

  const loadingText = useTypewriter(LOADING_MESSAGES[msgIndex], 35, videoEnded)

  return (
    <motion.div
      variants={phaseVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative w-full h-full flex items-center justify-center bg-charcoal overflow-hidden"
    >
      {/* Video — plays once */}
      <AnimatePresence>
        {!videoEnded && (
          <motion.div
            key="viz-video"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.9 } }}
            className="absolute inset-0"
          >
            <video
              ref={videoRef}
              src="/assets/3_1.mp4"
              autoPlay
              muted
              playsInline
              onEnded={() => setVideoEnded(true)}
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading animation — appears after video ends */}
      <AnimatePresence>
        {videoEnded && (
          <motion.div
            key="viz-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center justify-center gap-10"
          >
            {/* Concentric ring animation */}
            <div className="relative w-40 h-40">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="absolute rounded-full border border-sage/25 animate-ping"
                  style={{
                    inset: `${i * 16}%`,
                    animationDelay: `${i * 0.45}s`,
                    animationDuration: '2.2s',
                  }}
                />
              ))}
              <div className="absolute inset-[12%] rounded-full bg-sage/8 animate-pulse" />
              <div
                className="absolute inset-[35%] rounded-full bg-sage/15 animate-pulse"
                style={{ animationDelay: '0.4s' }}
              />
              <div className="absolute inset-[52%] rounded-full bg-sage/35" />
            </div>

            {/* Typewriter loading message */}
            <p className="font-mono text-sm text-sage/70 tracking-wide typewriter-cursor min-h-[1.5em] text-center px-8">
              {loadingText}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
