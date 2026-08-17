import 'server-only'

import { getPool } from '@/server/db/pool'
import type { DatabaseExecutor, PublicEchoRecord } from '@/server/db/models'

interface PublicEchoRow {
  id: string
  color: string
  insight: string
  weather: string
  resonances: number
  author_id: string | null
  created_at: Date
}

interface AuthorRow {
  author_id: string | null
}

export interface CreatePublicEchoInput {
  color: string
  insight: string
  weather: string
  embedding?: number[] | null
  authorId?: string | null
}

function mapPublicEcho(row: PublicEchoRow): PublicEchoRecord {
  return {
    id: row.id,
    color: row.color,
    insight: row.insight,
    weather: row.weather,
    resonances: row.resonances,
    authorId: row.author_id,
    createdAt: row.created_at,
  }
}

function serializeVector(embedding: number[] | null | undefined): string | null {
  if (!embedding) return null
  if (embedding.length !== 1536) {
    throw new Error(`Expected a 1536-dimensional embedding, received ${embedding.length}`)
  }
  return `[${embedding.join(',')}]`
}

export async function listLatestPublicEchoes(
  limit = 40,
  database: DatabaseExecutor = getPool(),
): Promise<PublicEchoRecord[]> {
  const result = await database.query<PublicEchoRow>(
    `
      SELECT
        e.id,
        e.color,
        e.insight,
        e.weather,
        e.resonances,
        CASE
          WHEN u.account_type = 'REGISTERED' AND u.status = 'ACTIVE' THEN e.author_id
          ELSE NULL
        END AS author_id,
        e.created_at
      FROM public_echoes e
      LEFT JOIN users u ON u.id = e.author_id
      ORDER BY e.created_at DESC
      LIMIT $1
    `,
    [limit],
  )
  return result.rows.map(mapPublicEcho)
}

export async function createPublicEcho(
  input: CreatePublicEchoInput,
  database: DatabaseExecutor = getPool(),
): Promise<PublicEchoRecord> {
  const result = await database.query<PublicEchoRow>(
    `
      INSERT INTO public_echoes (color, insight, weather, embedding, author_id)
      VALUES ($1, $2, $3, $4::vector, $5::uuid)
      RETURNING id, color, insight, weather, resonances, author_id, created_at
    `,
    [
      input.color,
      input.insight,
      input.weather,
      serializeVector(input.embedding),
      input.authorId ?? null,
    ],
  )
  return mapPublicEcho(result.rows[0])
}

export async function findPublicEchoAuthor(
  echoId: string,
  database: DatabaseExecutor = getPool(),
  lock = false,
): Promise<string | null | undefined> {
  const result = await database.query<AuthorRow>(
    `
      SELECT e.author_id
      FROM public_echoes e
      JOIN users u ON u.id = e.author_id
      WHERE
        e.id = $1::uuid
        AND u.account_type = 'REGISTERED'
        AND u.status = 'ACTIVE'
      ${lock ? 'FOR SHARE OF e, u' : ''}
    `,
    [echoId],
  )
  return result.rows[0]?.author_id
}
