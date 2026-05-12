import type { Metadata } from 'next'
import './globals.css'
import UserIdInit from '@/components/UserIdInit'

export const metadata: Metadata = {
  title: 'AuraRecall',
  description: 'A moment of clarity.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="washi-layer bg-oatmeal text-charcoal overflow-hidden h-screen w-screen">
        <UserIdInit />
        {children}
      </body>
    </html>
  )
}
