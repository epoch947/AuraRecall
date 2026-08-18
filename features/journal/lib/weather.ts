import type { WeatherData } from '../contracts'

export type WeatherDescription = Pick<WeatherData, 'description' | 'code'>

export function describeWeather(wmo: number): WeatherDescription {
  if (wmo === 0) return { description: 'Clear Sky', code: 'sun' }
  if (wmo === 1 || wmo === 2) return { description: 'Pale Morning Light', code: 'sun' }
  if (wmo === 3) return { description: 'Grey Overcast', code: 'cloud' }
  if (wmo === 45 || wmo === 48) return { description: 'Still Morning Mist', code: 'mist' }
  if (wmo === 51 || wmo === 53 || wmo === 55) {
    return { description: 'Soft Drizzle', code: 'rain' }
  }
  if (wmo === 56 || wmo === 57 || wmo === 66 || wmo === 67) {
    return { description: 'Light Freezing Rain', code: 'rain' }
  }
  if (wmo === 61) return { description: 'Soft Autumn Rain', code: 'rain' }
  if (wmo === 63) return { description: 'Steady Rain', code: 'rain' }
  if (wmo === 65) return { description: 'Heavy Rain', code: 'rain' }
  if (wmo === 71 || wmo === 73 || wmo === 75 || wmo === 77) {
    return { description: 'Pale Winter Snow', code: 'snow' }
  }
  if (wmo === 80 || wmo === 81 || wmo === 82) {
    return { description: 'Passing Showers', code: 'rain' }
  }
  if (wmo === 85 || wmo === 86) return { description: 'Snow Showers', code: 'snow' }
  if (wmo === 95 || wmo === 96 || wmo === 99) {
    return { description: 'Restless Storm', code: 'storm' }
  }
  return { description: 'Unknown Skies', code: 'unknown' }
}

export function roundWeatherCoordinate(coordinate: number): number {
  const rounded = Math.round(coordinate * 100) / 100
  return Object.is(rounded, -0) ? 0 : rounded
}

export function formatWeatherLabel(weather: WeatherData | null): string {
  if (!weather) return 'Weather not shared'
  return `${Math.round(weather.temperatureC)}°C · ${weather.description}`
}

export function formatWeatherContext(weather: WeatherData | null): string {
  if (!weather) return 'Weather not shared'

  return [
    weather.description,
    `${Math.round(weather.temperatureC)}°C`,
    `feels like ${Math.round(weather.apparentTemperatureC)}°C`,
    `wind ${Math.round(weather.windSpeedKmh)} km/h`,
    weather.isDay ? 'daytime' : 'nighttime',
  ].join('; ')
}
