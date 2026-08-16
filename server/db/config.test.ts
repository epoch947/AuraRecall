import { describe, expect, it } from 'vitest'

import { resolveDatabaseUrl, resolvePoolMax } from './config'

describe('database configuration', () => {
  it('upgrades sslmode=require to explicit certificate verification', () => {
    const url = resolveDatabaseUrl({
      DATABASE_URL: 'postgres://user:password@example.com:5432/aura?sslmode=require',
    })

    expect(new URL(url).searchParams.get('sslmode')).toBe('verify-full')
  })

  it('falls back to the legacy connection variable', () => {
    const url = resolveDatabaseUrl({
      POSTGRES_PRISMA_URL: 'postgres://user:password@example.com:5432/aura',
    })

    expect(new URL(url).hostname).toBe('example.com')
  })

  it('rejects invalid pool sizes', () => {
    expect(() => resolvePoolMax({ DATABASE_POOL_MAX: '0' })).toThrow()
    expect(() => resolvePoolMax({ DATABASE_POOL_MAX: '21' })).toThrow()
  })
})
