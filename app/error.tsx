'use client'

import BackControl from '@/features/navigation/components/BackControl'

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-oatmeal px-8 text-center text-charcoal">
      <p className="font-serif text-2xl">Something interrupted the stillness.</p>
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={reset}
          className="min-h-11 font-mono text-[10px] uppercase tracking-[0.3em] text-charcoal/60 hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/60"
        >
          Try again
        </button>
        <BackControl href="/" label="Return home" />
      </div>
    </main>
  )
}
