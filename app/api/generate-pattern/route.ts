import { NextResponse } from 'next/server'
import { generatePatternsRequestSchema } from '@/features/journal/contracts'
import { createMockPatterns, generatePatterns } from '@/server/ai/patternService'

export async function POST(request: Request) {
  if (process.env.USE_MOCK_API === 'true') {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    return NextResponse.json(createMockPatterns())
  }

  const parsed = generatePatternsRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid journal history' }, { status: 400 })
  }

  try {
    return NextResponse.json(await generatePatterns(parsed.data.echoes))
  } catch (error) {
    console.error('[generate-pattern] OpenAI call failed:', error)
    return NextResponse.json({ error: 'Pattern recognition failed' }, { status: 500 })
  }
}
