import { describe, expect, it } from 'vitest'

import { formatBriefUtcDate, formatFullUtcDate } from './date'

describe('UTC date formatting', () => {
  const dateNearUtcBoundary = '2026-08-18T00:30:00.000Z'

  it('formats full dates deterministically at a UTC boundary', () => {
    expect(formatFullUtcDate(dateNearUtcBoundary)).toBe('18 Aug 2026')
  })

  it('formats brief dates deterministically at a UTC boundary', () => {
    expect(formatBriefUtcDate(dateNearUtcBoundary)).toBe('18 Aug')
  })
})
