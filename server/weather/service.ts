import 'server-only'

import type { WeatherData } from '@/features/journal/contracts'
import { describeWeather } from '@/features/journal/lib/weather'

const WEATHER_MOCKS: WeatherData[] = [
  { description: 'Soft Autumn Rain', code: 'rain' },
  { description: 'Still Morning Mist', code: 'mist' },
  { description: 'Pale Winter Sun', code: 'sun' },
  { description: 'Grey Overcast', code: 'cloud' },
]

export function getMockWeather(): WeatherData {
  const index = Math.floor(Date.now() / 1000) % WEATHER_MOCKS.length
  return WEATHER_MOCKS[index]
}

export async function getCurrentWeather(request: Request): Promise<WeatherData> {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : null
  const geoUrl = ip ? `https://ipwho.is/${ip}` : 'https://ipwho.is/'

  const geoResponse = await fetch(geoUrl, { next: { revalidate: 3600 } })
  const geo = (await geoResponse.json()) as {
    latitude?: number
    longitude?: number
    success?: boolean
  }

  const latitude = geo.success !== false && geo.latitude ? geo.latitude : 35.6762
  const longitude = geo.success !== false && geo.longitude ? geo.longitude : 139.6503
  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}` +
    `&longitude=${longitude}&current=weather_code&timezone=auto`

  const weatherResponse = await fetch(weatherUrl, { next: { revalidate: 1800 } })
  const weather = (await weatherResponse.json()) as { current?: { weather_code?: number } }

  return describeWeather(weather.current?.weather_code ?? 0)
}
