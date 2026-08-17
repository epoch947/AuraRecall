import { describe, expect, it } from 'vitest'

import { generateEchoRequestSchema, generatedEchoSchema } from './contracts'

describe('journal contracts', () => {
  it('accepts a complete echo request', () => {
    const result = generateEchoRequestSchema.safeParse({
      moodText: 'I felt peaceful while walking home.',
      weather: 'Clear Sky',
      isPublic: true,
    })

    expect(result.success).toBe(true)
  })

  it('rejects short journal entries', () => {
    const result = generateEchoRequestSchema.safeParse({
      moodText: 'short',
      weather: 'Rain',
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
