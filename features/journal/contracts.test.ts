import { describe, expect, it } from 'vitest'

import { generateEchoRequestSchema, generatedEchoSchema } from './contracts'

describe('journal contracts', () => {
  it('accepts a complete echo request', () => {
    const result = generateEchoRequestSchema.safeParse({
      moodText: 'I felt peaceful while walking home.',
      weather: 'Clear Sky',
      isPublic: true,
      userId: '5d65ea01-bbb0-4f65-8610-a7488fe2c63a',
    })

    expect(result.success).toBe(true)
  })

  it('rejects short journal entries and malformed identities', () => {
    const result = generateEchoRequestSchema.safeParse({
      moodText: 'short',
      weather: 'Rain',
      userId: 'not-a-uuid',
    })

    expect(result.success).toBe(false)
  })

  it('rejects generated colors that are not six-digit hex values', () => {
    const result = generatedEchoSchema.safeParse({
      semanticColor: 'blue',
      socraticQuestion: 'What made this moment feel different?',
      keyword: 'stillness',
    })

    expect(result.success).toBe(false)
  })
})
