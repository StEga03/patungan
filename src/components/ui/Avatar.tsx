import { initial } from '@/lib/colors'
import { cn } from '@/lib/cn'

const sizes = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
}

export function Avatar({
  nama,
  warna,
  size = 'md',
  className,
}: {
  nama: string
  warna: string
  size?: keyof typeof sizes
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-grid place-items-center rounded-full font-bold text-white shadow-sm ring-1 ring-black/5 select-none',
        sizes[size],
        className,
      )}
      style={{ backgroundColor: warna }}
      title={nama}
    >
      {initial(nama)}
    </span>
  )
}
