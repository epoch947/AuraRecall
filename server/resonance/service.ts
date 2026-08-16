import 'server-only'

import type { z } from 'zod'
import type { releaseEchoRequestSchema } from '@/features/resonance/contracts'
import {
  createPublicEcho,
  listLatestPublicEchoes,
} from '@/server/db/repositories/publicEchoRepository'

type ReleaseEchoInput = z.infer<typeof releaseEchoRequestSchema>

export async function listLatestEchoes() {
  return listLatestPublicEchoes(40)
}

export async function releaseEcho(input: ReleaseEchoInput) {
  return createPublicEcho(input)
}
