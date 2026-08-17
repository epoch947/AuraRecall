import { z } from 'zod'

export const resourceIdSchema = z.string().uuid()

export const createWhisperRequestSchema = z
  .object({
    echoId: resourceIdSchema,
    content: z.string().trim().min(1).max(2000),
  })
  .strict()

export const replyRequestSchema = z
  .object({
    content: z.string().trim().min(1).max(2000),
  })
  .strict()

export interface MessageRecord {
  id: string
  conversationId: string
  content: string
  createdAt: string
  isMine: boolean
}

export interface ConversationSummary {
  id: string
  echoId: string
  status: string
  updatedAt: string
  isPendingForCurrentUser: boolean
  echo: { id: string; color: string; insight: string; weather: string }
  messages: MessageRecord[]
}

export interface ConversationDetail extends Omit<ConversationSummary, 'messages'> {
  messages: MessageRecord[]
}
