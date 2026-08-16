import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-oatmeal px-8 text-center text-charcoal">
      <p className="font-serif text-2xl">This echo could not be found.</p>
      <Link
        href="/"
        className="font-mono text-[10px] uppercase tracking-[0.3em] text-charcoal/60 hover:text-charcoal"
      >
        Return home
      </Link>
    </main>
  )
}
