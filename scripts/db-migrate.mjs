import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createDatabaseClient, describeDatabaseTarget } from './lib/database.mjs'

const command = process.argv[2] ?? 'status'
const migrationsDirectory = fileURLToPath(new URL('../database/migrations/', import.meta.url))
const lockName = 'aura-recall-schema-migrations'

async function loadMigrations() {
  const files = (await fs.readdir(migrationsDirectory))
    .filter((file) => /^\d+_.+\.sql$/.test(file))
    .sort()

  return Promise.all(
    files.map(async (file) => {
      const sql = await fs.readFile(path.join(migrationsDirectory, file), 'utf8')
      return {
        id: file.replace(/\.sql$/, ''),
        file,
        sql,
        checksum: crypto.createHash('sha256').update(sql).digest('hex'),
      }
    }),
  )
}

async function readAppliedMigrations(client) {
  const exists = await client.query(
    `SELECT to_regclass('public.schema_migrations') IS NOT NULL AS exists`,
  )
  if (!exists.rows[0].exists) return new Map()

  const result = await client.query(
    'SELECT migration_id, checksum, applied_at FROM schema_migrations ORDER BY migration_id',
  )
  return new Map(result.rows.map((row) => [row.migration_id, row]))
}

async function showStatus(client, migrations) {
  const applied = await readAppliedMigrations(client)
  console.log(`Database: ${describeDatabaseTarget()}`)
  for (const migration of migrations) {
    const record = applied.get(migration.id)
    const state = record ? 'applied' : 'pending'
    const suffix = record ? ` at ${new Date(record.applied_at).toISOString()}` : ''
    console.log(`${state.padEnd(8)} ${migration.file}${suffix}`)
  }
}

async function migrate(client, migrations) {
  await client.query('SELECT pg_advisory_lock(hashtext($1))', [lockName])
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        migration_id text PRIMARY KEY,
        checksum text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `)

    const applied = await readAppliedMigrations(client)
    for (const migration of migrations) {
      const record = applied.get(migration.id)
      if (record) {
        if (record.checksum !== migration.checksum) {
          throw new Error(`Checksum mismatch for applied migration ${migration.file}`)
        }
        continue
      }

      console.log(`Applying ${migration.file}`)
      await client.query('BEGIN')
      try {
        await client.query(migration.sql)
        await client.query(
          'INSERT INTO schema_migrations (migration_id, checksum) VALUES ($1, $2)',
          [migration.id, migration.checksum],
        )
        await client.query('COMMIT')
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
    }
  } finally {
    await client.query('SELECT pg_advisory_unlock(hashtext($1))', [lockName])
  }
}

async function main() {
  if (!['status', 'migrate'].includes(command)) {
    throw new Error('Usage: node scripts/db-migrate.mjs [status|migrate]')
  }

  const migrations = await loadMigrations()
  const client = createDatabaseClient('aura-schema-migrations')
  await client.connect()
  try {
    if (command === 'migrate') await migrate(client, migrations)
    await showStatus(client, migrations)
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
