import { NextResponse } from 'next/server'
import { createWhisperRequestSchema } from '@/features/messaging/contracts'
import { createConversation } from '@/server/messaging/service'
import { requireCurrentAppUser } from '@/server/auth/currentUser'
import { authenticationErrorResponse } from '@/server/auth/errors'

export async function POST(request: Request) {
  const parsed = createWhisperRequestSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid whisper' }, { status: 400 })
  }

  try {
    const currentUser = await requireCurrentAppUser()
    const result = await createConversation(currentUser.id, parsed.data)
    if (result.kind === 'invalid-echo') {
      return NextResponse.json({ error: 'Echo is unavailable for messaging' }, { status: 400 })
    }
    if (result.kind === 'self-whisper') {
      return NextResponse.json({ error: 'You cannot whisper to yourself' }, { status: 400 })
    }
    return NextResponse.json({ conversationId: result.conversation.id }, { status: 201 })
  } catch (error) {
    const response = authenticationErrorResponse(error)
    if (response) return response
    console.error('[whisper] POST failed:', error)
    return NextResponse.json({ error: 'Failed to send whisper' }, { status: 500 })
  }
}
