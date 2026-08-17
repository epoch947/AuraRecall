import { NextResponse } from 'next/server'
import { listConversations } from '@/server/messaging/service'
import { requireCurrentAppUser } from '@/server/auth/currentUser'
import { authenticationErrorResponse } from '@/server/auth/errors'

export async function GET() {
  try {
    const currentUser = await requireCurrentAppUser()
    return NextResponse.json({ conversations: await listConversations(currentUser.id) })
  } catch (error) {
    const response = authenticationErrorResponse(error)
    if (response) return response
    console.error('[inbox] GET failed:', error)
    return NextResponse.json({ error: 'Failed to fetch inbox' }, { status: 500 })
  }
}
