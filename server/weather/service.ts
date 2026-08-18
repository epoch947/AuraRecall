import 'server-only'

import { z } from 'zod'
import type { WeatherData, WeatherLookupRequest } from '@/features/journal/contracts'
import { weatherDataSchema } from '@/features/journal/contracts'
import { describeWeather, roundWeatherCoordinate } from '@/features/journal/lib/weather'

const openMeteoResponseSchema = z.object({
  current: z.object({
    temperature_2m: z.number(),
    apparent_temperature: z.number(),
    weather_code: z.number().int(),
    wind_speed_10m: z.number().nonnegative(),
    is_day: z.union([z.literal(0), z.literal(1)]),
  }),
})

const WEATHER_MOCKS: WeatherData[] = [
  {
    description: 'Soft Autumn Rain',
    code: 'rain',
    temperatureC: 12,
    apparentTemperatureC: 10,
    windSpeedKmh: 18,
    isDay: false,
    observedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    description: 'Still Morning Mist',
    code: 'mist',
    temperatureC: 8,
    apparentTemperatureC: 7,
    windSpeedKmh: 4,
    isDay: true,
    observedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    description: 'Pale Winter Sun',
    code: 'sun',
    temperatureC: 5,
    apparentTemperatureC: 3,
    windSpeedKmh: 9,
    isDay: true,
    observedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    description: 'Grey Overcast',
    code: 'cloud',
    temperatureC: 16,
    apparentTemperatureC: 15,
    windSpeedKmh: 12,
    isDay: true,
    observedAt: '2026-01-01T00:00:00.000Z',
  },
]

export function getMockWeather(): WeatherData {
  const index = Math.floor(Date.now() / 1000) % WEATHER_MOCKS.length
  return { ...WEATHER_MOCKS[index], observedAt: new Date().toISOString() }
}

export async function getCurrentWeather(input: WeatherLookupRequest): Promise<WeatherData> {
  const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast')
  weatherUrl.searchParams.set('latitude', String(roundWeatherCoordinate(input.latitude)))
  weatherUrl.searchParams.set('longitude', String(roundWeatherCoordinate(input.longitude)))
  weatherUrl.searchParams.set(
    'current',
    'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day',
  )
  weatherUrl.searchParams.set('temperature_unit', 'celsius')
  weatherUrl.searchParams.set('wind_speed_unit', 'kmh')
  weatherUrl.searchParams.set('timezone', 'auto')

  const response = await fetch(weatherUrl, { next: { revalidate: 900 } })
  if (!response.ok) {
    throw new Error(`Open-Meteo request failed with status ${response.status}`)
  }

  const parsed = openMeteoResponseSchema.safeParse(await response.json())
  if (!parsed.success) {
    throw new Error('Open-Meteo returned an invalid current-weather response')
  }

  const current = parsed.data.current
  const description = describeWeather(current.weather_code)

  return weatherDataSchema.parse({
    ...description,
    temperatureC: current.temperature_2m,
    apparentTemperatureC: current.apparent_temperature,
    windSpeedKmh: current.wind_speed_10m,
    isDay: current.is_day === 1,
    observedAt: new Date().toISOString(),
  })
}
