import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

/** A centered modal on desktop, bottom sheet on mobile. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.6 }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="relative z-10 flex max-h-[90svh] w-full max-w-md flex-col rounded-t-3xl border border-line bg-card shadow-[var(--shadow-pop)] sm:max-h-[85svh] sm:rounded-3xl"
          >
            <div className="flex shrink-0 items-center justify-between px-5 pt-5 pb-4">
              <h3 className="font-display text-lg font-semibold text-ink">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-paper-2"
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
