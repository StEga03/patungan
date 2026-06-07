import { motion } from 'framer-motion'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'ghost' | 'soft' | 'danger'

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber'

const variants: Record<Variant, string> = {
  primary:
    'bg-ink text-paper hover:bg-ink/90 shadow-[var(--shadow-card)] px-4 py-2.5',
  soft: 'bg-paper-2 text-ink hover:bg-line/70 px-4 py-2.5',
  ghost: 'text-ink-soft hover:text-ink hover:bg-paper-2 px-3 py-2',
  danger: 'text-rust hover:bg-rust-soft px-3 py-2',
}

export function Button({
  variant = 'primary',
  className,
  ...props
}: ComponentProps<typeof motion.button> & { variant?: Variant }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      className={cn(base, variants[variant], className)}
      {...props}
    />
  )
}
