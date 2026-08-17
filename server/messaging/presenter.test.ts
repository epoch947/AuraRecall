import { describe, expect, it } from 'vitest'

import { presentConversation } from './presenter'

const currentUserId = '5d65ea01-bbb0-4f65-8610-a7488fe2c63a'
const otherUserId = 'aec3ce56-cce0-491c-9c65-9a09325e392b'

describe('messaging presenter', () => {
  it('replaces private participant identifiers with viewer-relative flags', () => {
    const result = presentConversation(
      {
        id: '9b73de04-8d1e-4409-8e70-99434156a6a3',
        echoId: '8d82b196-b9d2-464d-9703-6b748755cf29',
        initiatorId: otherUserId,
        receiverId: currentUserId,
        status: 'PENDING',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        echo: {
          id: '8d82b196-b9d2-464d-9703-6b748755cf29',
          color: '#778899',
          insight: 'What changed?',
          weather: 'Clear Sky',
        },
        messages: [
          {
            id: '31b1311c-f52c-4875-b40d-da54330fb114',
            conversationId: '9b73de04-8d1e-4409-8e70-99434156a6a3',
            senderId: otherUserId,
            content: 'Hello',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
      currentUserId,
    )

    expect(result).not.toHaveProperty('initiatorId')
    expect(result).not.toHaveProperty('receiverId')
    expect(result.messages[0]).not.toHaveProperty('senderId')
    expect(result.isPendingForCurrentUser).toBe(true)
    expect(result.messages[0].isMine).toBe(false)
  })
})
