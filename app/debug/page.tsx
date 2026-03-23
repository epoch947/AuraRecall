'use client'

import { notFound } from 'next/navigation'
import { useEffect } from 'react'
import { useRitualStore } from '@/lib/store/useRitualStore'
import ArchiveGallery from '@/components/phases/ArchiveGallery'

if (process.env.NODE_ENV !== 'development') notFound()

export default function DebugPage() {
  useEffect(() => {
    useRitualStore.getState().injectDummyData()
    useRitualStore.setState({ phase: 'ARCHIVE_GALLERY' })
  }, [])

  return (
    <div className="w-screen h-screen overflow-hidden">
      <ArchiveGallery />
    </div>
  )
}
