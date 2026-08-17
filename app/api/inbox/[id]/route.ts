import { NextResponse } from 'next/server'
import { replyRequestSchema, resourceIdSchema } from '@/features/messaging/contracts'
import { getConversation, replyToConversation } from '@/server/messaging/service'
import { requireCurrentAppUser } from '@/server/auth/currentUser'
import { authenticationErrorResponse } from '@/server/auth/errors'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: RouteContext) {
  const conversationId = resourceIdSchema.safeParse((await params).id)
  if (!conversationId.success) {
    return NextResponse.json({ error: 'A valid conversation id is required' }, { status: 400 })
  }

  try {
    const currentUser = await requireCurrentAppUser()
    const result = await getConversation(conversationId.data, currentUser.id)
    if (result.kind === 'not-found') {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }
    if (result.kind === 'forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ conversation: result.conversation })
  } catch (error) {
    const response = authenticationErrorResponse(error)
    if (response) return response
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
    const currentUser = await requireCurrentAppUser()
    const result = await replyToConversation(conversationId.data, currentUser.id, input.data)
    if (result.kind === 'not-found') {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }
    if (result.kind === 'forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.json({ message: result.message }, { status: 201 })
  } catch (error) {
    const response = authenticationErrorResponse(error)
    if (response) return response
    console.error('[inbox/[id]] POST failed:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
