import ResonancePageClient from '@/features/resonance/components/ResonancePageClient'
import type { PoolEcho } from '@/features/resonance/contracts'
import { listLatestEchoes } from '@/server/resonance/service'
import { getOptionalCurrentAppUser } from '@/server/auth/currentUser'

export const dynamic = 'force-dynamic'

export default async function ResonancePage() {
  let initialEchoes: PoolEcho[] = []
  try {
    const currentUser = await getOptionalCurrentAppUser()
    const echoes = await listLatestEchoes(currentUser?.id ?? null)
    initialEchoes = echoes.map((echo) => ({ ...echo, createdAt: echo.createdAt.toISOString() }))
  } catch (error) {
    console.error('[resonance] initial load failed:', error)
  }

  return <ResonancePageClient initialEchoes={initialEchoes} />
}
