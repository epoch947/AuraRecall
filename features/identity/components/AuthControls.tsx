'use client'

import { Show, SignInButton, UserButton } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'

export default function AuthControls() {
  const pathname = usePathname()
  if (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) return null

  return (
    <div className="fixed right-6 top-5 z-50 flex items-center">
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button
            type="button"
            className="border border-oatmeal/25 bg-charcoal/30 px-4 py-2 font-mono text-[9px]
                       uppercase tracking-[0.28em] text-oatmeal/60 backdrop-blur-sm
                       transition-colors hover:border-oatmeal/50 hover:text-oatmeal"
          >
            Sign in
          </button>
        </SignInButton>
      </Show>
      <Show when="signed-in">
        <UserButton />
      </Show>
    </div>
  )
}
