'use client'

import { motion } from 'framer-motion'
import { Archive } from 'lucide-react'
import { useRitualStore } from '@/lib/store/useRitualStore'
import { phaseVariants } from '@/components/RitualContainer'

export default function EntryPhase() {
  const { advanceTo, viewArchive } = useRitualStore()

  return (
    <motion.div
      variants={phaseVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative w-full h-full flex flex-col items-center justify-center"
    >
      {/* Full-screen background video */}
      <video
        src="/assets/1_2.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Gradient veil for legibility */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/50" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 text-center px-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
          className="font-serif text-4xl md:text-5xl text-oatmeal tracking-widest leading-relaxed"
        >
          Listen to your inner pulse
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 1.4, duration: 0.7 }}
          className="font-mono text-xs text-linen tracking-[0.35em] uppercase"
        >
          AuraRecall · a moment of clarity
        </motion.p>

        {/* Begin button with glow */}
        <motion.button
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2.0, duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          whileHover={{
            scale: 1.05,
            boxShadow: '0 0 40px rgba(230,228,224,0.5)',
          }}
          whileTap={{ scale: 0.97 }}
          onClick={() => advanceTo('ZEN_TIMER')}
          className="mt-4 px-12 py-3.5 border border-linen/60 text-linen font-mono
                     text-sm tracking-[0.3em] uppercase
                     hover:bg-linen/10 transition-colors duration-300
                     shadow-[0_0_20px_rgba(230,228,224,0.2)]"
        >
          Begin
        </motion.button>
      </div>

      {/* Archive entry — ghost button, delayed appearance */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.0, duration: 0.8 }}
        onClick={viewArchive}
        className="absolute bottom-10 left-1/2 -translate-x-1/2
                   flex items-center gap-2 font-mono text-[10px]
                   text-oatmeal/40 hover:text-oatmeal/80
                   tracking-[0.35em] uppercase transition-colors duration-500"
      >
        <Archive size={11} strokeWidth={1.5} />
        Memory Archive
      </motion.button>
    </motion.div>
  )
}
