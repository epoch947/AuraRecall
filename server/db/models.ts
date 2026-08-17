export type DatabaseExecutor = Pick<import('pg').Pool, 'query'>

export type ConversationStatus = 'PENDING' | 'ACCEPTED'
export type UserAccountType = 'REGISTERED' | 'LEGACY_GUEST'
export type UserRole = 'USER' | 'ADMIN' | 'MODERATOR'
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED'

export interface UserRecord {
  id: string
  authProvider: string
  authSubject: string
  accountType: UserAccountType
  email: string | null
  emailVerifiedAt: string | null
  username: string | null
  displayName: string | null
  avatarUrl: string | null
  role: UserRole
  status: UserStatus
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
  deletedAt: string | null
}

export interface PublicEchoRecord {
  id: string
  color: string
  insight: string
  weather: string
  resonances: number
  authorId: string | null
  createdAt: Date
}

export interface ConversationRecord {
  id: string
  echoId: string
  initiatorId: string
  receiverId: string
  status: ConversationStatus
  createdAt: string
  updatedAt: string
}

export interface EchoReference {
  id: string
  color: string
  insight: string
  weather: string
}

export interface MessageRecord {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: string
}

export interface ConversationWithEcho extends ConversationRecord {
  echo: EchoReference
}

export interface ConversationSummaryRecord extends ConversationWithEcho {
  messages: MessageRecord[]
}

export interface ConversationDetailRecord extends ConversationWithEcho {
  messages: MessageRecord[]
}

export function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}
