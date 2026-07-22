import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Tag, Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { itemNetto } from '@/lib/calc'
import { formatRupiah, groupDigits } from '@/lib/money'
import { uid } from '@/lib/id'
import type { Charge, Item, Member } from '@/lib/types'

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
  // which items show their discount row (an existing discount opens it)
  const [openDiskon, setOpenDiskon] = useState<Record<string, boolean>>({})

  const update = (id: string, patch: Partial<Item>) =>
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))

  const remove = (id: string) => onChange(items.filter((it) => it.id !== id))

  const toggleDiskon = (item: Item) => {
    const next = !(openDiskon[item.id] ?? !!item.diskon)
    setOpenDiskon((cur) => ({ ...cur, [item.id]: next }))
    if (!next && item.diskon) update(item.id, { diskon: undefined })
  }

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
          const diskonOn = openDiskon[item.id] ?? !!item.diskon
          const netto = itemNetto(item)
          const potongan = Math.max(0, item.harga) - netto
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
                  onClick={() => toggleDiskon(item)}
                  className={cn(
                    'grid h-7 w-7 shrink-0 place-items-center rounded-lg transition-colors',
                    diskonOn
                      ? 'bg-amber-soft text-amber'
                      : 'text-ink-faint hover:bg-paper-2 hover:text-amber',
                  )}
                  aria-label="Diskon item"
                  aria-pressed={diskonOn}
                >
                  <Tag size={14} />
                </button>
                <button
                  onClick={() => remove(item.id)}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-ink-faint hover:bg-rust-soft hover:text-rust"
                  aria-label="Hapus item"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {diskonOn && (
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-ink-faint">
                    Diskon
                  </span>
                  <DiskonInput
                    diskon={item.diskon}
                    onChange={(d) => update(item.id, { diskon: d })}
                  />
                  {potongan > 0 && (
                    <span className="ml-auto font-mono text-[11px] text-emerald">
                      −{formatRupiah(potongan)} → {formatRupiah(netto)}
                    </span>
                  )}
                </div>
              )}

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
              {diskonBerlebih(item) && (
                <p className="mt-1.5 text-[11px] text-rust">
                  Diskon melebihi harga item — dipotong maksimal jadi Rp 0
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

/** Would this item's discount overshoot its price (and get clamped)? */
function diskonBerlebih(item: Item): boolean {
  const d = item.diskon
  if (!d || d.nilai <= 0 || item.harga <= 0) return false
  return d.tipe === 'persen' ? d.nilai > 100 : d.nilai > item.harga
}

/** Compact %/Rp discount editor used inside one item row. */
function DiskonInput({
  diskon,
  onChange,
}: {
  diskon?: Charge
  onChange: (d: Charge | undefined) => void
}) {
  const [tipe, setTipe] = useState<Charge['tipe']>(diskon?.tipe ?? 'persen')
  const [raw, setRaw] = useState(diskon?.nilai ? String(diskon.nilai) : '')

  const emit = (tp: Charge['tipe'], value: string) => {
    const nilai =
      tp === 'persen' ? Number(value) || 0 : Number(value.replace(/[^\d]/g, '')) || 0
    onChange(nilai > 0 ? { tipe: tp, nilai } : undefined)
  }

  return (
    <div className="flex flex-1 gap-1.5">
      <div className="flex overflow-hidden rounded-lg border border-line">
        {(['persen', 'rupiah'] as const).map((tp) => (
          <button
            key={tp}
            onClick={() => {
              if (tp === tipe) return
              // switching %/Rp clears the value — "50" percent is not "50" rupiah
              setTipe(tp)
              setRaw('')
              emit(tp, '')
            }}
            className={cn(
              'px-2 py-1 text-[11px] font-bold transition-colors',
              tipe === tp ? 'bg-ink text-paper' : 'bg-paper-2 text-ink-soft',
            )}
          >
            {tp === 'persen' ? '%' : 'Rp'}
          </button>
        ))}
      </div>
      <input
        inputMode="decimal"
        placeholder={tipe === 'persen' ? '10' : '0'}
        value={tipe === 'rupiah' ? groupDigits(raw) : raw}
        onChange={(e) => {
          const next =
            tipe === 'persen'
              ? e.target.value.replace(/[^\d.]/g, '')
              : e.target.value.replace(/[^\d]/g, '')
          setRaw(next)
          emit(tipe, next)
        }}
        className="w-20 rounded-lg border border-line bg-card px-2 py-1 text-right font-mono text-xs text-ink focus:border-amber focus:outline-none"
      />
    </div>
  )
}
