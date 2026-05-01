import type * as ToneType from 'tone'

// ── Lazy singleton ──────────────────────────────────────────────────────────

let enginePromise: Promise<AuraEngine> | null = null

interface AuraEngine {
  playLandscape: (color: string, weather: string) => void
  stop: () => void
}

// ── Color → musical scale ───────────────────────────────────────────────────

function parseHue(color: string): number {
  if (color.startsWith('hsl')) {
    const m = color.match(/hsl\((\d+)/)
    return m ? parseInt(m[1]) : 0
  }
  if (color.startsWith('#') && color.length >= 7) {
    const r = parseInt(color.slice(1, 3), 16) / 255
    const g = parseInt(color.slice(3, 5), 16) / 255
    const b = parseInt(color.slice(5, 7), 16) / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    if (max === min) return 0
    const d = max - min
    if (max === r) return (((g - b) / d) % 6) * 60
    if (max === g) return ((b - r) / d + 2) * 60
    return ((r - g) / d + 4) * 60
  }
  return 0
}

function colorToScale(color: string): string[] {
  const hue = parseHue(color)
  // Warm / earthy (yellows, greens) → pentatonic major — calm, open
  if (hue >= 50 && hue < 180) return ['C3', 'D3', 'G3', 'A3', 'C4', 'D4', 'G4']
  // Cool / blue-purple → Dorian minor — introspective
  if (hue >= 180 && hue < 300) return ['D3', 'E3', 'F3', 'A3', 'C4', 'D4', 'F4']
  // Neutral / grey / red → pentatonic minor — heavy, still
  return ['A2', 'C3', 'D3', 'E3', 'G3', 'A3', 'C4']
}

// ── Engine factory ──────────────────────────────────────────────────────────

async function createEngine(): Promise<AuraEngine> {
  const Tone = (await import('tone')) as typeof ToneType

  // Signal chain: instruments → masterVolume → masterReverb → Destination
  const masterReverb = new Tone.Reverb({ decay: 8, wet: 0.6 })
  await masterReverb.ready  // wait for impulse response generation
  masterReverb.toDestination()

  const masterVolume = new Tone.Volume(-10).connect(masterReverb)

  // Pad — PolySynth of FMSynth with extremely slow ADSR
  const padSynth = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 1.5,
    modulationIndex: 2,
    envelope:           { attack: 3, decay: 1,   sustain: 0.7, release: 5 },
    modulationEnvelope: { attack: 2, decay: 0.5, sustain: 0.6, release: 4 },
  }).connect(masterVolume)

  // Texture — pink noise → AutoFilter → volume
  const autoFilter = new Tone.AutoFilter({
    frequency: 0.1,
    baseFrequency: 200,
    octaves: 2,
  }).connect(masterVolume)
  const textureNoise = new Tone.Noise('pink').connect(autoFilter)
  autoFilter.start()

  // Slow BPM so 1m ≈ 4–5 s
  Tone.getTransport().bpm.value = 50

  let padLoop: ToneType.Loop | null = null

  function stop() {
    padLoop?.stop(0)
    padLoop?.dispose()
    padLoop = null
    Tone.getTransport().stop()
    padSynth.releaseAll()
    textureNoise.stop()
  }

  function playLandscape(color: string, weather: string) {
    stop()

    const scale = colorToScale(color)

    padLoop = new Tone.Loop((time) => {
      const note = scale[Math.floor(Math.random() * scale.length)]
      padSynth.triggerAttackRelease(note, '3', time, 0.25 + Math.random() * 0.15)
      // Vary interval 4–6 s for natural, non-rhythmic feel
      if (padLoop) padLoop.interval = `${(4 + Math.random() * 2).toFixed(1)}`
    }, '5')

    padLoop.start(0)

    const w = weather.toLowerCase()
    if (w.includes('rain') || w.includes('storm') || w.includes('wind') || w.includes('mist')) {
      textureNoise.start()
    }

    Tone.getTransport().start()
  }

  return { playLandscape, stop }
}

// ── Public singleton facade ─────────────────────────────────────────────────

export const AuraAudioEngine = {
  playLandscape(color: string, weather: string) {
    if (typeof window === 'undefined') return
    if (!enginePromise) enginePromise = createEngine()
    enginePromise.then((e) => e.playLandscape(color, weather))
  },
  stop() {
    if (typeof window === 'undefined') return
    enginePromise?.then((e) => e.stop())
  },
}
