import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

let useRitualStore: (typeof import('./useRitualStore'))['useRitualStore']

beforeAll(async () => {
  const entries = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    get length() {
      return entries.size
    },
    clear: () => entries.clear(),
    getItem: (key: string) => entries.get(key) ?? null,
    key: (index: number) => [...entries.keys()][index] ?? null,
    removeItem: (key: string) => entries.delete(key),
    setItem: (key: string, value: string) => entries.set(key, value),
  } satisfies Storage)
  const storeModule = await import('./useRitualStore')
  useRitualStore = storeModule.useRitualStore
})

afterAll(() => vi.unstubAllGlobals())

const weather = {
  description: 'Soft Drizzle',
  code: 'rain' as const,
  temperatureC: 12,
  apparentTemperatureC: 10,
  windSpeedKmh: 18,
  isDay: false,
  observedAt: '2026-08-18T03:00:00.000Z',
}

const echo = {
  imageUrl: 'https://example.com/echo.png',
  insight: 'What would you carry forward?',
  semanticColor: '#8A9A7B',
}

describe('ritual navigation', () => {
  beforeEach(() => {
    useRitualStore.setState({
      phase: 'SAMPLING',
      moodText: 'A draft that should remain intact.',
      moodColor: 'hsl(185, 20%, 74%)',
      weatherData: weather,
      echoData: echo,
      zenCompleted: true,
    })
  })

  it('leaves the ritual without discarding the current draft', () => {
    useRitualStore.getState().leaveRitual()

    const state = useRitualStore.getState()
    expect(state.phase).toBe('ENTRY')
    expect(state.moodText).toBe('A draft that should remain intact.')
    expect(state.weatherData).toEqual(weather)
    expect(state.zenCompleted).toBe(true)
  })

  it('returns from a failed generation to writing without stale echo data', () => {
    useRitualStore.setState({ phase: 'VIZ_LAB' })
    useRitualStore.getState().returnToWriting()

    const state = useRitualStore.getState()
    expect(state.phase).toBe('SAMPLING')
    expect(state.moodText).toBe('A draft that should remain intact.')
    expect(state.weatherData).toEqual(weather)
    expect(state.echoData).toBeNull()
  })
})
