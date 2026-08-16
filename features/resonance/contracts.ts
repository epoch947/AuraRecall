import { z } from 'zod'

export const releaseEchoRequestSchema = z.object({
  color: z.string().trim().min(1).max(100),
  insight: z.string().trim().min(1).max(500),
  weather: z.string().trim().min(1).max(200),
})

export interface PoolEcho {
  id: string
  color: string
  insight: string
  weather: string
  resonances: number
  authorId: string | null
  createdAt: string
}
