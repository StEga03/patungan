import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Hapus',
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]" onClick={onCancel} />
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="relative z-10 w-full max-w-xs rounded-3xl border border-line bg-card p-5 text-center shadow-[var(--shadow-pop)]"
          >
            <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full bg-rust-soft text-rust">
              <AlertTriangle size={22} />
            </div>
            <h3 className="font-display text-lg font-semibold text-ink">
              {title}
            </h3>
            <p className="mt-1 text-sm text-ink-soft">{message}</p>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <Button variant="soft" onClick={onCancel}>
                Batal
              </Button>
              <Button
                variant="primary"
                className="bg-rust hover:bg-rust/90"
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
