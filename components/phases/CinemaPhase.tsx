'use client'

import { motion } from 'framer-motion'
import { useRitualStore } from '@/lib/store/useRitualStore'
import { phaseVariants } from '@/components/RitualContainer'
import SlideCinema from '@/components/SlideCinema'

export default function CinemaPhase() {
  const { echoData, moodText, moodColor, weatherData, saveAndReset } = useRitualStore()

  const cinemaData = {
    imageUrl:      echoData?.imageUrl ?? null,
    insight:       echoData?.insight ?? 'Your moment is held in stillness.',
    originalText:  moodText,
    weather:       weatherData?.description ?? 'Unknown Skies',
    semanticColor: moodColor,
    date: new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  }

  return (
    <motion.div
      variants={phaseVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative w-full h-full"
    >
      <SlideCinema echoData={cinemaData} onReset={saveAndReset} />
    </motion.div>
  )
}
