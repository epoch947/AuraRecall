import { NextResponse } from 'next/server'
import { anonymousUserIdSchema } from '@/features/messaging/contracts'
import { listConversations } from '@/server/messaging/service'

export async function GET(request: Request) {
  const userId = anonymousUserIdSchema.safeParse(new URL(request.url).searchParams.get('userId'))
  if (!userId.success) {
    return NextResponse.json({ error: 'A valid userId is required' }, { status: 400 })
  }

  try {
    return NextResponse.json({ conversations: await listConversations(userId.data) })
  } catch (error) {
    console.error('[inbox] GET failed:', error)
    return NextResponse.json({ error: 'Failed to fetch inbox' }, { status: 500 })
  }
}
