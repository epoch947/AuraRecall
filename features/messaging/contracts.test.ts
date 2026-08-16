import { describe, expect, it } from 'vitest'

import { createWhisperRequestSchema, replyRequestSchema } from './contracts'

const initiatorId = '5d65ea01-bbb0-4f65-8610-a7488fe2c63a'
const receiverId = 'aec3ce56-cce0-491c-9c65-9a09325e392b'

describe('messaging contracts', () => {
  it('accepts an anonymous whisper between two users', () => {
    const result = createWhisperRequestSchema.safeParse({
      echoId: 'e9883ac3-412b-4f07-a4d7-cb5da92a8a93',
      initiatorId,
      receiverId,
      content: 'Your echo stayed with me.',
    })

    expect(result.success).toBe(true)
  })

  it('prevents a user from whispering to the same identity', () => {
    const result = createWhisperRequestSchema.safeParse({
      echoId: 'e9883ac3-412b-4f07-a4d7-cb5da92a8a93',
      initiatorId,
      receiverId: initiatorId,
      content: 'Hello',
    })

    expect(result.success).toBe(false)
  })

  it('rejects empty replies', () => {
    expect(replyRequestSchema.safeParse({ senderId: receiverId, content: '   ' }).success).toBe(
      false,
    )
  })
})
