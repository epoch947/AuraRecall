import type { EchoRecord } from '@/features/journal/store/useRitualStore'

export interface TopographyPoint {
  id: string
  x: number // 0–1, normalized
  y: number // 0–1, normalized
  color: string
  insight: string
  date: string
}

/** Parse any semanticColor string into [h/360, s/100, l/100] */
function parseColor(color: string): [number, number, number] {
  // Handle hsl(h, s%, l%)
  const hslMatch = color.match(/hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)/)
  if (hslMatch) {
    return [
      parseFloat(hslMatch[1]) / 360,
      parseFloat(hslMatch[2]) / 100,
      parseFloat(hslMatch[3]) / 100,
    ]
  }

  // Handle #rrggbb → convert to approximate HSL
  const hexMatch = color.match(/^#([0-9a-fA-F]{6})$/)
  if (hexMatch) {
    const r = parseInt(hexMatch[1].slice(0, 2), 16) / 255
    const g = parseInt(hexMatch[1].slice(2, 4), 16) / 255
    const b = parseInt(hexMatch[1].slice(4, 6), 16) / 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const l = (max + min) / 2
    if (max === min) return [0, 0, l]
    const d = max - min
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    let h = 0
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
    return [h, s, l]
  }

  // Fallback: neutral grey
  return [0, 0, 0.6]
}

export async function computeTopography(echoes: EchoRecord[]): Promise<TopographyPoint[]> {
  // Lazy-import tsne-js so it never runs on the server during static generation
  const TSNE = (await import('tsne-js')).default

  // Deduplicate by ID (guards against persisted store having stale duplicates)
  const seen = new Set<string>()
  const unique = echoes.filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)))

  if (unique.length < 2) return []

  // Sort chronologically (oldest first) for trajectory path
  const sorted = [...unique].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )

  const features = sorted.map((e) => parseColor(e.semanticColor))
  const perplexity = Math.max(2, Math.min(5, sorted.length - 1))

  const model = new TSNE({ epsilon: 10, perplexity, dim: 2 })
  model.init({ data: features, type: 'dense' })
  model.run()
  const raw = model.getOutputScaled()
  const xValues = raw.map(([x]) => x)
  const yValues = raw.map(([, y]) => y)
  const minX = Math.min(...xValues)
  const maxX = Math.max(...xValues)
  const minY = Math.min(...yValues)
  const maxY = Math.max(...yValues)
  const normalize = (value: number, min: number, max: number) =>
    max === min ? 0.5 : (value - min) / (max - min)

  return sorted.map((echo, i) => ({
    id: echo.id,
    x: normalize(raw[i][0], minX, maxX),
    y: normalize(raw[i][1], minY, maxY),
    color: echo.semanticColor,
    insight: echo.insight,
    date: echo.createdAt,
  }))
}
