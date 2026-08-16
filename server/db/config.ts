const DEFAULT_POOL_MAX = 5
type Environment = Readonly<Record<string, string | undefined>>

export function resolveDatabaseUrl(environment: Environment = process.env): string {
  const rawUrl = environment.DATABASE_URL ?? environment.POSTGRES_PRISMA_URL
  if (!rawUrl) {
    throw new Error('DATABASE_URL is required')
  }

  const url = new URL(rawUrl)
  if (url.searchParams.get('sslmode') === 'require') {
    url.searchParams.set('sslmode', 'verify-full')
  }
  return url.toString()
}

export function resolvePoolMax(environment: Environment = process.env): number {
  const configured = Number(environment.DATABASE_POOL_MAX ?? DEFAULT_POOL_MAX)
  if (!Number.isInteger(configured) || configured < 1 || configured > 20) {
    throw new Error('DATABASE_POOL_MAX must be an integer between 1 and 20')
  }
  return configured
}
