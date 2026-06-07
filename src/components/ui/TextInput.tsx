import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

export function TextInput({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'w-full rounded-xl border border-line bg-paper/60 px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-faint',
        'focus:border-amber focus:bg-card focus:outline-none focus:ring-2 focus:ring-amber/20',
        'transition-colors',
        className,
      )}
      {...props}
    />
  )
}

export function Label({
  children,
  htmlFor,
}: {
  children: React.ReactNode
  htmlFor?: string
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[11px] font-semibold tracking-wide text-ink-soft uppercase"
    >
      {children}
    </label>
  )
}
