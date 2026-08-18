import { NextResponse } from 'next/server'
import { releaseEchoRequestSchema } from '@/features/resonance/contracts'
import { listLatestEchoes, releaseEcho } from '@/server/resonance/service'
import { getOptionalCurrentAppUser, requireCurrentAppUser } from '@/server/auth/currentUser'
import { authenticationErrorResponse } from '@/server/auth/errors'

export async function GET() {
  try {
    const currentUser = await getOptionalCurrentAppUser()
    return NextResponse.json({ echoes: await listLatestEchoes(currentUser?.id ?? null) })
  } catch (error) {
    const response = authenticationErrorResponse(error)
    if (response) return response
    console.error('[resonance] GET failed:', error)
    return NextResponse.json({ error: 'Failed to fetch pool' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  let currentUser
  try {
    currentUser = await requireCurrentAppUser()
  } catch (error) {
    const response = authenticationErrorResponse(error)
    if (response) return response
    throw error
  }

  const parsed = releaseEchoRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid echo' }, { status: 400 })
  }

  try {
    const echo = await releaseEcho(parsed.data, currentUser.id)
    return NextResponse.json(
      {
        echo: {
          id: echo.id,
          color: echo.color,
          insight: echo.insight,
          weather: echo.weather,
          resonances: echo.resonances,
          createdAt: echo.createdAt,
          canWhisper: true,
          isOwn: true,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('[resonance] POST failed:', error)
    return NextResponse.json({ error: 'Failed to release echo' }, { status: 500 })
  }
}
