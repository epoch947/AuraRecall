import 'server-only'

import { getPool } from '@/server/db/pool'
import {
  toIsoString,
  type ConversationRecord,
  type ConversationStatus,
  type ConversationSummaryRecord,
  type ConversationWithEcho,
  type DatabaseExecutor,
} from '@/server/db/models'

interface ConversationRow {
  id: string
  echo_id: string
  initiator_id: string
  receiver_id: string
  status: ConversationStatus
  created_at: Date
  updated_at: Date
}

interface ConversationWithEchoRow extends ConversationRow {
  echo_color: string
  echo_insight: string
  echo_weather: string
}

interface ConversationSummaryRow extends ConversationWithEchoRow {
  message_id: string | null
  message_sender_id: string | null
  message_content: string | null
  message_created_at: Date | null
}

export interface CreateConversationInput {
  echoId: string
  initiatorId: string
  receiverId: string
}

function mapConversation(row: ConversationRow): ConversationRecord {
  return {
    id: row.id,
    echoId: row.echo_id,
    initiatorId: row.initiator_id,
    receiverId: row.receiver_id,
    status: row.status,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
  }
}

function mapConversationWithEcho(row: ConversationWithEchoRow): ConversationWithEcho {
  return {
    ...mapConversation(row),
    echo: {
      id: row.echo_id,
      color: row.echo_color,
      insight: row.echo_insight,
      weather: row.echo_weather,
    },
  }
}

export async function listConversationsForUser(
  userId: string,
  database: DatabaseExecutor = getPool(),
): Promise<ConversationSummaryRecord[]> {
  const result = await database.query<ConversationSummaryRow>(
    `
      SELECT
        c.id,
        c.echo_id,
        c.initiator_id,
        c.receiver_id,
        c.status,
        c.created_at,
        c.updated_at,
        e.color AS echo_color,
        e.insight AS echo_insight,
        e.weather AS echo_weather,
        latest.id AS message_id,
        latest.sender_id AS message_sender_id,
        latest.content AS message_content,
        latest.created_at AS message_created_at
      FROM conversations c
      JOIN public_echoes e ON e.id = c.echo_id
      LEFT JOIN LATERAL (
        SELECT id, sender_id, content, created_at
        FROM messages
        WHERE conversation_id = c.id
        ORDER BY created_at DESC
        LIMIT 1
      ) latest ON true
      WHERE c.initiator_id = $1::uuid OR c.receiver_id = $1::uuid
      ORDER BY c.updated_at DESC
    `,
    [userId],
  )

  return result.rows.map((row) => ({
    ...mapConversationWithEcho(row),
    messages:
      row.message_id && row.message_sender_id && row.message_content && row.message_created_at
        ? [
            {
              id: row.message_id,
              conversationId: row.id,
              senderId: row.message_sender_id,
              content: row.message_content,
              createdAt: toIsoString(row.message_created_at),
            },
          ]
        : [],
  }))
}

export async function findConversationWithEcho(
  conversationId: string,
  database: DatabaseExecutor = getPool(),
  lock = false,
): Promise<ConversationWithEcho | null> {
  const result = await database.query<ConversationWithEchoRow>(
    `
      SELECT
        c.id,
        c.echo_id,
        c.initiator_id,
        c.receiver_id,
        c.status,
        c.created_at,
        c.updated_at,
        e.color AS echo_color,
        e.insight AS echo_insight,
        e.weather AS echo_weather
      FROM conversations c
      JOIN public_echoes e ON e.id = c.echo_id
      WHERE c.id = $1::uuid
      ${lock ? 'FOR UPDATE OF c' : ''}
    `,
    [conversationId],
  )
  return result.rows[0] ? mapConversationWithEcho(result.rows[0]) : null
}

export async function createConversationRecord(
  input: CreateConversationInput,
  database: DatabaseExecutor = getPool(),
): Promise<ConversationRecord> {
  const result = await database.query<ConversationRow>(
    `
      INSERT INTO conversations (echo_id, initiator_id, receiver_id)
      VALUES ($1::uuid, $2::uuid, $3::uuid)
      RETURNING id, echo_id, initiator_id, receiver_id, status, created_at, updated_at
    `,
    [input.echoId, input.initiatorId, input.receiverId],
  )
  return mapConversation(result.rows[0])
}

export async function acceptAndTouchConversation(
  conversationId: string,
  database: DatabaseExecutor = getPool(),
): Promise<void> {
  await database.query(
    `
      UPDATE conversations
      SET
        status = CASE WHEN status = 'PENDING' THEN 'ACCEPTED' ELSE status END,
        updated_at = now()
      WHERE id = $1::uuid
    `,
    [conversationId],
  )
}
