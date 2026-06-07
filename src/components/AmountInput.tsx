import { AnimatePresence, motion } from 'framer-motion'
import { Calculator } from 'lucide-react'
import { evalAmount, formatNumber } from '@/lib/money'
import { cn } from '@/lib/cn'

/**
 * Smart rupiah input. Accepts plain numbers OR arithmetic expressions
 * ("200000-145000", "50000+30000") and previews the live computed value.
 * The parent reads the committed value via `value` + `onChange(number|null)`.
 */
export function AmountInput({
  raw,
  onRawChange,
  id,
}: {
  raw: string
  onRawChange: (raw: string) => void
  id?: string
}) {
  const computed = evalAmount(raw)
  const isExpression = /[+\-*()]/.test(raw.replace(/^-/, '').trim())
  const showPreview = isExpression && computed !== null

  // Live-format plain numbers with id-ID thousand separators ("100000" ->
  // "100.000"). Expressions are left untouched so the calculator keeps working.
  const handleChange = (val: string) => {
    const hasOp = /[+\-*()]/.test(val.replace(/^-/, ''))
    if (hasOp) {
      onRawChange(val)
      return
    }
    const n = Number(val.replace(/[^\d]/g, ''))
    onRawChange(n ? n.toLocaleString('id-ID') : '')
  }

  return (
    <div>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 font-mono text-sm font-semibold text-ink-faint">
          Rp
        </span>
        <input
          id={id}
          inputMode="text"
          autoComplete="off"
          placeholder="0  ·  atau 200000-145000"
          value={raw}
          onChange={(e) => handleChange(e.target.value)}
          className={cn(
            'w-full rounded-xl border bg-paper/60 py-2.5 pr-3.5 pl-10 font-mono text-[15px] text-ink placeholder:text-ink-faint',
            'focus:bg-card focus:outline-none focus:ring-2',
            computed === null && raw.trim()
              ? 'border-rust/50 focus:border-rust focus:ring-rust/20'
              : 'border-line focus:border-amber focus:ring-amber/20',
            'transition-colors',
          )}
        />
      </div>
      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald">
              <Calculator size={13} />
              <span className="font-mono font-semibold">
                = Rp {formatNumber(computed)}
              </span>
            </div>
          </motion.div>
        )}
        {computed === null && raw.trim() && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-1.5 text-xs text-rust"
          >
            Tidak bisa dihitung — cek angkanya
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
