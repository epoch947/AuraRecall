import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/inbox/[id]?userId= — fetch a single conversation with all messages
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        echo: {
          select: { id: true, color: true, insight: true, weather: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Verify the requester is a participant
    if (userId && conversation.initiatorId !== userId && conversation.receiverId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ conversation })
  } catch (err) {
    console.error('[inbox/[id]] GET failed:', err)
    return NextResponse.json({ error: 'Failed to fetch conversation' }, { status: 500 })
  }
}

// POST /api/inbox/[id] — add a message; accept conversation if it was PENDING
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { senderId, content } = (await req.json()) as {
      senderId: string
      content:  string
    }

    if (!senderId?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'senderId and content are required' }, { status: 400 })
    }

    const conversation = await prisma.conversation.findUnique({ where: { id } })
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }
    if (conversation.initiatorId !== senderId && conversation.receiverId !== senderId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: { conversationId: id, senderId, content },
      }),
      prisma.conversation.update({
        where: { id },
        data: {
          updatedAt: new Date(),
          ...(conversation.status === 'PENDING' ? { status: 'ACCEPTED' } : {}),
        },
      }),
    ])

    return NextResponse.json({ message }, { status: 201 })
  } catch (err) {
    console.error('[inbox/[id]] POST failed:', err)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
