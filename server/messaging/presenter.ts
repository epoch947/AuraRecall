import type {
  ConversationSummary,
  MessageRecord as ClientMessageRecord,
} from '@/features/messaging/contracts'
import type {
  ConversationWithEcho,
  MessageRecord as DatabaseMessageRecord,
} from '@/server/db/models'

type ConversationWithMessages = ConversationWithEcho & {
  messages: DatabaseMessageRecord[]
}

export function presentMessage(
  message: DatabaseMessageRecord,
  currentUserId: string,
): ClientMessageRecord {
  const { senderId, ...safeMessage } = message
  return { ...safeMessage, isMine: senderId === currentUserId }
}

export function presentConversation(
  conversation: ConversationWithMessages,
  currentUserId: string,
): ConversationSummary {
  return {
    id: conversation.id,
    echoId: conversation.echoId,
    status: conversation.status,
    updatedAt: conversation.updatedAt,
    echo: conversation.echo,
    isPendingForCurrentUser:
      conversation.status === 'PENDING' && conversation.receiverId === currentUserId,
    messages: conversation.messages.map((message) => presentMessage(message, currentUserId)),
  }
}
