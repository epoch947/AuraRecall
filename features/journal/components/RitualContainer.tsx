'use client'

import { AnimatePresence } from 'framer-motion'
import { useRitualStore } from '@/features/journal/store/useRitualStore'
import EntryPhase from '@/features/journal/components/phases/EntryPhase'
import ZenTimerPhase from '@/features/journal/components/phases/ZenTimerPhase'
import SamplingPhase from '@/features/journal/components/phases/SamplingPhase'
import VizLabPhase from '@/features/journal/components/phases/VizLabPhase'
import CinemaPhase from '@/features/journal/components/phases/CinemaPhase'
import ArchiveGallery from '@/features/journal/components/phases/ArchiveGallery'

export const phaseVariants = {
  initial: {
    opacity: 0,
    y: 20,
    filter: 'blur(4px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    filter: 'blur(4px)',
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
    },
  },
}

export default function RitualContainer() {
  const phase = useRitualStore((s) => s.phase)

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-oatmeal">
      <AnimatePresence mode="wait">
        {phase === 'ENTRY' && <EntryPhase key="entry" />}
        {phase === 'ZEN_TIMER' && <ZenTimerPhase key="zen" />}
        {phase === 'SAMPLING' && <SamplingPhase key="sampling" />}
        {phase === 'VIZ_LAB' && <VizLabPhase key="vizlab" />}
        {phase === 'CINEMA' && <CinemaPhase key="cinema" />}
        {phase === 'ARCHIVE_GALLERY' && <ArchiveGallery key="archive" />}
      </AnimatePresence>
    </div>
  )
}
