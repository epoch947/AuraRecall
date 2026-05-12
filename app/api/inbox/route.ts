import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/inbox?userId=[uid] — fetch all conversations for a user
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId?.trim()) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ initiatorId: userId }, { receiverId: userId }],
      },
      include: {
        echo: {
          select: { id: true, color: true, insight: true, weather: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ conversations })
  } catch (err) {
    console.error('[inbox] GET failed:', err)
    return NextResponse.json({ error: 'Failed to fetch inbox' }, { status: 500 })
  }
}
