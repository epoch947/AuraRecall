'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from '@clerk/nextjs'
import { switchRitualStoreIdentity } from '@/features/journal/store/useRitualStore'

export default function JournalIdentityScope() {
  const { isLoaded, userId } = useAuth()
  const activeScope = useRef<string | null>(null)

  useEffect(() => {
    if (!isLoaded) return

    const scope = userId ?? 'signed-out'
    if (activeScope.current === scope) return
    activeScope.current = scope

    void switchRitualStoreIdentity(userId ?? null)
  }, [isLoaded, userId])

  return null
}
