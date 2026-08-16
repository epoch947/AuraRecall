import { NextResponse } from 'next/server'
import {
  anonymousUserIdSchema,
  replyRequestSchema,
  resourceIdSchema,
} from '@/features/messaging/contracts'
import { getConversation, replyToConversation } from '@/server/messaging/service'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteContext) {
  const conversationId = resourceIdSchema.safeParse((await params).id)
  const userId = anonymousUserIdSchema.safeParse(new URL(request.url).searchParams.get('userId'))
  if (!conversationId.success || !userId.success) {
    return NextResponse.json(
      { error: 'A valid conversation id and userId are required' },
      { status: 400 },
    )
  }

  try {
    const result = await getConversation(conversationId.data, userId.data)
    if (result.kind === 'not-found') {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }
    if (result.kind === 'forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ conversation: result.conversation })
  } catch (error) {
    console.error('[inbox/[id]] GET failed:', error)
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const conversationId = resourceIdSchema.safeParse((await params).id)
  const input = replyRequestSchema.safeParse(await request.json().catch(() => null))
  if (!conversationId.success || !input.success) {
    return NextResponse.json({ error: 'Invalid reply' }, { status: 400 })
  }

  try {
    const result = await replyToConversation(conversationId.data, input.data)
    if (result.kind === 'not-found') {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }
    if (result.kind === 'forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ message: result.message }, { status: 201 })
  } catch (error) {
    console.error('[inbox/[id]] POST failed:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
