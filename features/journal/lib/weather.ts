import type { WeatherData } from '../contracts'

export function describeWeather(wmo: number): WeatherData {
  if (wmo === 0) return { description: 'Clear Sky', code: 'sun' }
  if (wmo <= 2) return { description: 'Pale Morning Light', code: 'sun' }
  if (wmo === 3) return { description: 'Grey Overcast', code: 'cloud' }
  if (wmo <= 48) return { description: 'Still Morning Mist', code: 'mist' }
  if (wmo <= 55) return { description: 'Soft Drizzle', code: 'rain' }
  if (wmo <= 57) return { description: 'Light Freezing Rain', code: 'rain' }
  if (wmo <= 61) return { description: 'Soft Autumn Rain', code: 'rain' }
  if (wmo <= 63) return { description: 'Steady Rain', code: 'rain' }
  if (wmo <= 65) return { description: 'Heavy Rain', code: 'rain' }
  if (wmo <= 77) return { description: 'Pale Winter Snow', code: 'snow' }
  if (wmo <= 82) return { description: 'Passing Showers', code: 'rain' }
  if (wmo <= 86) return { description: 'Snow Showers', code: 'snow' }
  return { description: 'Restless Storm', code: 'storm' }
}
