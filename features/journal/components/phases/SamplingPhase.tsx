'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import Image from 'next/image'
import { MapPin, RefreshCw, Wind, X } from 'lucide-react'
import { useRitualStore, type EchoRecord } from '@/features/journal/store/useRitualStore'
import { useDebounce } from '@/features/journal/hooks/useDebounce'
import { useCurrentWeather } from '@/features/journal/hooks/useCurrentWeather'
import { extractMoodColor } from '@/features/journal/lib/semanticColor'
import { formatWeatherLabel } from '@/features/journal/lib/weather'
import { phaseVariants } from '@/features/journal/components/RitualContainer'
import BackControl from '@/features/navigation/components/BackControl'

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
    moodText,
    setMoodText,
    moodColor,
    setMoodColor,
    leaveRitual,
    resetRitual,
    pastEchoes,
  } = useRitualStore()

  const { weatherData, status, message, requestWeather, removeWeather, isLoading } =
    useCurrentWeather()
  const [isDissolving, setIsDissolving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const textareaControls = useAnimation()

  const debouncedText = useDebounce(moodText, 500)
  const canSeal = moodText.length >= 10

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

  const echoMatch = useMemo(() => {
    if (debouncedText.length < 10 || pastEchoes.length === 0) return null
    return findEchoMatch(moodColor, pastEchoes)
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
      <BackControl
        onClick={leaveRitual}
        label="Leave ritual"
        compactOnMobile
        className="absolute left-4 top-4 z-30 sm:left-6 sm:top-5"
      />

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

      {/* User-controlled local weather */}
      <div
        aria-live="polite"
        className="absolute top-6 right-16 z-20 flex max-w-[min(340px,calc(100vw-5rem))] flex-col items-end gap-2 sm:right-20"
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 bg-linen/70 backdrop-blur-sm
                         px-3 py-2 rounded-full border border-sage/20"
            >
              <RefreshCw size={13} strokeWidth={1.5} className="animate-spin text-sage/70" />
              <span className="font-mono text-xs text-sage/70 tracking-wide animate-pulse">
                {status === 'locating' ? 'finding your horizon…' : 'reading local skies…'}
              </span>
            </motion.div>
          ) : weatherData ? (
            <motion.div
              key="data"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-col items-end gap-1.5"
            >
              <div
                className="flex items-center gap-2 rounded-full border border-sage/30
                           bg-linen/80 px-3 py-2 backdrop-blur-sm"
              >
                <Image
                  src="/assets/2_2.png"
                  alt=""
                  width={18}
                  height={18}
                  className="rounded-full object-contain opacity-70"
                />
                <span className="font-mono text-xs tracking-wide text-charcoal">
                  {formatWeatherLabel(weatherData)}
                </span>
                <button
                  type="button"
                  onClick={removeWeather}
                  aria-label="Remove local weather"
                  className="text-charcoal/35 transition-colors hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/60"
                >
                  <X size={13} strokeWidth={1.5} />
                </button>
              </div>
              <a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noreferrer"
                className="pr-2 font-mono text-[8px] tracking-wider text-charcoal/35 transition-colors hover:text-charcoal/60"
              >
                Weather data by Open-Meteo
              </a>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-end gap-2"
            >
              <button
                type="button"
                onClick={requestWeather}
                className="flex items-center gap-2 rounded-full border border-sage/25
                           bg-linen/65 px-3 py-2 font-mono text-[10px] uppercase
                           tracking-[0.15em] text-charcoal/60 backdrop-blur-sm
                           transition-colors hover:border-sage/50 hover:text-charcoal
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/60"
              >
                <MapPin size={13} strokeWidth={1.5} />
                {status === 'idle' ? 'Add local weather' : 'Try current location'}
              </button>
              {message && (
                <p
                  role="status"
                  className="max-w-xs text-right font-serif text-xs leading-relaxed text-charcoal/50"
                >
                  {message}
                </p>
              )}
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
