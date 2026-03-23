'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import Image from 'next/image'
import { Wind } from 'lucide-react'
import { useRitualStore, EchoRecord } from '@/lib/store/useRitualStore'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { extractMoodColor } from '@/lib/utils/semanticColor'
import { phaseVariants } from '@/components/RitualContainer'

// ─── Echo Whisper helpers ─────────────────────────────────────────────────────

function parseHSL(hsl: string): { h: number; s: number; l: number } | null {
  const m = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
  if (!m) return null
  return { h: +m[1], s: +m[2], l: +m[3] }
}

function hueDist(a: number, b: number): number {
  const d = Math.abs(a - b)
  return Math.min(d, 360 - d)
}

function findEchoMatch(currentColor: string, echoes: EchoRecord[]): EchoRecord | null {
  const curr = parseHSL(currentColor)
  if (!curr) return null
  const today = new Date().toDateString()

  let best: EchoRecord | null = null
  let bestScore = Infinity

  for (const echo of echoes) {
    if (new Date(echo.createdAt).toDateString() === today) continue
    const c = parseHSL(echo.semanticColor)
    if (!c) continue
    const score = hueDist(curr.h, c.h) + Math.abs(curr.l - c.l)
    if (score < bestScore) {
      bestScore = score
      best = echo
    }
  }

  return bestScore < 40 ? best : null
}

// ─────────────────────────────────────────────────────────────────────────────

export default function SamplingPhase() {
  const {
    advanceTo,
    moodText, setMoodText,
    moodColor, setMoodColor,
    setWeatherData, weatherData,
    resetRitual,
    pastEchoes,
  } = useRitualStore()

  const [weatherLoading, setWeatherLoading] = useState(true)
  const [isDissolving, setIsDissolving] = useState(false)
  const [echoMatch, setEchoMatch] = useState<EchoRecord | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const textareaControls = useAnimation()

  const debouncedText = useDebounce(moodText, 500)
  const canSeal = moodText.length >= 10

  // Fetch weather on mount
  useEffect(() => {
    fetch('/api/weather')
      .then((r) => r.json())
      .then((data) => {
        setWeatherData(data)
        setWeatherLoading(false)
      })
      .catch(() => {
        setWeatherData({ description: 'Unknown Skies', code: 'unknown' })
        setWeatherLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [moodText])

  // Debounced semantic color extraction
  useEffect(() => {
    if (debouncedText.length > 0) {
      setMoodColor(extractMoodColor(debouncedText))
    }
  }, [debouncedText, setMoodColor])

  // Echo Whisper — surface a past echo with similar mood color
  useEffect(() => {
    if (debouncedText.length < 10 || pastEchoes.length === 0) {
      setEchoMatch(null)
      return
    }
    setEchoMatch(findEchoMatch(moodColor, pastEchoes))
  }, [moodColor, debouncedText, pastEchoes])

  const handleRelease = async () => {
    if (isDissolving) return
    setIsDissolving(true)
    await textareaControls.start({
      filter: 'blur(12px)',
      opacity: 0,
      y: -20,
      transition: { duration: 3.5, ease: 'easeInOut' },
    })
    resetRitual()
  }

  return (
    <motion.div
      variants={phaseVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative w-full h-full flex flex-col items-center justify-center"
      style={{ backgroundColor: moodColor, transition: 'background-color 3000ms ease-in-out' }}
    >
      {/* Echo Whisper — ghost from the past */}
      <AnimatePresence>
        {echoMatch && !isDissolving && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            className="absolute top-16 inset-x-0 z-20 flex justify-center pointer-events-none px-8"
          >
            <p className="font-serif text-sm italic text-charcoal/40 tracking-wide text-center max-w-xs leading-relaxed">
              An echo from{' '}
              {new Date(echoMatch.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
              })}
              {': '}
              {echoMatch.originalText.slice(0, 60)}
              {echoMatch.originalText.length > 60 ? '…' : ''}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/assets/2_1.png"
          alt=""
          fill
          className="object-cover"
          priority
          style={{ mixBlendMode: 'multiply', opacity: 0.5 }}
        />
      </div>

      {/* Weather badge */}
      <div className="absolute top-6 right-6 z-10 h-10">
        <AnimatePresence mode="wait">
          {weatherLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 bg-linen/70 backdrop-blur-sm
                         px-3 py-2 rounded-full border border-sage/20"
            >
              <span className="font-mono text-xs text-sage/70 tracking-wide animate-pulse">
                reading skies…
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="data"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="flex items-center gap-2 bg-linen/80 backdrop-blur-sm
                         px-3 py-2 rounded-full border border-sage/30"
            >
              <Image
                src="/assets/2_2.png"
                alt="weather"
                width={18}
                height={18}
                className="object-contain opacity-70 rounded-full"
              />
              <span className="font-mono text-xs text-charcoal tracking-wide">
                {weatherData?.description}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main card */}
      <div className="relative z-10 flex flex-col gap-4 w-[min(480px,90vw)]">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="font-serif text-xl text-charcoal/70 tracking-wide"
        >
          How does today feel?
        </motion.h2>

        {/* Semantic textarea */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <motion.textarea
            ref={textareaRef}
            animate={textareaControls}
            value={moodText}
            onChange={(e) => setMoodText(e.target.value)}
            placeholder="What is the frequency of your heart today?"
            rows={4}
            disabled={isDissolving}
            className="w-full bg-transparent border-0
                       font-serif text-lg text-charcoal placeholder:text-charcoal/35
                       px-0 py-2 resize-none outline-none leading-relaxed
                       focus:ring-0 focus:outline-none mood-glow"
            style={{
              boxShadow: canSeal
                ? `0 0 0 1.5px ${moodColor}, 0 4px 40px ${moodColor}55`
                : `0 0 0 1px rgba(185,185,157,0.25)`,
            }}
          />
          <p className="font-mono text-[10px] text-sage/70 text-right mt-1 tracking-wide">
            {moodText.length} characters
          </p>
        </motion.div>

        {/* Seal button */}
        <AnimatePresence>
          {canSeal && !isDissolving && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              onClick={() => advanceTo('VIZ_LAB')}
              className="self-end px-8 py-3 bg-charcoal text-oatmeal
                         font-mono text-xs tracking-[0.25em] uppercase
                         hover:bg-charcoal/80 transition-colors duration-300"
            >
              Seal &amp; Archive →
            </motion.button>
          )}
        </AnimatePresence>

        {/* Release to Wind — ephemeral escape */}
        <AnimatePresence>
          {moodText.length > 0 && !isDissolving && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              onClick={handleRelease}
              className="self-end flex items-center gap-2 font-mono text-[10px]
                         text-charcoal/40 hover:text-charcoal/80 tracking-widest uppercase
                         transition-colors duration-500"
            >
              <Wind size={11} strokeWidth={1.5} />
              Release to Wind
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
