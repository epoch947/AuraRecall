import 'server-only'

import { getPool } from '@/server/db/pool'
import { toIsoString, type DatabaseExecutor, type MessageRecord } from '@/server/db/models'

interface MessageRow {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: Date
}

export interface CreateMessageInput {
  conversationId: string
  senderId: string
  content: string
}

function mapMessage(row: MessageRow): MessageRecord {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    content: row.content,
    createdAt: toIsoString(row.created_at),
  }
}

export async function listMessagesForConversation(
  conversationId: string,
  database: DatabaseExecutor = getPool(),
): Promise<MessageRecord[]> {
  const result = await database.query<MessageRow>(
    `
      SELECT id, conversation_id, sender_id, content, created_at
      FROM messages
      WHERE conversation_id = $1::uuid
      ORDER BY created_at ASC
    `,
    [conversationId],
  )
  return result.rows.map(mapMessage)
}

export async function createMessage(
  input: CreateMessageInput,
  database: DatabaseExecutor = getPool(),
): Promise<MessageRecord> {
  const result = await database.query<MessageRow>(
    `
      INSERT INTO messages (conversation_id, sender_id, content)
      VALUES ($1::uuid, $2::uuid, $3)
      RETURNING id, conversation_id, sender_id, content, created_at
    `,
    [input.conversationId, input.senderId, input.content],
  )
  return mapMessage(result.rows[0])
}
