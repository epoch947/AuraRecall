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
import { presentConversation, presentMessage } from '@/server/messaging/presenter'

type CreateWhisperInput = z.infer<typeof createWhisperRequestSchema>
type ReplyInput = z.infer<typeof replyRequestSchema>

export async function listConversations(userId: string) {
  const conversations = await listConversationsForUser(userId)
  return conversations.map((conversation) => presentConversation(conversation, userId))
}

export async function getConversation(id: string, userId: string) {
  const conversation = await findConversationWithEcho(id)

  if (!conversation) return { kind: 'not-found' as const }
  if (conversation.initiatorId !== userId && conversation.receiverId !== userId) {
    return { kind: 'forbidden' as const }
  }
  const messages = await listMessagesForConversation(id)
  return {
    kind: 'ok' as const,
    conversation: presentConversation({ ...conversation, messages }, userId),
  }
}

export async function createConversation(actorId: string, input: CreateWhisperInput) {
  return withTransaction(async (transaction) => {
    const authorId = await findPublicEchoAuthor(input.echoId, transaction, true)
    if (!authorId) return { kind: 'invalid-echo' as const }
    if (authorId === actorId) return { kind: 'self-whisper' as const }

    const conversation = await createConversationRecord(
      {
        echoId: input.echoId,
        initiatorId: actorId,
        receiverId: authorId,
      },
      transaction,
    )
    await createMessage(
      {
        conversationId: conversation.id,
        senderId: actorId,
        content: input.content,
      },
      transaction,
    )

    return { kind: 'ok' as const, conversation }
  })
}

export async function replyToConversation(id: string, actorId: string, input: ReplyInput) {
  return withTransaction(async (transaction) => {
    const conversation = await findConversationWithEcho(id, transaction, true)
    if (!conversation) return { kind: 'not-found' as const }
    if (conversation.initiatorId !== actorId && conversation.receiverId !== actorId) {
      return { kind: 'forbidden' as const }
    }

    const message = await createMessage(
      { conversationId: id, senderId: actorId, content: input.content },
      transaction,
    )
    await acceptAndTouchConversation(id, actorId, transaction)

    return { kind: 'ok' as const, message: presentMessage(message, actorId) }
  })
}
