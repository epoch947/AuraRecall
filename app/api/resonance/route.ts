import { NextResponse } from 'next/server'
import { releaseEchoRequestSchema } from '@/features/resonance/contracts'
import { listLatestEchoes, releaseEcho } from '@/server/resonance/service'

export async function GET() {
  try {
    return NextResponse.json({ echoes: await listLatestEchoes() })
  } catch (error) {
    console.error('[resonance] GET failed:', error)
    return NextResponse.json({ error: 'Failed to fetch pool' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const parsed = releaseEchoRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid echo' }, { status: 400 })
  }

  try {
    return NextResponse.json({ echo: await releaseEcho(parsed.data) }, { status: 201 })
  } catch (error) {
    console.error('[resonance] POST failed:', error)
    return NextResponse.json({ error: 'Failed to release echo' }, { status: 500 })
  }
}
