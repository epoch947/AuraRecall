import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import AuthControls from '@/features/identity/components/AuthControls'
import JournalIdentityScope from '@/features/identity/components/JournalIdentityScope'

export const metadata: Metadata = {
  title: 'AuraRecall',
  description: 'A moment of clarity.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="washi-layer bg-oatmeal text-charcoal">
        <ClerkProvider>
          <JournalIdentityScope />
          <AuthControls />
          {children}
        </ClerkProvider>
      </body>
    </html>
  )
}
