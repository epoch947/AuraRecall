import { NextResponse } from 'next/server'

const WEATHER_MOCKS = [
  { description: 'Soft Autumn Rain',   code: 'rain'  },
  { description: 'Still Morning Mist', code: 'mist'  },
  { description: 'Pale Winter Sun',    code: 'sun'   },
  { description: 'Grey Overcast',      code: 'cloud' },
]

export async function GET() {
  const useMock = process.env.USE_MOCK_API === 'true'

  if (useMock) {
    await new Promise((resolve) => setTimeout(resolve, 4000))
    const index = Math.floor(Date.now() / 1000) % WEATHER_MOCKS.length
    return NextResponse.json(WEATHER_MOCKS[index])
  }

  // Production path — integrate real weather API here
  return NextResponse.json({ description: 'Unknown Skies', code: 'unknown' })
}
