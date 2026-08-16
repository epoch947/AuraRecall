import { describe, expect, it } from 'vitest'

import { extractMoodColor } from './semanticColor'

describe('extractMoodColor', () => {
  it('uses the neutral fallback when no mood words are present', () => {
    expect(extractMoodColor('A regular afternoon')).toBe('hsl(43, 33%, 92%)')
  })

  it('maps a known mood word to its palette value', () => {
    expect(extractMoodColor('I feel calm today')).toBe('hsl(180, 20%, 75%)')
  })

  it('averages all recognized mood words', () => {
    expect(extractMoodColor('calm but sad')).toBe('hsl(200, 23%, 68%)')
  })
})
