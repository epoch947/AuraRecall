import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/lib/generated/prisma/client'

// Vercel Postgres exposes POSTGRES_PRISMA_URL (pooled).
// Fall back to DATABASE_URL for local development.
const connectionString =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  ''

const prismaClientSingleton = () =>
  new PrismaClient({ adapter: new PrismaPg({ connectionString }) })

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
