import { verifyWebhook } from '@clerk/nextjs/webhooks'
import type { UserJSON } from '@clerk/nextjs/server'
import type { NextRequest } from 'next/server'
import { withTransaction } from '@/server/db/pool'
import {
  claimAuthWebhookEvent,
  recordAuthenticatedUserLogin,
  softDeleteUserByAuthIdentity,
  upsertAuthenticatedUser,
} from '@/server/db/repositories/userRepository'

function authenticatedUserInput(user: UserJSON, lastLoginAt: Date | null) {
  const primaryEmail = user.email_addresses.find(
    (email) => email.id === user.primary_email_address_id,
  )
  const displayName =
    [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || user.username || null

  return {
    authProvider: 'clerk' as const,
    authSubject: user.id,
    email: primaryEmail?.email_address.toLowerCase() ?? null,
    emailVerifiedAt: primaryEmail?.verification?.status === 'verified' ? new Date() : null,
    username: user.username ?? null,
    displayName,
    avatarUrl: user.image_url || null,
    lastLoginAt,
  }
}

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
        await upsertAuthenticatedUser(
          authenticatedUserInput(
            event.data,
            event.data.last_sign_in_at === null ? null : new Date(event.data.last_sign_in_at),
          ),
          transaction,
        )
      }

      if (event.type === 'session.created') {
        const lastLoginAt = new Date(event.data.created_at)
        if (event.data.user) {
          await upsertAuthenticatedUser(
            authenticatedUserInput(event.data.user, lastLoginAt),
            transaction,
          )
        } else {
          await recordAuthenticatedUserLogin('clerk', event.data.user_id, lastLoginAt, transaction)
        }
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
