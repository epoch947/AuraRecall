import { NextRequest, NextResponse } from 'next/server'

// ─── Mock data ────────────────────────────────────────────────────────────────

const WEATHER_MOCKS = [
  { description: 'Soft Autumn Rain',   code: 'rain'  },
  { description: 'Still Morning Mist', code: 'mist'  },
  { description: 'Pale Winter Sun',    code: 'sun'   },
  { description: 'Grey Overcast',      code: 'cloud' },
]

// ─── WMO weather code → poetic description ───────────────────────────────────

function describeWeather(wmo: number): { description: string; code: string } {
  if (wmo === 0)                        return { description: 'Clear Sky',          code: 'sun'   }
  if (wmo <= 2)                         return { description: 'Pale Morning Light', code: 'sun'   }
  if (wmo === 3)                        return { description: 'Grey Overcast',      code: 'cloud' }
  if (wmo <= 48)                        return { description: 'Still Morning Mist', code: 'mist'  }
  if (wmo <= 55)                        return { description: 'Soft Drizzle',       code: 'rain'  }
  if (wmo <= 57)                        return { description: 'Light Freezing Rain', code: 'rain' }
  if (wmo <= 61)                        return { description: 'Soft Autumn Rain',   code: 'rain'  }
  if (wmo <= 63)                        return { description: 'Steady Rain',        code: 'rain'  }
  if (wmo <= 65)                        return { description: 'Heavy Rain',         code: 'rain'  }
  if (wmo <= 77)                        return { description: 'Pale Winter Snow',   code: 'snow'  }
  if (wmo <= 82)                        return { description: 'Passing Showers',    code: 'rain'  }
  if (wmo <= 86)                        return { description: 'Snow Showers',       code: 'snow'  }
  return                                       { description: 'Restless Storm',     code: 'storm' }
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  if (process.env.USE_MOCK_API === 'true') {
    const index = Math.floor(Date.now() / 1000) % WEATHER_MOCKS.length
    return NextResponse.json(WEATHER_MOCKS[index])
  }

  try {
    // Step 1: Resolve coordinates from client IP
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : null
    const geoUrl = ip ? `https://ipwho.is/${ip}` : 'https://ipwho.is/'

    const geoRes = await fetch(geoUrl, { next: { revalidate: 3600 } })
    const geo = await geoRes.json() as { latitude?: number; longitude?: number; success?: boolean }

    // Fallback coords (Tokyo) if geolocation fails
    const lat = geo.success !== false && geo.latitude  ? geo.latitude  : 35.6762
    const lon = geo.success !== false && geo.longitude ? geo.longitude : 139.6503

    // Step 2: Fetch current weather from Open-Meteo (free, no key)
    const omUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code&timezone=auto`
    const omRes = await fetch(omUrl, { next: { revalidate: 1800 } })
    const om = await omRes.json() as { current?: { weather_code?: number } }

    const wmo = om.current?.weather_code ?? 0
    return NextResponse.json(describeWeather(wmo))
  } catch (err) {
    console.error('[weather] lookup failed:', err)
    return NextResponse.json({ description: 'Soft Autumn Rain', code: 'rain' })
  }
}
