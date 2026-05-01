'use client'

import { useEffect } from 'react'
import { AuraAudioEngine } from '@/lib/audioEngine'

export function useSonicLandscape(
  isActive: boolean,
  color?: string,
  weather?: string,
) {
  useEffect(() => {
    if (!isActive || !color) {
      AuraAudioEngine.stop()
      return
    }

    let cancelled = false

    async function init() {
      // Tone.start() resumes the AudioContext suspended by browser autoplay policy.
      // SlideCinema is entered via a user click, so this always resolves immediately.
      const Tone = await import('tone')
      await Tone.start()
      if (!cancelled) AuraAudioEngine.playLandscape(color!, weather ?? 'clear')
    }

    init()

    return () => {
      cancelled = true
      AuraAudioEngine.stop()
    }
  }, [isActive, color, weather])
}
