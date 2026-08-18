import { describe, expect, it } from 'vitest'

import {
  echoGenerationErrorResponseSchema,
  echoGenerationResponseSchema,
  generateEchoRequestSchema,
  generatedEchoSchema,
} from './contracts'

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

  it('accepts a complete echo generation response', () => {
    const result = echoGenerationResponseSchema.safeParse({
      imageUrl: 'https://example.com/generated-image.png',
      insight: 'What would you like to carry forward from this moment?',
      semanticColor: '#8A9A7B',
    })

    expect(result.success).toBe(true)
  })

  it('accepts the safe error returned when generation is unavailable', () => {
    const result = echoGenerationErrorResponseSchema.safeParse({
      error: {
        code: 'AI_GENERATION_UNAVAILABLE',
        message: 'We could not create your visual echo right now.',
      },
    })

    expect(result.success).toBe(true)
  })
})
