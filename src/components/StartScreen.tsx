import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, History, Moon, Plus, Sun, Wallet, X } from 'lucide-react'
import { Avatar } from './ui/Avatar'
import { Button } from './ui/Button'
import { Label, TextInput } from './ui/TextInput'
import { colorForIndex } from '@/lib/colors'
import type { Theme } from '@/hooks/useTheme'
import type { Session } from '@/lib/types'

export function StartScreen({
  onStart,
  archived,
  onOpenArchived,
  theme,
  onToggleTheme,
}: {
  onStart: (nama: string, anggota: string[]) => void
  archived: Session[]
  onOpenArchived: () => void
  theme: Theme
  onToggleTheme: () => void
}) {
  const [nama, setNama] = useState('')
  const [members, setMembers] = useState<string[]>([])
  const [draft, setDraft] = useState('')

  const addMember = () => {
    const t = draft.trim()
    if (!t) return
    setMembers((m) => [...m, t])
    setDraft('')
  }

  const canStart = nama.trim() && members.length >= 2

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mx-auto flex min-h-[100svh] w-full max-w-md flex-col justify-center px-5 py-10"
    >
      <button
        onClick={onToggleTheme}
        className="absolute top-5 right-5 grid h-10 w-10 place-items-center rounded-xl border border-line bg-card text-ink-soft shadow-[var(--shadow-card)] hover:text-ink"
        aria-label={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
      >
        {theme === 'dark' ? (
          <Sun size={18} className="text-amber-soft" />
        ) : (
          <Moon size={18} />
        )}
      </button>

      <div className="mb-8 text-center">
        <div className="mb-4 inline-grid h-14 w-14 place-items-center rounded-2xl bg-ink text-paper shadow-[var(--shadow-pop)]">
          <Wallet size={26} />
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          Patungan
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Catat patungan, hitung transfer paling sedikit.
        </p>
      </div>

      <div className="rounded-[var(--radius-card)] border border-line bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="mb-4">
          <Label htmlFor="nama-sesi">Group Name</Label>
          <TextInput
            id="nama-sesi"
            placeholder="mis. Trip Bandung"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
          />
        </div>

        <Label>Members</Label>
        {members.length > 0 && (
          <div className="mb-2.5 flex flex-wrap gap-2">
            {members.map((m, i) => (
              <motion.span
                key={`${m}-${i}`}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 rounded-full border border-line bg-paper-2 py-1 pr-1.5 pl-1 text-sm font-medium"
              >
                <Avatar nama={m} warna={colorForIndex(i)} size="sm" />
                {m}
                <button
                  onClick={() =>
                    setMembers((arr) => arr.filter((_, idx) => idx !== i))
                  }
                  className="grid h-5 w-5 place-items-center rounded-full text-ink-faint hover:bg-line hover:text-rust"
                  aria-label={`Hapus ${m}`}
                >
                  <X size={12} />
                </button>
              </motion.span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <TextInput
            placeholder="Tambah nama…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addMember()}
          />
          <Button variant="soft" onClick={addMember} aria-label="Tambah anggota">
            <Plus size={18} />
          </Button>
        </div>

        <Button
          className="mt-5 w-full"
          disabled={!canStart}
          onClick={() => onStart(nama, members)}
        >
          Mulai patungan
          <ArrowRight size={18} />
        </Button>
        {!canStart && (
          <p className="mt-2 text-center text-xs text-ink-faint">
            Isi nama & minimal 2 anggota
          </p>
        )}
      </div>

      {archived.length > 0 && (
        <button
          onClick={onOpenArchived}
          className="mt-6 inline-flex items-center justify-center gap-2 self-center text-sm font-medium text-ink-soft hover:text-ink"
        >
          <History size={15} />
          Lihat riwayat ({archived.length})
        </button>
      )}
    </motion.div>
  )
}
