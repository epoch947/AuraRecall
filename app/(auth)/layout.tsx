export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-charcoal text-oatmeal flex items-center justify-center px-6 py-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(138,151,128,0.16),transparent_55%)]" />
      <div className="relative z-10">{children}</div>
    </main>
  )
}
