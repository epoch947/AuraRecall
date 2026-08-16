import 'server-only'

import type { z } from 'zod'
import type { createWhisperRequestSchema, replyRequestSchema } from '@/features/messaging/contracts'
import { withTransaction } from '@/server/db/pool'
import {
  acceptAndTouchConversation,
  createConversationRecord,
  findConversationWithEcho,
  listConversationsForUser,
} from '@/server/db/repositories/conversationRepository'
import {
  createMessage,
  listMessagesForConversation,
} from '@/server/db/repositories/messageRepository'
import { findPublicEchoAuthor } from '@/server/db/repositories/publicEchoRepository'

type CreateWhisperInput = z.infer<typeof createWhisperRequestSchema>
type ReplyInput = z.infer<typeof replyRequestSchema>

export async function listConversations(userId: string) {
  return listConversationsForUser(userId)
}

export async function getConversation(id: string, userId: string) {
  const conversation = await findConversationWithEcho(id)

  if (!conversation) return { kind: 'not-found' as const }
  if (conversation.initiatorId !== userId && conversation.receiverId !== userId) {
    return { kind: 'forbidden' as const }
  }
  const messages = await listMessagesForConversation(id)
  return { kind: 'ok' as const, conversation: { ...conversation, messages } }
}

export async function createConversation(input: CreateWhisperInput) {
  return withTransaction(async (transaction) => {
    const authorId = await findPublicEchoAuthor(input.echoId, transaction, true)
    if (authorId === undefined || authorId !== input.receiverId) {
      return { kind: 'invalid-receiver' as const }
    }

    const conversation = await createConversationRecord(
      {
        echoId: input.echoId,
        initiatorId: input.initiatorId,
        receiverId: input.receiverId,
      },
      transaction,
    )
    await createMessage(
      {
        conversationId: conversation.id,
        senderId: input.initiatorId,
        content: input.content,
      },
      transaction,
    )

    return { kind: 'ok' as const, conversation }
  })
}

export async function replyToConversation(id: string, input: ReplyInput) {
  return withTransaction(async (transaction) => {
    const conversation = await findConversationWithEcho(id, transaction, true)
    if (!conversation) return { kind: 'not-found' as const }
    if (conversation.initiatorId !== input.senderId && conversation.receiverId !== input.senderId) {
      return { kind: 'forbidden' as const }
    }

    const message = await createMessage(
      { conversationId: id, senderId: input.senderId, content: input.content },
      transaction,
    )
    await acceptAndTouchConversation(id, transaction)

    return { kind: 'ok' as const, message }
  })
}
