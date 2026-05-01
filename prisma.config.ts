import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// Vercel Postgres exposes POSTGRES_PRISMA_URL (pooled) and POSTGRES_URL_NON_POOLING (direct).
// Fall back to DATABASE_URL for local development.
const url =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  ''

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url,
  },
})
