import 'server-only'

import type { z } from 'zod'
import type { releaseEchoRequestSchema } from '@/features/resonance/contracts'
import {
  createPublicEcho,
  listLatestPublicEchoes,
} from '@/server/db/repositories/publicEchoRepository'

type ReleaseEchoInput = z.infer<typeof releaseEchoRequestSchema>

export async function listLatestEchoes(viewerId: string | null = null) {
  const echoes = await listLatestPublicEchoes(40)
  return echoes.map(({ authorId, ...echo }) => ({
    ...echo,
    canWhisper: authorId !== null,
    isOwn: viewerId !== null && authorId === viewerId,
  }))
}

export async function releaseEcho(input: ReleaseEchoInput, authorId: string) {
  return createPublicEcho({ ...input, authorId })
}
