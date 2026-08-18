import { NextResponse } from 'next/server'

import { weatherLookupRequestSchema } from '@/features/journal/contracts'
import { getCurrentWeather, getMockWeather } from '@/server/weather/service'

export async function POST(request: Request) {
  if (process.env.USE_MOCK_API === 'true') {
    return NextResponse.json(getMockWeather())
  }

  const parsed = weatherLookupRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
  }

  try {
    return NextResponse.json(await getCurrentWeather(parsed.data))
  } catch (error) {
    console.error('[weather] provider lookup failed:', {
      name: error instanceof Error ? error.name : 'UnknownError',
    })
    return NextResponse.json(
      {
        error: {
          code: 'WEATHER_UNAVAILABLE',
          message: 'Local weather is unavailable right now. You can continue without it.',
        },
      },
      { status: 503 },
    )
  }
}
