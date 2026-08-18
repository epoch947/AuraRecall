import { describe, expect, it } from 'vitest'

import { createWhisperRequestSchema, replyRequestSchema } from './contracts'

describe('messaging contracts', () => {
  it('accepts a whisper without trusting client identity fields', () => {
    const result = createWhisperRequestSchema.safeParse({
      echoId: 'e9883ac3-412b-4f07-a4d7-cb5da92a8a93',
      content: 'Your echo stayed with me.',
    })

    expect(result.success).toBe(true)
  })

  it('rejects client-supplied identity fields', () => {
    const result = createWhisperRequestSchema.safeParse({
      echoId: 'e9883ac3-412b-4f07-a4d7-cb5da92a8a93',
      initiatorId: '5d65ea01-bbb0-4f65-8610-a7488fe2c63a',
      receiverId: 'aec3ce56-cce0-491c-9c65-9a09325e392b',
      content: 'Hello',
    })

    expect(result.success).toBe(false)
  })

  it('rejects empty replies', () => {
    expect(replyRequestSchema.safeParse({ content: '   ' }).success).toBe(false)
  })
})
