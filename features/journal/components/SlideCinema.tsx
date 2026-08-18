'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, Download, Check, Volume2, VolumeX } from 'lucide-react'
import { useSonicLandscape } from '@/features/journal/hooks/useSonicLandscape'
import BackControl from '@/features/navigation/components/BackControl'

// ─── Data contract ────────────────────────────────────────────────────────────

export interface EchoData {
  imageUrl: string | null
  insight: string
  originalText: string
  weather: string
  semanticColor: string
  date: string
}

// ─── Framer Motion variants ───────────────────────────────────────────────────

const FUWARI = [0.4, 0, 0.2, 1] as const

const slideVariants = {
  initial: (d: number) => ({
    opacity: 0,
    x: d * 24,
    filter: 'blur(3px)',
  }),
  animate: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.55, ease: FUWARI },
  },
  exit: (d: number) => ({
    opacity: 0,
    x: d * -24,
    filter: 'blur(3px)',
    transition: { duration: 0.35, ease: FUWARI },
  }),
}

// Word-by-word stagger
const wordContainerVariants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.12, delayChildren: 0.5 } },
}
const wordVariants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: FUWARI },
  },
}

// ─── Slide 1: Visual Echo (Ken Burns) ─────────────────────────────────────────

function Slide1({ echoData }: { echoData: EchoData }) {
  const [imageError, setImageError] = useState(false)

  return (
    <div className="relative w-full h-full overflow-hidden bg-charcoal">
      {!imageError && echoData.imageUrl ? (
        <motion.img
          src={echoData.imageUrl}
          alt="Your aura echo"
          onError={() => setImageError(true)}
          initial={{ scale: 1, y: '0%' }}
          animate={{ scale: 1.08, y: '-2%' }}
          transition={{
            duration: 15,
            ease: 'linear',
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          className="absolute inset-0 w-full h-full object-cover origin-center"
        />
      ) : (
        // Fallback — animated mood gradient
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-5"
          style={{
            background: `radial-gradient(ellipse at 50% 40%, ${echoData.semanticColor} 0%, hsl(43,20%,82%) 55%, #2a2a2a 100%)`,
          }}
        >
          <p className="font-serif text-5xl text-charcoal/30 select-none">◈</p>
          <p className="font-mono text-xs text-charcoal/35 tracking-[0.4em] uppercase">
            Echo Visualized
          </p>
        </div>
      )}

      {/* Bottom gradient */}
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/65 via-black/15 to-transparent pointer-events-none" />

      {/* Caption — bottom left */}
      <div className="absolute bottom-0 inset-x-0 px-7 pb-10 pointer-events-none">
        <p className="font-serif text-sm text-oatmeal/85 mb-1">{echoData.weather}</p>
        <p className="font-mono text-[10px] text-oatmeal/50 tracking-[0.25em]">{echoData.date}</p>
      </div>
    </div>
  )
}

// ─── Slide 2: Semantic Insight (Staggered Typewriter) ─────────────────────────

function Slide2({ echoData, isActive }: { echoData: EchoData; isActive: boolean }) {
  const words = echoData.insight.split(' ')

  return (
    <div
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      style={{
        backgroundColor: echoData.semanticColor,
        transition: 'background-color 1s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* 3_2.png — washi paper overlay with multiply blend */}
      <div className="absolute inset-0">
        <Image
          src="/assets/3_2.png"
          alt=""
          fill
          className="object-cover"
          style={{ mixBlendMode: 'multiply', opacity: 0.72 }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-sm px-10 text-center">
        <p className="font-mono text-[10px] text-charcoal/45 tracking-[0.35em] uppercase mb-12">
          your echo
        </p>

        {/* Staggered word typewriter */}
        <motion.p
          variants={wordContainerVariants}
          initial="initial"
          animate={isActive ? 'animate' : 'initial'}
          className="font-serif text-2xl text-charcoal leading-loose"
        >
          {words.map((word, i) => (
            <motion.span key={i} variants={wordVariants} className="inline-block mx-[0.2em]">
              {word}
            </motion.span>
          ))}
        </motion.p>
      </div>
    </div>
  )
}

// ─── Slide 3: The Archive & Export ────────────────────────────────────────────

function Slide3({ echoData, onReset }: { echoData: EchoData; onReset?: () => void }) {
  const posterRef = useRef<HTMLDivElement>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [saved, setSaved] = useState(false)
  const hasGeneratedImage = Boolean(echoData.imageUrl)

  const handleExport = async () => {
    if (!posterRef.current || isCapturing || saved) return
    setIsCapturing(true)
    try {
      const posterImages = Array.from(posterRef.current.querySelectorAll('img'))
      await Promise.all(posterImages.map((image) => image.decode().catch(() => undefined)))
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(posterRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: hasGeneratedImage ? '#2a2a2a' : '#f1eadf',
      })
      const link = document.createElement('a')
      link.download = 'AuraRecall_Echo.png'
      link.href = dataUrl
      link.click()
      setSaved(true)
      // Graceful reset — let user register the success state for 2.5s
      if (onReset) setTimeout(onReset, 2500)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setIsCapturing(false)
    }
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-oatmeal">
      <div
        ref={posterRef}
        className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-oatmeal"
      >
        {/* ── Layer 1: generated visual or semantic fallback ── */}
        {echoData.imageUrl ? (
          <Image src={echoData.imageUrl} alt="" fill unoptimized className="object-cover" />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 50% 40%, ${echoData.semanticColor} 0%, hsl(43,20%,82%) 58%, #2a2a2a 130%)`,
            }}
          />
        )}

        {hasGeneratedImage && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/45 to-black/70" />
        )}

        {/* ── Layer 2: Enso circle watermark ── */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-80 h-80">
            <Image
              src="/assets/3_3.png"
              alt=""
              fill
              className="object-contain"
              style={{
                opacity: hasGeneratedImage ? 0.12 : 0.2,
                mixBlendMode: hasGeneratedImage ? 'screen' : 'multiply',
              }}
            />
          </div>
        </div>

        {/* ── Layer 3: Poster content ── */}
        <div
          className="relative z-10 flex flex-col items-center gap-6 mx-auto
                   w-[min(600px,90vw)] px-14 py-12 min-h-[420px]"
        >
          <p
            className={`font-mono text-sm tracking-[0.2em] uppercase ${
              hasGeneratedImage ? 'text-oatmeal/75' : 'text-sage'
            }`}
          >
            {echoData.date}
          </p>

          <div
            className={`w-full border-t ${
              hasGeneratedImage ? 'border-oatmeal/30' : 'border-sage/30'
            }`}
          />

          <p
            className={`font-serif text-xl leading-relaxed text-center drop-shadow-sm ${
              hasGeneratedImage ? 'text-oatmeal' : 'text-charcoal/85'
            }`}
          >
            {echoData.originalText || '—'}
          </p>

          <div
            className={`w-full border-b ${
              hasGeneratedImage ? 'border-oatmeal/30' : 'border-sage/30'
            }`}
          />

          <p
            className={`font-mono text-[9px] tracking-widest uppercase ${
              hasGeneratedImage ? 'text-oatmeal/45' : 'text-charcoal/20'
            }`}
          >
            AtomByte LLC · AuraRecall
          </p>
        </div>
      </div>

      {/* Controls sit outside posterRef so they never appear in the exported PNG. */}
      {!isCapturing && (
        <div className="absolute bottom-12 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-5">
          {/* Save Memory button — three states */}
          <motion.button
            whileHover={!saved && !isCapturing ? { scale: 1.03 } : {}}
            whileTap={!saved && !isCapturing ? { scale: 0.97 } : {}}
            onClick={handleExport}
            disabled={isCapturing || saved}
            className={`flex items-center gap-2.5 px-8 py-3 border font-mono text-xs backdrop-blur-sm
                      tracking-[0.22em] uppercase transition-all duration-300
                      ${
                        saved
                          ? hasGeneratedImage
                            ? 'border-oatmeal/60 bg-black/20 text-oatmeal cursor-default'
                            : 'border-charcoal/60 text-charcoal/80 cursor-default'
                          : isCapturing
                            ? 'border-oatmeal/25 text-oatmeal/50 cursor-wait'
                            : hasGeneratedImage
                              ? 'border-oatmeal/45 bg-black/20 text-oatmeal hover:bg-oatmeal hover:text-charcoal'
                              : 'border-charcoal/35 text-charcoal hover:bg-charcoal hover:text-oatmeal'
                      }`}
            style={{
              boxShadow: saved ? `0 0 20px ${echoData.semanticColor}99` : 'none',
              transition: 'box-shadow 0.6s cubic-bezier(0.4,0,0.2,1), border-color 0.3s',
            }}
          >
            {!isCapturing &&
              (saved ? (
                <Check size={13} strokeWidth={1} />
              ) : (
                <Download size={13} strokeWidth={1.5} />
              ))}
            {isCapturing ? 'Saving…' : saved ? 'Memory Saved' : 'Save Memory'}
          </motion.button>

          {/* Close & Return — subtle escape hatch */}
          <button
            onClick={() => onReset?.()}
            className={`font-mono text-[10px] uppercase tracking-widest opacity-45 transition-opacity duration-300 hover:opacity-80 ${
              hasGeneratedImage ? 'text-oatmeal' : 'text-charcoal'
            }`}
          >
            Finish &amp; Return
          </button>
        </div>
      )}
    </div>
  )
}

// ─── SlideCinema (main) ───────────────────────────────────────────────────────

const SLIDE_DURATION = 10_000 // ms per slide

export default function SlideCinema({
  echoData,
  initialSlide = 0,
  onReset,
}: {
  echoData: EchoData
  initialSlide?: number
  onReset?: () => void
}) {
  const [currentSlide, setCurrentSlide] = useState(initialSlide)
  const [isPaused, setIsPaused] = useState(false)
  const [direction, setDirection] = useState(1) // 1 = forward, -1 = backward
  const [isMuted, setIsMuted] = useState(false)
  const isLightSlide = currentSlide === 2

  // Ambient audio — active for the full Cinema phase
  useSonicLandscape(true, echoData.semanticColor, echoData.weather)

  // Sync mute toggle with Tone.Destination
  useEffect(() => {
    import('tone').then(({ getDestination }) => {
      getDestination().mute = isMuted
    })
  }, [isMuted])

  // Auto-advance — single timeout per slide, no stale-closure risk
  useEffect(() => {
    if (currentSlide >= 2 || isPaused) return
    const timer = setTimeout(() => {
      setDirection(1)
      setCurrentSlide((prev) => prev + 1)
    }, SLIDE_DURATION)
    return () => clearTimeout(timer)
  }, [currentSlide, isPaused])

  const goNext = useCallback(() => {
    if (currentSlide < 2) {
      setDirection(1)
      setCurrentSlide((s) => s + 1)
    }
  }, [currentSlide])

  const goPrev = useCallback(() => {
    if (currentSlide > 0) {
      setDirection(-1)
      setCurrentSlide((s) => s - 1)
    }
  }, [currentSlide])

  useEffect(() => {
    function navigateSlides(event: KeyboardEvent) {
      if (event.key === 'ArrowLeft') goPrev()
      if (event.key === 'ArrowRight') goNext()
    }

    window.addEventListener('keydown', navigateSlides)
    return () => window.removeEventListener('keydown', navigateSlides)
  }, [goNext, goPrev])

  return (
    <div className="relative w-full h-full overflow-hidden bg-charcoal select-none">
      {onReset ? (
        <div data-html-to-image-ignore="true" className="absolute left-4 top-6 z-[60] sm:left-6">
          <BackControl
            onClick={onReset}
            label="Close and save"
            tone={isLightSlide ? 'on-light' : 'on-dark'}
            icon="close"
            compactOnMobile
          />
        </div>
      ) : null}

      {/* ── Mute toggle (excluded from PNG) ── */}
      <div data-html-to-image-ignore="true" className="absolute bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMuted((m) => !m)}
          className="opacity-40 hover:opacity-90 transition-opacity duration-300 text-oatmeal"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? (
            <VolumeX size={16} strokeWidth={1.5} />
          ) : (
            <Volume2 size={16} strokeWidth={1.5} />
          )}
        </button>
      </div>

      {/* ── Progress bars (excluded from PNG) ── */}
      <div
        data-html-to-image-ignore="true"
        className="absolute top-0 inset-x-0 z-50 flex gap-[3px] px-4 pt-4 pb-1"
      >
        {[0, 1, 2].map((i) => {
          // Mix-based color: works on both dark (Slides 0-1) and light (Slide 2)
          const trackColor = isLightSlide ? 'rgba(51,51,51,0.18)' : 'rgba(245,240,232,0.3)'
          const fillColor = isLightSlide ? 'rgba(51,51,51,0.55)' : 'rgba(245,240,232,0.9)'

          return (
            <div
              key={i}
              className="flex-1 h-[2px] rounded-full overflow-hidden"
              style={{ backgroundColor: trackColor }}
            >
              {i < currentSlide ? (
                // Past slide — fully filled
                <div className="h-full w-full" style={{ backgroundColor: fillColor }} />
              ) : i === currentSlide ? (
                // Active slide — Framer Motion fills over SLIDE_DURATION; key resets on change
                <motion.div
                  key={currentSlide}
                  className="h-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: SLIDE_DURATION / 1000, ease: 'linear' }}
                  style={{ backgroundColor: fillColor }}
                />
              ) : null}
            </div>
          )
        })}
      </div>

      {/* ── Slide content ── */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentSlide}
          custom={direction}
          variants={slideVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="absolute inset-0"
        >
          {currentSlide === 0 && <Slide1 echoData={echoData} />}
          {currentSlide === 1 && <Slide2 echoData={echoData} isActive={true} />}
          {currentSlide === 2 && <Slide3 echoData={echoData} onReset={onReset} />}
        </motion.div>
      </AnimatePresence>

      {currentSlide > 0 ? (
        <button
          type="button"
          data-html-to-image-ignore="true"
          onClick={goPrev}
          aria-label="Previous slide"
          className={`absolute left-3 top-1/2 z-50 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full backdrop-blur-sm transition-colors focus-visible:outline-none focus-visible:ring-2 sm:left-5 ${
            isLightSlide
              ? 'bg-charcoal/5 text-charcoal/45 hover:bg-charcoal/10 hover:text-charcoal focus-visible:ring-sage/60'
              : 'bg-black/15 text-oatmeal/45 hover:bg-black/30 hover:text-oatmeal focus-visible:ring-sage/70'
          }`}
        >
          <ArrowLeft size={17} strokeWidth={1.5} aria-hidden="true" />
        </button>
      ) : null}

      {currentSlide < 2 ? (
        <button
          type="button"
          data-html-to-image-ignore="true"
          onClick={goNext}
          aria-label="Next slide"
          className="absolute right-3 top-1/2 z-50 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/15 text-oatmeal/45 backdrop-blur-sm transition-colors hover:bg-black/30 hover:text-oatmeal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/70 sm:right-5"
        >
          <ArrowRight size={17} strokeWidth={1.5} aria-hidden="true" />
        </button>
      ) : null}

      {/* ── Navigation zones (invisible tap targets) ── */}

      {/* Left 20% — go back */}
      <div
        className="absolute left-0 top-0 w-[20%] h-full z-40 cursor-pointer"
        onPointerDown={() => setIsPaused(true)}
        onPointerUp={() => {
          setIsPaused(false)
          goPrev()
        }}
        onPointerLeave={() => setIsPaused(false)}
      />

      {/* Right 20% — advance */}
      <div
        className="absolute right-0 top-0 w-[20%] h-full z-40 cursor-pointer"
        onPointerDown={() => setIsPaused(true)}
        onPointerUp={() => {
          setIsPaused(false)
          goNext()
        }}
        onPointerLeave={() => setIsPaused(false)}
      />

      {/* ── Pause indicator ── */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.2 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40
                       pointer-events-none"
          >
            <div
              className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm
                            flex items-center justify-center gap-[3px]"
            >
              <div className="w-[3px] h-4 bg-oatmeal/70 rounded-full" />
              <div className="w-[3px] h-4 bg-oatmeal/70 rounded-full" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
