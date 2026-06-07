import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { groupDigits } from '@/lib/money'
import { uid } from '@/lib/id'
import type { Item, Member } from '@/lib/types'

/** Editor for the list of ordered items in a per-item split. */
export function ItemEditor({
  anggota,
  items,
  onChange,
}: {
  anggota: Member[]
  items: Item[]
  onChange: (items: Item[]) => void
}) {
  const allIds = anggota.map((m) => m.id)

  const update = (id: string, patch: Partial<Item>) =>
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))

  const remove = (id: string) => onChange(items.filter((it) => it.id !== id))

  // new items start with NO participants selected (#1)
  const add = () =>
    onChange([...items, { id: uid(), nama: '', harga: 0, pesertaId: [] }])

  const togglePeserta = (item: Item, mid: string) => {
    const next = item.pesertaId.includes(mid)
      ? item.pesertaId.filter((x) => x !== mid)
      : [...item.pesertaId, mid]
    update(item.id, { pesertaId: next })
  }

  return (
    <div className="space-y-2.5">
      <AnimatePresence initial={false}>
        {items.map((item, idx) => {
          const allOn = item.pesertaId.length === anggota.length
          return (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl border border-line bg-paper/50 p-2.5"
            >
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-paper-2 font-mono text-[11px] text-ink-soft">
                  {idx + 1}
                </span>
                <input
                  value={item.nama}
                  onChange={(e) => update(item.id, { nama: e.target.value })}
                  placeholder="Nama item"
                  className="min-w-0 flex-1 rounded-lg border border-line bg-card px-2.5 py-1.5 text-sm font-medium text-ink placeholder:text-ink-faint focus:border-amber focus:outline-none"
                />
                <div className="relative w-28 shrink-0">
                  <span className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 font-mono text-[11px] text-ink-faint">
                    Rp
                  </span>
                  <input
                    inputMode="numeric"
                    value={item.harga ? groupDigits(String(item.harga)) : ''}
                    onChange={(e) =>
                      update(item.id, {
                        harga: Number(e.target.value.replace(/[^\d]/g, '')) || 0,
                      })
                    }
                    placeholder="0"
                    className="w-full rounded-lg border border-line bg-card py-1.5 pr-2 pl-7 text-right font-mono text-sm text-ink focus:border-amber focus:outline-none"
                  />
                </div>
                <button
                  onClick={() => remove(item.id)}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-ink-faint hover:bg-rust-soft hover:text-rust"
                  aria-label="Hapus item"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium text-ink-faint">
                  Split:
                </span>
                {anggota.map((m) => {
                  const on = item.pesertaId.includes(m.id)
                  return (
                    <button
                      key={m.id}
                      onClick={() => togglePeserta(item, m.id)}
                      className={cn(
                        'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                        on
                          ? 'border-emerald/40 bg-emerald-soft text-emerald'
                          : 'border-line bg-paper-2 text-ink-faint hover:border-line-strong',
                      )}
                    >
                      {m.nama}
                    </button>
                  )
                })}
                <button
                  onClick={() =>
                    update(item.id, { pesertaId: allOn ? [] : allIds })
                  }
                  className="ml-auto text-[11px] font-semibold text-amber hover:underline"
                >
                  {allOn ? 'kosongkan' : 'semua'}
                </button>
              </div>
              {item.harga > 0 && item.pesertaId.length === 0 && (
                <p className="mt-1.5 text-[11px] text-rust">
                  Pilih minimal 1 orang untuk item ini
                </p>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>

      <button
        onClick={add}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-line-strong py-2 text-sm font-medium text-ink-soft hover:border-amber hover:text-amber"
      >
        <Plus size={15} /> Tambah item
      </button>
    </div>
  )
}
