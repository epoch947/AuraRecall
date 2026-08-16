import { NextResponse } from 'next/server'
import { createWhisperRequestSchema } from '@/features/messaging/contracts'
import { createConversation } from '@/server/messaging/service'

export async function POST(request: Request) {
  const parsed = createWhisperRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid whisper' }, { status: 400 })
  }

  try {
    const result = await createConversation(parsed.data)
    if (result.kind === 'invalid-receiver') {
      return NextResponse.json(
        { error: 'Echo receiver does not match its author' },
        { status: 400 },
      )
    }
    return NextResponse.json({ conversationId: result.conversation.id }, { status: 201 })
  } catch (error) {
    console.error('[whisper] POST failed:', error)
    return NextResponse.json({ error: 'Failed to send whisper' }, { status: 500 })
  }
}
