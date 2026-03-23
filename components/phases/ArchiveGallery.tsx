'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useRitualStore, EchoRecord } from '@/lib/store/useRitualStore'
import { phaseVariants } from '@/components/RitualContainer'

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
