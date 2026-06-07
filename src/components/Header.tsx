import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Layers, Moon, Pencil, Sun } from 'lucide-react'
import type { Theme } from '@/hooks/useTheme'

export function Header({
  nama,
  onRename,
  onOpenMenu,
  theme,
  onToggleTheme,
}: {
  nama: string
  onRename: (nama: string) => void
  onOpenMenu: () => void
  theme: Theme
  onToggleTheme: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(nama)

  const commit = () => {
    if (draft.trim()) onRename(draft)
    setEditing(false)
  }

  return (
    <header className="flex items-center justify-between gap-3 pt-2 pb-4">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold tracking-widest text-amber uppercase">
          Patungan
        </p>
        {editing ? (
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit()
                if (e.key === 'Escape') setEditing(false)
              }}
              className="w-full border-b-2 border-amber bg-transparent font-display text-2xl font-semibold tracking-tight text-ink focus:outline-none"
            />
            <button
              onClick={commit}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald text-white"
              aria-label="Simpan nama"
            >
              <Check size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setDraft(nama)
              setEditing(true)
            }}
            className="group flex items-center gap-2"
          >
            <h1 className="truncate font-display text-2xl font-semibold tracking-tight text-ink">
              {nama}
            </h1>
            <Pencil
              size={14}
              className="shrink-0 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100"
            />
          </button>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={onToggleTheme}
          className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-card text-ink-soft shadow-[var(--shadow-card)] hover:text-ink"
          aria-label={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
              transition={{ duration: 0.18 }}
              className="grid place-items-center"
            >
              {theme === 'dark' ? (
                <Sun size={18} className="text-amber-soft" />
              ) : (
                <Moon size={18} />
              )}
            </motion.span>
          </AnimatePresence>
        </button>
        <button
          onClick={onOpenMenu}
          className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-card text-ink-soft shadow-[var(--shadow-card)] hover:text-ink"
          aria-label="Menu patungan"
        >
          <Layers size={18} />
        </button>
      </div>
    </header>
  )
}
