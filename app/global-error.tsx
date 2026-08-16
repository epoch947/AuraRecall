'use client'

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
          <button
            type="button"
            onClick={reset}
            className="font-mono text-[10px] uppercase tracking-[0.3em]"
          >
            Restart
          </button>
        </main>
      </body>
    </html>
  )
}
