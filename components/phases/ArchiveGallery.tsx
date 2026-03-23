'use client'

import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useRitualStore, EchoRecord } from '@/lib/store/useRitualStore'
import { phaseVariants } from '@/components/RitualContainer'

const FUWARI = [0.4, 0, 0.2, 1] as const

function EchoCard({ record }: { record: EchoRecord }) {
  const date = new Date(record.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <motion.div
      whileHover={{ y: -4, transition: { duration: 0.3, ease: FUWARI } }}
      className="relative overflow-hidden cursor-default"
    >
      {/* Tint layer */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: record.semanticColor, opacity: 0.15 }}
      />
      {/* Content */}
      <div className="relative z-10 p-6 flex flex-col gap-3">
        <p className="font-mono text-[10px] text-charcoal/50 tracking-[0.25em] uppercase">
          {date}
        </p>
        <p className="font-serif text-sm text-charcoal/80 leading-relaxed line-clamp-2">
          {record.originalText || '—'}
        </p>
        <p className="font-mono text-[9px] text-charcoal/35 tracking-widest uppercase mt-1">
          {record.weather}
        </p>
      </div>
    </motion.div>
  )
}

export default function ArchiveGallery() {
  const { pastEchoes, advanceTo } = useRitualStore()

  return (
    <motion.div
      variants={phaseVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative w-full h-full bg-oatmeal overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-oatmeal/90 backdrop-blur-sm px-8 pt-8 pb-4 flex items-center gap-6">
        <button
          onClick={() => advanceTo('ENTRY')}
          className="flex items-center gap-2 font-mono text-[10px] text-charcoal/50
                     hover:text-charcoal tracking-[0.25em] uppercase
                     transition-colors duration-300"
        >
          <ArrowLeft size={12} strokeWidth={1.5} />
          Back
        </button>
        <p className="font-mono text-[10px] text-charcoal/30 tracking-[0.35em] uppercase">
          Your Echoes
        </p>
      </div>

      {/* Grid */}
      <div className="px-8 pb-16 pt-4">
        {pastEchoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 pt-24 opacity-40">
            <p className="font-serif text-lg text-charcoal">No echoes yet.</p>
            <p className="font-mono text-[10px] text-charcoal tracking-[0.3em] uppercase">
              Begin your first ritual.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[...pastEchoes].reverse().map((record) => (
              <EchoCard key={record.id} record={record} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
