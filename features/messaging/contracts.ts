import { z } from 'zod'

export const resourceIdSchema = z.string().uuid()
export const anonymousUserIdSchema = resourceIdSchema

export const createWhisperRequestSchema = z
  .object({
    echoId: resourceIdSchema,
    initiatorId: anonymousUserIdSchema,
    receiverId: anonymousUserIdSchema,
    content: z.string().trim().min(1).max(2000),
  })
  .refine((value) => value.initiatorId !== value.receiverId, {
    message: 'You cannot whisper to yourself',
  })

export const replyRequestSchema = z.object({
  senderId: anonymousUserIdSchema,
  content: z.string().trim().min(1).max(2000),
})

export interface MessageRecord {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: string
}

export interface ConversationSummary {
  id: string
  echoId: string
  initiatorId: string
  receiverId: string
  status: string
  updatedAt: string
  echo: { id: string; color: string; insight: string; weather: string }
  messages: MessageRecord[]
}

export interface ConversationDetail extends Omit<ConversationSummary, 'messages'> {
  messages: MessageRecord[]
}
