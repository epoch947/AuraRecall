import 'server-only'

import { auth, currentUser } from '@clerk/nextjs/server'
import type { UserRecord } from '@/server/db/models'
import {
  findUserByAuthIdentity,
  upsertAuthenticatedUser,
} from '@/server/db/repositories/userRepository'
import { AccountUnavailableError, AuthenticationRequiredError } from './errors'

function optionalDate(timestamp: number | null): Date | null {
  return timestamp === null ? null : new Date(timestamp)
}

export async function getOptionalCurrentAppUser(): Promise<UserRecord | null> {
  const { userId } = await auth()
  if (!userId) return null

  let appUser = await findUserByAuthIdentity('clerk', userId)

  if (!appUser) {
    const clerkUser = await currentUser()
    if (!clerkUser) throw new AuthenticationRequiredError()

    const primaryEmail = clerkUser.primaryEmailAddress
    const displayName =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ').trim() ||
      clerkUser.username ||
      null

    appUser = await upsertAuthenticatedUser({
      authProvider: 'clerk',
      authSubject: clerkUser.id,
      email: primaryEmail?.emailAddress.toLowerCase() ?? null,
      emailVerifiedAt: primaryEmail?.verification?.status === 'verified' ? new Date() : null,
      username: clerkUser.username ?? null,
      displayName,
      avatarUrl: clerkUser.imageUrl || null,
      lastLoginAt: optionalDate(clerkUser.lastSignInAt),
    })
  }

  if (appUser.accountType !== 'REGISTERED' || appUser.status !== 'ACTIVE') {
    throw new AccountUnavailableError()
  }

  return appUser
}

export async function requireCurrentAppUser(): Promise<UserRecord> {
  const user = await getOptionalCurrentAppUser()
  if (!user) throw new AuthenticationRequiredError()
  return user
}
