'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Moon } from 'lucide-react'
import { useRitualStore, EchoRecord } from '@/lib/store/useRitualStore'
import { phaseVariants } from '@/components/RitualContainer'

interface Pattern {
  title: string
  description: string
}

function MemoryPixel({
  record,
  onHover,
}: {
  record: EchoRecord
  onHover: (r: EchoRecord | null) => void
}) {
  return (
    <motion.div
      className="aspect-square cursor-default"
      style={{ backgroundColor: record.semanticColor }}
      whileHover={{
        scale: 1.08,
        zIndex: 10,
        transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
      }}
      onHoverStart={() => onHover(record)}
      onHoverEnd={() => onHover(null)}
    />
  )
}

export default function ArchiveGallery() {
  const { pastEchoes, advanceTo } = useRitualStore()
  const [hoveredRecord, setHoveredRecord] = useState<EchoRecord | null>(null)
  const [isAnalyzing, setIsAnalyzing]     = useState(false)
  const [patterns, setPatterns]           = useState<Pattern[] | null>(null)

  async function handleAnalyze() {
    setIsAnalyzing(true)
    try {
      const echoes = pastEchoes.map((e) => ({
        text:    e.originalText,
        color:   e.semanticColor,
        weather: e.weather,
        date:    e.createdAt,
      }))
      const res  = await fetch('/api/generate-pattern', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ echoes }),
      })
      const data = (await res.json()) as { patterns?: Pattern[] }
      if (data.patterns) setPatterns(data.patterns)
    } catch (err) {
      console.error('[ArchiveGallery] pattern analysis failed:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <motion.div
      variants={phaseVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative w-full h-full bg-oatmeal overflow-y-auto"
    >
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-oatmeal/90 backdrop-blur-sm px-8 pt-8 pb-4 flex items-center gap-6">
        <button
          onClick={() => advanceTo('ENTRY')}
          className="flex items-center gap-2 font-mono text-[10px] text-charcoal/50
                     hover:text-charcoal tracking-[0.25em] uppercase
                     transition-colors duration-300"
        >
          <ArrowLeft size={12} strokeWidth={1.5} />
          Back to Present
        </button>
        <p className="font-mono text-[10px] text-charcoal/30 tracking-[0.35em] uppercase">
          Aura Topography
        </p>
        {pastEchoes.length >= 5 && (
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="ml-auto flex items-center gap-2 font-mono text-[10px]
                       text-charcoal/50 hover:text-charcoal tracking-[0.25em]
                       uppercase transition-colors duration-300 disabled:pointer-events-none"
          >
            <motion.span
              animate={isAnalyzing ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
              transition={isAnalyzing ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : {}}
            >
              <Moon size={12} strokeWidth={1.5} />
            </motion.span>
            {isAnalyzing ? 'Reading...' : 'Moon Report'}
          </button>
        )}
      </div>

      {/* Mosaic grid */}
      <div className="max-w-5xl mx-auto px-8 py-16">
        {pastEchoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 pt-24 opacity-40">
            <p className="font-serif text-lg text-charcoal">No echoes yet.</p>
            <p className="font-mono text-[10px] text-charcoal tracking-[0.3em] uppercase">
              Begin your first ritual.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1">
            {[...pastEchoes].reverse().map((record) => (
              <MemoryPixel
                key={record.id}
                record={record}
                onHover={setHoveredRecord}
              />
            ))}
          </div>
        )}
      </div>

      {/* Analyzing — loading overlay */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            key="analyzing-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-50 bg-oatmeal/80 backdrop-blur-sm
                       flex items-center justify-center"
          >
            <motion.p
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="font-serif text-lg text-charcoal/50 tracking-widest italic"
            >
              Consulting the echoes…
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Moon Phase Report overlay */}
      <AnimatePresence>
        {patterns && (
          <motion.div
            key="pattern-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-50 bg-charcoal/95 backdrop-blur-md
                       flex flex-col items-center justify-center overflow-y-auto px-8 py-16"
          >
            <p className="font-mono text-[10px] text-oatmeal/30 tracking-[0.35em] uppercase mb-24">
              Subconscious Patterns
            </p>
            <motion.div
              className="flex flex-col items-center gap-24 max-w-2xl w-full"
              initial="hidden"
              animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.45 } } }}
            >
              {patterns.map((pattern, i) => (
                <motion.div
                  key={i}
                  className="flex flex-col gap-4 text-center"
                  variants={{
                    hidden:  { opacity: 0, y: 24 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] } },
                  }}
                >
                  <h2 className="font-serif text-2xl text-oatmeal tracking-widest leading-tight">
                    {pattern.title}
                  </h2>
                  <p className="font-serif text-lg text-oatmeal/70 leading-relaxed max-w-2xl text-center">
                    {pattern.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
            <button
              onClick={() => setPatterns(null)}
              className="mt-24 font-mono text-[10px] text-oatmeal/30 hover:text-oatmeal/70
                         tracking-[0.35em] uppercase transition-colors duration-300"
            >
              Return
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover tooltip — fixed bottom panel */}
      <AnimatePresence>
        {hoveredRecord && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="fixed bottom-0 inset-x-0 z-30 bg-oatmeal/95 backdrop-blur-sm
                       border-t border-sage/20 px-8 py-5 flex items-start gap-6"
          >
            <div
              className="w-4 h-4 rounded-sm flex-shrink-0 mt-0.5"
              style={{ backgroundColor: hoveredRecord.semanticColor }}
            />
            <div className="flex flex-col gap-1">
              <p className="font-mono text-[10px] text-charcoal/50 tracking-[0.25em] uppercase">
                {new Date(hoveredRecord.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              <p className="font-serif text-sm text-charcoal/70 leading-relaxed italic max-w-lg">
                {hoveredRecord.insight}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
