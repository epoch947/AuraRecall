import 'server-only'

import { getPool } from '@/server/db/pool'
import {
  toIsoString,
  type DatabaseExecutor,
  type UserAccountType,
  type UserRecord,
  type UserRole,
  type UserStatus,
} from '@/server/db/models'

interface UserRow {
  id: string
  auth_provider: string
  auth_subject: string
  account_type: UserAccountType
  email: string | null
  email_verified_at: Date | null
  username: string | null
  display_name: string | null
  avatar_url: string | null
  role: UserRole
  status: UserStatus
  created_at: Date
  updated_at: Date
  last_login_at: Date | null
  deleted_at: Date | null
}

export interface SyncAuthenticatedUserInput {
  authProvider: 'clerk'
  authSubject: string
  email: string | null
  emailVerifiedAt: Date | null
  username: string | null
  displayName: string | null
  avatarUrl: string | null
  lastLoginAt: Date | null
}

function mapUser(row: UserRow): UserRecord {
  return {
    id: row.id,
    authProvider: row.auth_provider,
    authSubject: row.auth_subject,
    accountType: row.account_type,
    email: row.email,
    emailVerifiedAt: row.email_verified_at ? toIsoString(row.email_verified_at) : null,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    role: row.role,
    status: row.status,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
    lastLoginAt: row.last_login_at ? toIsoString(row.last_login_at) : null,
    deletedAt: row.deleted_at ? toIsoString(row.deleted_at) : null,
  }
}

const userColumns = `
  id,
  auth_provider,
  auth_subject,
  account_type,
  email,
  email_verified_at,
  username,
  display_name,
  avatar_url,
  role,
  status,
  created_at,
  updated_at,
  last_login_at,
  deleted_at
`

export async function findUserByAuthIdentity(
  authProvider: string,
  authSubject: string,
  database: DatabaseExecutor = getPool(),
): Promise<UserRecord | null> {
  const result = await database.query<UserRow>(
    `
      SELECT ${userColumns}
      FROM users
      WHERE auth_provider = $1 AND auth_subject = $2
    `,
    [authProvider, authSubject],
  )
  return result.rows[0] ? mapUser(result.rows[0]) : null
}

export async function upsertAuthenticatedUser(
  input: SyncAuthenticatedUserInput,
  database: DatabaseExecutor = getPool(),
): Promise<UserRecord> {
  const result = await database.query<UserRow>(
    `
      INSERT INTO users (
        auth_provider,
        auth_subject,
        account_type,
        email,
        email_verified_at,
        username,
        display_name,
        avatar_url,
        last_login_at
      )
      VALUES ($1, $2, 'REGISTERED', $3, $4, $5, $6, $7, $8)
      ON CONFLICT (auth_provider, auth_subject) DO UPDATE
      SET
        account_type = 'REGISTERED',
        email = CASE WHEN users.status = 'DELETED' THEN NULL ELSE EXCLUDED.email END,
        email_verified_at = CASE
          WHEN users.status = 'DELETED' THEN NULL
          ELSE EXCLUDED.email_verified_at
        END,
        username = CASE
          WHEN users.status = 'DELETED' THEN NULL
          ELSE EXCLUDED.username
        END,
        display_name = CASE
          WHEN users.status = 'DELETED' THEN NULL
          ELSE EXCLUDED.display_name
        END,
        avatar_url = CASE
          WHEN users.status = 'DELETED' THEN NULL
          ELSE EXCLUDED.avatar_url
        END,
        updated_at = now(),
        last_login_at = CASE
          WHEN users.status = 'DELETED' THEN users.last_login_at
          WHEN EXCLUDED.last_login_at IS NULL THEN users.last_login_at
          WHEN users.last_login_at IS NULL THEN EXCLUDED.last_login_at
          ELSE GREATEST(users.last_login_at, EXCLUDED.last_login_at)
        END
      RETURNING ${userColumns}
    `,
    [
      input.authProvider,
      input.authSubject,
      input.email,
      input.emailVerifiedAt,
      input.username,
      input.displayName,
      input.avatarUrl,
      input.lastLoginAt,
    ],
  )
  return mapUser(result.rows[0])
}

export async function recordAuthenticatedUserLogin(
  authProvider: 'clerk',
  authSubject: string,
  lastLoginAt: Date,
  database: DatabaseExecutor = getPool(),
): Promise<UserRecord> {
  const result = await database.query<UserRow>(
    `
      INSERT INTO users (
        auth_provider,
        auth_subject,
        account_type,
        last_login_at
      )
      VALUES ($1, $2, 'REGISTERED', $3)
      ON CONFLICT (auth_provider, auth_subject) DO UPDATE
      SET
        updated_at = CASE
          WHEN users.status = 'DELETED' THEN users.updated_at
          ELSE now()
        END,
        last_login_at = CASE
          WHEN users.status = 'DELETED' THEN users.last_login_at
          WHEN users.last_login_at IS NULL THEN EXCLUDED.last_login_at
          ELSE GREATEST(users.last_login_at, EXCLUDED.last_login_at)
        END
      RETURNING ${userColumns}
    `,
    [authProvider, authSubject, lastLoginAt],
  )
  return mapUser(result.rows[0])
}

export async function softDeleteUserByAuthIdentity(
  authProvider: string,
  authSubject: string,
  database: DatabaseExecutor = getPool(),
): Promise<void> {
  await database.query(
    `
      UPDATE users
      SET
        email = NULL,
        email_verified_at = NULL,
        username = NULL,
        display_name = NULL,
        avatar_url = NULL,
        status = 'DELETED',
        updated_at = now(),
        deleted_at = now()
      WHERE auth_provider = $1 AND auth_subject = $2
    `,
    [authProvider, authSubject],
  )
}

export async function claimAuthWebhookEvent(
  eventId: string,
  eventType: string,
  database: DatabaseExecutor = getPool(),
): Promise<boolean> {
  const result = await database.query(
    `
      INSERT INTO auth_webhook_events (event_id, event_type)
      VALUES ($1, $2)
      ON CONFLICT (event_id) DO NOTHING
      RETURNING event_id
    `,
    [eventId, eventType],
  )
  return result.rowCount === 1
}
