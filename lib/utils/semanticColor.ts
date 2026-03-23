interface HSL { h: number; s: number; l: number }

const MOOD_MAP: Record<string, HSL> = {
  // Calm / peaceful
  calm:      { h: 180, s: 20, l: 75 },
  peace:     { h: 175, s: 18, l: 72 },
  quiet:     { h: 200, s: 15, l: 70 },
  still:     { h: 195, s: 14, l: 73 },
  serene:    { h: 185, s: 20, l: 74 },
  gentle:    { h: 190, s: 16, l: 76 },
  soft:      { h: 188, s: 17, l: 75 },

  // Melancholy / rain
  sad:       { h: 220, s: 25, l: 60 },
  rain:      { h: 210, s: 22, l: 63 },
  grey:      { h: 215, s: 12, l: 65 },
  gray:      { h: 215, s: 12, l: 65 },
  lonely:    { h: 230, s: 20, l: 58 },
  melancholy:{ h: 225, s: 22, l: 57 },
  blue:      { h: 218, s: 24, l: 62 },
  gloomy:    { h: 235, s: 18, l: 55 },

  // Warmth / gratitude
  warm:      { h: 30,  s: 40, l: 75 },
  grateful:  { h: 35,  s: 38, l: 74 },
  love:      { h: 350, s: 35, l: 72 },
  tender:    { h: 15,  s: 32, l: 76 },
  cozy:      { h: 28,  s: 36, l: 73 },
  happy:     { h: 42,  s: 45, l: 74 },
  joy:       { h: 45,  s: 48, l: 72 },
  hopeful:   { h: 38,  s: 38, l: 76 },

  // Anxious / restless
  anxious:   { h: 45,  s: 50, l: 68 },
  restless:  { h: 50,  s: 45, l: 66 },
  energetic: { h: 55,  s: 48, l: 70 },
  busy:      { h: 40,  s: 42, l: 67 },
  stress:    { h: 48,  s: 46, l: 65 },
  nervous:   { h: 43,  s: 44, l: 67 },

  // Dark / heavy
  heavy:     { h: 260, s: 20, l: 50 },
  tired:     { h: 250, s: 15, l: 55 },
  numb:      { h: 240, s: 10, l: 58 },
  exhausted: { h: 255, s: 18, l: 52 },
  dark:      { h: 265, s: 16, l: 48 },
  empty:     { h: 245, s: 12, l: 56 },
}

const DEFAULT: HSL = { h: 43, s: 33, l: 92 }

export function extractMoodColor(text: string): string {
  const words = text.toLowerCase().match(/\b\w+\b/g) ?? []
  const matches = words.map((w) => MOOD_MAP[w]).filter(Boolean) as HSL[]

  if (matches.length === 0) {
    return `hsl(${DEFAULT.h}, ${DEFAULT.s}%, ${DEFAULT.l}%)`
  }

  const sum = matches.reduce(
    (acc, m) => ({ h: acc.h + m.h, s: acc.s + m.s, l: acc.l + m.l }),
    { h: 0, s: 0, l: 0 }
  )

  const h = Math.round(sum.h / matches.length)
  const s = Math.round(sum.s / matches.length)
  const l = Math.round(sum.l / matches.length)

  return `hsl(${h}, ${s}%, ${l}%)`
}
