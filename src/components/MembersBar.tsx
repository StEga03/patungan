import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Plus, RotateCcw, Users, X } from 'lucide-react'
import { Avatar } from './ui/Avatar'
import { Card, CardHeader } from './ui/Card'
import { TextInput } from './ui/TextInput'
import { ConfirmDialog } from './ui/ConfirmDialog'
import type { Member } from '@/lib/types'

export function MembersBar({
  anggota,
  onAdd,
  onRemove,
  onReactivate,
}: {
  anggota: Member[]
  onAdd: (nama: string) => void
  onRemove: (id: string) => void
  onReactivate: (id: string) => void
}) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const [confirm, setConfirm] = useState<Member | null>(null)

  const aktif = anggota.filter((m) => m.aktif !== false)
  const nonaktif = anggota.filter((m) => m.aktif === false)

  const commit = () => {
    if (draft.trim()) onAdd(draft)
    setDraft('')
    setAdding(false)
  }

  return (
    <Card>
      <CardHeader
        icon={<Users size={16} className="text-amber" />}
        title={`Anggota · ${aktif.length}`}
      />
      <div className="flex flex-wrap gap-2 px-5 pb-4">
        <AnimatePresence mode="popLayout">
          {aktif.map((m) => (
            <motion.span
              key={m.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="group flex items-center gap-1.5 rounded-full border border-line bg-paper-2 py-1 pr-2.5 pl-1 text-sm font-medium"
            >
              <Avatar nama={m.nama} warna={m.warna} size="sm" />
              {m.nama}
              <button
                onClick={() => setConfirm(m)}
                className="-mr-1 grid h-4 w-4 place-items-center rounded-full text-ink-faint opacity-0 transition-opacity group-hover:opacity-100 hover:text-rust"
                aria-label={`Hapus ${m.nama}`}
              >
                <X size={12} />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>

        {adding ? (
          <span className="flex items-center gap-1">
            <TextInput
              autoFocus
              value={draft}
              placeholder="Nama…"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit()
                if (e.key === 'Escape') setAdding(false)
              }}
              onBlur={commit}
              className="h-8 w-28 py-1"
            />
            <button
              onClick={commit}
              className="grid h-8 w-8 place-items-center rounded-full bg-emerald text-white"
              aria-label="Simpan"
            >
              <Check size={15} />
            </button>
          </span>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 rounded-full border border-dashed border-line-strong px-3 py-1 text-sm font-medium text-ink-soft hover:border-amber hover:text-amber"
          >
            <Plus size={14} />
            tambah
          </button>
        )}
      </div>

      {nonaktif.length > 0 && (
        <div className="border-t border-line px-5 py-3">
          <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-ink-faint uppercase">
            Nonaktif · masih dihitung di transaksi lama
          </p>
          <div className="flex flex-wrap gap-2">
            {nonaktif.map((m) => (
              <button
                key={m.id}
                onClick={() => onReactivate(m.id)}
                className="flex items-center gap-1.5 rounded-full border border-dashed border-line px-2.5 py-1 text-sm font-medium text-ink-faint hover:border-emerald hover:text-emerald"
                title={`Aktifkan ${m.nama}`}
              >
                <Avatar
                  nama={m.nama}
                  warna={m.warna}
                  size="sm"
                  className="opacity-50"
                />
                {m.nama}
                <RotateCcw size={12} />
              </button>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={`Hapus ${confirm?.nama ?? ''}?`}
        message="Kalau dia sudah ada di transaksi, dia di-nonaktifkan (transaksi lama tetap utuh) dan bisa diaktifkan lagi kapan saja."
        confirmLabel="Hapus"
        onConfirm={() => {
          if (confirm) onRemove(confirm.id)
          setConfirm(null)
        }}
        onCancel={() => setConfirm(null)}
      />
    </Card>
  )
}
