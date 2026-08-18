'use client'

import BackControl from '@/features/navigation/components/BackControl'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-oatmeal px-8 text-center text-charcoal">
          <p className="font-serif text-2xl">AuraRecall needs a quiet restart.</p>
          <div className="flex items-center gap-5">
            <button
              type="button"
              onClick={reset}
              className="min-h-11 font-mono text-[10px] uppercase tracking-[0.3em] focus-visible:outline-none focus-visible:ring-2"
            >
              Restart
            </button>
            <BackControl href="/" label="Return home" />
          </div>
        </main>
      </body>
    </html>
  )
}
