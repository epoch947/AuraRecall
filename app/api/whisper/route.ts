import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// POST /api/whisper — initiate a new anonymous whisper conversation
export async function POST(req: Request) {
  try {
    const { echoId, initiatorId, receiverId, content } = (await req.json()) as {
      echoId:      string
      initiatorId: string
      receiverId:  string
      content:     string
    }

    if (!echoId?.trim() || !initiatorId?.trim() || !receiverId?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'echoId, initiatorId, receiverId, and content are required' }, { status: 400 })
    }

    // Prevent whispering to yourself
    if (initiatorId === receiverId) {
      return NextResponse.json({ error: 'You cannot whisper to yourself' }, { status: 400 })
    }

    // Create conversation + first message in a transaction
    const conversation = await prisma.$transaction(async (tx) => {
      const conv = await tx.conversation.create({
        data: { echoId, initiatorId, receiverId, status: 'PENDING' },
      })
      await tx.message.create({
        data: { conversationId: conv.id, senderId: initiatorId, content },
      })
      return conv
    })

    console.log('[whisper] POST — created conversation', conversation.id)
    return NextResponse.json({ conversationId: conversation.id }, { status: 201 })
  } catch (err) {
    console.error('[whisper] POST failed:', err)
    return NextResponse.json({ error: 'Failed to send whisper' }, { status: 500 })
  }
}
