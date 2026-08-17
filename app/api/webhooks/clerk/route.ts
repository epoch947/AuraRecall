import { verifyWebhook } from '@clerk/nextjs/webhooks'
import type { NextRequest } from 'next/server'
import { withTransaction } from '@/server/db/pool'
import {
  claimAuthWebhookEvent,
  softDeleteUserByAuthIdentity,
  upsertAuthenticatedUser,
} from '@/server/db/repositories/userRepository'

export async function POST(request: NextRequest) {
  let event
  try {
    event = await verifyWebhook(request)
  } catch (error) {
    console.error('[clerk-webhook] signature verification failed:', error)
    return Response.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  const eventId = request.headers.get('svix-id')
  if (!eventId) {
    return Response.json({ error: 'Missing webhook event id' }, { status: 400 })
  }

  try {
    await withTransaction(async (transaction) => {
      const claimed = await claimAuthWebhookEvent(eventId, event.type, transaction)
      if (!claimed) return

      if (event.type === 'user.created' || event.type === 'user.updated') {
        const primaryEmail = event.data.email_addresses.find(
          (email) => email.id === event.data.primary_email_address_id,
        )
        const displayName =
          [event.data.first_name, event.data.last_name].filter(Boolean).join(' ').trim() ||
          event.data.username ||
          null

        await upsertAuthenticatedUser(
          {
            authProvider: 'clerk',
            authSubject: event.data.id,
            email: primaryEmail?.email_address.toLowerCase() ?? null,
            emailVerifiedAt: primaryEmail?.verification?.status === 'verified' ? new Date() : null,
            username: event.data.username ?? null,
            displayName,
            avatarUrl: event.data.image_url || null,
            lastLoginAt:
              event.data.last_sign_in_at === null ? null : new Date(event.data.last_sign_in_at),
          },
          transaction,
        )
      }

      if (event.type === 'user.deleted' && event.data.id) {
        await softDeleteUserByAuthIdentity('clerk', event.data.id, transaction)
      }
    })

    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('[clerk-webhook] processing failed:', error)
    return Response.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
