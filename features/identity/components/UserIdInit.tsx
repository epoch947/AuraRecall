'use client'

import { useEffect } from 'react'
import { useRitualStore } from '@/features/journal/store/useRitualStore'

const USER_ID_KEY = 'aura_uid:v1'
const LEGACY_USER_ID_KEY = 'aura_uid'

/** Runs once on mount — reads or creates the persistent anonymous user UUID. */
export default function UserIdInit() {
  useEffect(() => {
    let uid = crypto.randomUUID()
    try {
      uid = localStorage.getItem(USER_ID_KEY) ?? localStorage.getItem(LEGACY_USER_ID_KEY) ?? uid
      localStorage.setItem(USER_ID_KEY, uid)
      localStorage.removeItem(LEGACY_USER_ID_KEY)
    } catch {
      // Storage may be unavailable in private browsing; keep an in-memory identity.
    }
    useRitualStore.getState().setUserId(uid)
  }, [])

  return null
}
