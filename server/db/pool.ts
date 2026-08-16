import 'server-only'

import { Pool, type PoolClient } from 'pg'

import { resolveDatabaseUrl, resolvePoolMax } from './config'

function createPool() {
  const pool = new Pool({
    connectionString: resolveDatabaseUrl(),
    max: resolvePoolMax(),
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
    application_name: 'aura-recall',
  })

  pool.on('error', (error) => {
    console.error('[database] idle client error:', error)
  })

  return pool
}

declare global {
  var auraPostgresPool: ReturnType<typeof createPool> | undefined
}

export function getPool(): Pool {
  if (!globalThis.auraPostgresPool) {
    globalThis.auraPostgresPool = createPool()
  }
  return globalThis.auraPostgresPool
}

export async function withTransaction<T>(
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    const result = await operation(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
