import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** A ledger card — paper surface, hairline border, soft shadow. */
export function Card({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'rounded-[var(--radius-card)] border border-line bg-card shadow-[var(--shadow-card)]',
        className,
      )}
    >
      {children}
    </section>
  )
}

export function CardHeader({
  icon,
  title,
  action,
}: {
  icon?: ReactNode
  title: string
  action?: ReactNode
}) {
  return (
    <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
      <h2 className="flex items-center gap-2 font-display text-[15px] font-semibold tracking-tight text-ink">
        {icon}
        {title}
      </h2>
      {action}
    </header>
  )
}
