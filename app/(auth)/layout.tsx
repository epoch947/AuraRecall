import BackControl from '@/features/navigation/components/BackControl'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-charcoal text-oatmeal flex items-center justify-center px-6 py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(138,151,128,0.16),transparent_55%)]" />
      <BackControl
        href="/"
        label="Back to AuraRecall"
        tone="on-dark"
        compactOnMobile
        className="absolute left-4 top-4 z-20 sm:left-6 sm:top-5"
      />
      <div className="relative z-10">{children}</div>
    </main>
  )
}
