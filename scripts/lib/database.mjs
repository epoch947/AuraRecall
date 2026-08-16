import fs from 'node:fs'

import dotenv from 'dotenv'
import pg from 'pg'

function loadLocalEnvironment() {
  const values = {}
  for (const file of ['.env', '.env.local']) {
    if (fs.existsSync(file)) Object.assign(values, dotenv.parse(fs.readFileSync(file)))
  }
  for (const [key, value] of Object.entries(values)) {
    if (process.env[key] === undefined) process.env[key] = value
  }
}

export function resolveDatabaseUrl() {
  loadLocalEnvironment()
  const rawUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_PRISMA_URL
  if (!rawUrl) throw new Error('DATABASE_URL is required')

  const url = new URL(rawUrl)
  if (url.searchParams.get('sslmode') === 'require') {
    url.searchParams.set('sslmode', 'verify-full')
  }
  return url.toString()
}

export function createDatabaseClient(applicationName) {
  return new pg.Client({
    connectionString: resolveDatabaseUrl(),
    application_name: applicationName,
    connectionTimeoutMillis: 10_000,
  })
}

export function describeDatabaseTarget() {
  const url = new URL(resolveDatabaseUrl())
  return `${url.hostname}:${url.port || '5432'}${url.pathname}`
}
