import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// ─── GET — fetch latest 40 echoes for the Resonance Pool ─────────────────────

export async function GET() {
  try {
    const echoes = await prisma.publicEcho.findMany({
      orderBy: { createdAt: 'desc' },
      take: 40,
      select: {
        id:         true,
        color:      true,
        insight:    true,
        weather:    true,
        resonances: true,
        createdAt:  true,
      },
    })
    console.log('[resonance] GET — returned', echoes.length, 'echoes')
    return NextResponse.json({ echoes })
  } catch (err) {
    console.error('[resonance] GET failed:', err)
    return NextResponse.json({ error: 'Failed to fetch pool' }, { status: 500 })
  }
}

// ─── POST — release an echo into the Resonance Pool ──────────────────────────

export async function POST(req: Request) {
  try {
    const { color, insight, weather } = (await req.json()) as {
      color:   string
      insight: string
      weather: string
    }

    // Validation — never store empty insight
    if (!insight?.trim()) {
      return NextResponse.json({ error: 'insight is required' }, { status: 400 })
    }
    if (!color?.trim() || !weather?.trim()) {
      return NextResponse.json({ error: 'color and weather are required' }, { status: 400 })
    }

    const echo = await prisma.publicEcho.create({
      data: { color, insight, weather },
    })

    console.log('[resonance] POST — created echo', echo.id)
    return NextResponse.json({ echo }, { status: 201 })
  } catch (err) {
    console.error('[resonance] POST failed:', err)
    return NextResponse.json({ error: 'Failed to release echo' }, { status: 500 })
  }
}
