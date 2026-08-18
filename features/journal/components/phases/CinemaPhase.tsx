'use client'

import { motion } from 'framer-motion'
import { useRitualStore } from '@/features/journal/store/useRitualStore'
import { phaseVariants } from '@/features/journal/components/RitualContainer'
import SlideCinema from '@/features/journal/components/SlideCinema'
import { formatWeatherLabel } from '@/features/journal/lib/weather'

export default function CinemaPhase() {
  const { echoData, moodText, moodColor, weatherData, saveAndReset } = useRitualStore()

  const cinemaData = {
    imageUrl: echoData?.imageUrl ?? null,
    insight: echoData?.insight ?? 'Your moment is held in stillness.',
    originalText: moodText,
    weather: formatWeatherLabel(weatherData),
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
