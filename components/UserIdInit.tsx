'use client'

import { useEffect } from 'react'
import { useRitualStore } from '@/lib/store/useRitualStore'

/** Runs once on mount — reads or creates the persistent anonymous user UUID. */
export default function UserIdInit() {
  useEffect(() => {
    let uid = localStorage.getItem('aura_uid')
    if (!uid) {
      uid = crypto.randomUUID()
      localStorage.setItem('aura_uid', uid)
    }
    useRitualStore.getState().setUserId(uid)
  }, [])

  return null
}
