'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  echoGenerationErrorResponseSchema,
  echoGenerationResponseSchema,
} from '@/features/journal/contracts'
import { useRitualStore } from '@/features/journal/store/useRitualStore'
import { useTypewriter } from '@/features/journal/hooks/useTypewriter'
import { formatWeatherContext } from '@/features/journal/lib/weather'
import { phaseVariants } from '@/features/journal/components/RitualContainer'

const LOADING_MESSAGES = [
  'Distilling the shape of your day…',
  'Weaving memory into form…',
  'Reading the texture of your words…',
  'Translating signals into imagery…',
]

const GENERATION_ERROR_MESSAGE = 'We could not create your visual echo right now. Please try again.'

export default function VizLabPhase() {
  const { advanceTo, moodText, weatherData, setEchoData, setMoodColor } = useRitualStore()
  const videoRef = useRef<HTMLVideoElement>(null)
  const hasRequested = useRef(false)
  const [videoEnded, setVideoEnded] = useState(false)
  const [generationStatus, setGenerationStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')
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

  const requestEcho = useCallback(async () => {
    setGenerationStatus('loading')
    setErrorMessage('')

    try {
      const response = await fetch('/api/generate-echo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moodText,
          weather: formatWeatherContext(weatherData),
          isPublic: true,
        }),
      })
      const payload: unknown = await response.json().catch(() => null)

      if (!response.ok) {
        const parsedError = echoGenerationErrorResponseSchema.safeParse(payload)
        throw new Error(
          parsedError.success ? parsedError.data.error.message : GENERATION_ERROR_MESSAGE,
        )
      }

      const parsedEcho = echoGenerationResponseSchema.safeParse(payload)
      if (!parsedEcho.success) {
        throw new Error('The generated echo was incomplete. Please try again.')
      }

      if (parsedEcho.data.semanticColor) setMoodColor(parsedEcho.data.semanticColor)
      setEchoData(parsedEcho.data)
      setGenerationStatus('ready')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : GENERATION_ERROR_MESSAGE)
      setGenerationStatus('error')
    }
  }, [moodText, setEchoData, setMoodColor, weatherData])

  // Fire the request immediately on mount so it runs in parallel with the video.
  useEffect(() => {
    if (hasRequested.current) return
    hasRequested.current = true
    void requestEcho()
  }, [requestEcho])

  // Advance when BOTH video ended AND API ready
  useEffect(() => {
    if (videoEnded && generationStatus === 'ready' && !hasAdvanced.current) {
      hasAdvanced.current = true
      const timer = setTimeout(() => advanceTo('CINEMA'), 700)
      return () => clearTimeout(timer)
    }
  }, [videoEnded, generationStatus, advanceTo])

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
              onError={() => setVideoEnded(true)}
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading animation — appears after video ends */}
      <AnimatePresence>
        {videoEnded && generationStatus !== 'error' && (
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

      <AnimatePresence>
        {videoEnded && generationStatus === 'error' && (
          <motion.div
            key="viz-error"
            role="alert"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.45 }}
            className="relative z-10 flex max-w-md flex-col items-center px-8 text-center"
          >
            <div className="mb-8 h-px w-16 bg-sage/45" />
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-sage/55">
              Generation paused
            </p>
            <h2 className="mt-5 font-serif text-3xl text-oatmeal">Your journal is still here.</h2>
            <p className="mt-5 font-serif text-base leading-relaxed text-oatmeal/65">
              {errorMessage}
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
              <button
                type="button"
                onClick={() => void requestEcho()}
                className="border border-sage/55 px-7 py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-oatmeal transition-colors hover:bg-sage/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/70"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => advanceTo('ENTRY')}
                className="px-7 py-3 font-mono text-[10px] uppercase tracking-[0.25em] text-oatmeal/55 transition-colors hover:text-oatmeal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/70"
              >
                Return to Journal
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
