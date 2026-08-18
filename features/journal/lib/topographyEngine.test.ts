import { describe, expect, it } from 'vitest'

import { computeTopography } from './topographyEngine'
import type { EchoRecord } from '@/features/journal/store/useRitualStore'

const echoes: EchoRecord[] = [
  {
    id: 'echo-1',
    originalText: 'First',
    semanticColor: '#336699',
    weather: 'Clear Sky',
    insight: 'First insight',
    imageUrl: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'echo-2',
    originalText: 'Second',
    semanticColor: 'hsl(120, 40%, 50%)',
    weather: 'Cloudy',
    insight: 'Second insight',
    imageUrl: null,
    createdAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'echo-3',
    originalText: 'Third',
    semanticColor: '#AA7755',
    weather: 'Rain',
    insight: 'Third insight',
    imageUrl: null,
    createdAt: '2026-01-03T00:00:00.000Z',
  },
]

describe('topography engine', () => {
  it('keeps the browser t-SNE pipeline operational with patched dependencies', async () => {
    const points = await computeTopography(echoes)

    expect(points).toHaveLength(3)
    for (const point of points) {
      expect(Number.isFinite(point.x)).toBe(true)
      expect(Number.isFinite(point.y)).toBe(true)
      expect(point.x).toBeGreaterThanOrEqual(0)
      expect(point.x).toBeLessThanOrEqual(1)
      expect(point.y).toBeGreaterThanOrEqual(0)
      expect(point.y).toBeLessThanOrEqual(1)
    }
  })
})
