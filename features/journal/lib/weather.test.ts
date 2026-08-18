import { describe, expect, it } from 'vitest'

import type { WeatherData } from '../contracts'
import {
  describeWeather,
  formatWeatherContext,
  formatWeatherLabel,
  roundWeatherCoordinate,
} from './weather'

describe('describeWeather', () => {
  it.each([
    [0, { description: 'Clear Sky', code: 'sun' }],
    [3, { description: 'Grey Overcast', code: 'cloud' }],
    [48, { description: 'Still Morning Mist', code: 'mist' }],
    [65, { description: 'Heavy Rain', code: 'rain' }],
    [67, { description: 'Light Freezing Rain', code: 'rain' }],
    [77, { description: 'Pale Winter Snow', code: 'snow' }],
    [95, { description: 'Restless Storm', code: 'storm' }],
    [100, { description: 'Unknown Skies', code: 'unknown' }],
  ])('maps WMO code %i', (code, expected) => {
    expect(describeWeather(code)).toEqual(expected)
  })

  it('rounds coordinates to city-level precision', () => {
    expect(roundWeatherCoordinate(40.712776)).toBe(40.71)
    expect(roundWeatherCoordinate(-74.005974)).toBe(-74.01)
    expect(roundWeatherCoordinate(-0.0001)).toBe(0)
  })

  it('formats a location-free weather label and prompt context', () => {
    const weather: WeatherData = {
      description: 'Soft Drizzle',
      code: 'rain',
      temperatureC: 12.4,
      apparentTemperatureC: 10.2,
      windSpeedKmh: 17.8,
      isDay: false,
      observedAt: '2026-08-18T03:00:00.000Z',
    }

    expect(formatWeatherLabel(weather)).toBe('12°C · Soft Drizzle')
    expect(formatWeatherContext(weather)).toBe(
      'Soft Drizzle; 12°C; feels like 10°C; wind 18 km/h; nighttime',
    )
    expect(formatWeatherContext(null)).toBe('Weather not shared')
  })
})
