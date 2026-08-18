'use client'

import Link from 'next/link'
import { ArrowLeft, X } from 'lucide-react'

interface BackControlBaseProps {
  label: string
  tone?: 'on-light' | 'on-dark'
  icon?: 'back' | 'close'
  compactOnMobile?: boolean
  className?: string
}

type BackControlProps = BackControlBaseProps &
  (
    | {
        href: string
        onClick?: never
      }
    | {
        href?: never
        onClick: () => void
      }
  )

export default function BackControl({
  label,
  tone = 'on-light',
  icon = 'back',
  compactOnMobile = false,
  className = '',
  ...action
}: BackControlProps) {
  const toneClasses =
    tone === 'on-dark'
      ? 'text-oatmeal/55 hover:bg-oatmeal/8 hover:text-oatmeal focus-visible:ring-sage/70'
      : 'text-charcoal/50 hover:bg-charcoal/5 hover:text-charcoal focus-visible:ring-sage/60'
  const classes = `inline-flex min-h-11 items-center gap-2 rounded-full px-3 font-mono text-[10px]
                   uppercase tracking-[0.22em] backdrop-blur-sm transition-colors duration-300
                   focus-visible:outline-none focus-visible:ring-2 ${toneClasses} ${className}`
  const content = (
    <>
      {icon === 'close' ? (
        <X size={14} strokeWidth={1.5} aria-hidden="true" />
      ) : (
        <ArrowLeft size={14} strokeWidth={1.5} aria-hidden="true" />
      )}
      <span className={compactOnMobile ? 'hidden sm:inline' : undefined}>{label}</span>
    </>
  )

  if ('href' in action && action.href) {
    return (
      <Link href={action.href} aria-label={label} className={classes}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" onClick={action.onClick} aria-label={label} className={classes}>
      {content}
    </button>
  )
}
