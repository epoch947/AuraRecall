import { after, NextResponse } from 'next/server'
import { generateEchoRequestSchema } from '@/features/journal/contracts'
import { createMockEcho, generateEcho, persistPublicEcho } from '@/server/ai/echoService'

export async function POST(request: Request) {
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
          await persistPublicEcho(parsed.data, generated)
        } catch (error) {
          console.error('[generate-echo] pool write failed:', error)
        }
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[generate-echo] OpenAI call failed:', error)
    return NextResponse.json(createMockEcho())
  }
}
