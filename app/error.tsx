'use client'

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-oatmeal px-8 text-center text-charcoal">
      <p className="font-serif text-2xl">Something interrupted the stillness.</p>
      <button
        type="button"
        onClick={reset}
        className="font-mono text-[10px] uppercase tracking-[0.3em] text-charcoal/60 hover:text-charcoal"
      >
        Try again
      </button>
    </main>
  )
}
