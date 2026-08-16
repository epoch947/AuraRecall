import { NextResponse } from 'next/server'

import { getCurrentWeather, getMockWeather } from '@/server/weather/service'

export async function GET(request: Request) {
  if (process.env.USE_MOCK_API === 'true') {
    return NextResponse.json(getMockWeather())
  }

  try {
    return NextResponse.json(await getCurrentWeather(request))
  } catch (error) {
    console.error('[weather] lookup failed:', error)
    return NextResponse.json({ description: 'Soft Autumn Rain', code: 'rain' })
  }
}
