import { after, NextResponse } from 'next/server'
import { generateEchoRequestSchema } from '@/features/journal/contracts'
import { createMockEcho, generateEcho, persistPublicEcho } from '@/server/ai/echoService'
import { requireCurrentAppUser } from '@/server/auth/currentUser'
import { authenticationErrorResponse } from '@/server/auth/errors'

export async function POST(request: Request) {
  let appUser
  try {
    appUser = await requireCurrentAppUser()
  } catch (error) {
    const response = authenticationErrorResponse(error)
    if (response) return response
    throw error
  }

  if (process.env.USE_MOCK_API === 'true') {
    await new Promise((resolve) => setTimeout(resolve, 4000))
    return NextResponse.json(createMockEcho())
  }

  const parsed = generateEchoRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid journal entry' }, { status: 400 })
  }

  try {
    const { result, generated } = await generateEcho(parsed.data)

    if (parsed.data.isPublic) {
      after(async () => {
        try {
          await persistPublicEcho(parsed.data, generated, appUser.id)
        } catch (error) {
          console.error('[generate-echo] pool write failed:', error)
        }
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[generate-echo] AI generation failed:', error)
    return NextResponse.json(
      {
        error: {
          code: 'AI_GENERATION_UNAVAILABLE',
          message: 'We could not create your visual echo right now. Please try again.',
        },
      },
      { status: 503 },
    )
  }
}
