import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarDays,
  Check,
  Plus,
  Receipt,
  Tag,
  Users2,
  X,
  Zap,
} from 'lucide-react'
import { Avatar } from './ui/Avatar'
import { Button } from './ui/Button'
import { Card, CardHeader } from './ui/Card'
import { Label, TextInput } from './ui/TextInput'
import { AmountInput } from './AmountInput'
import { ItemEditor } from './ItemEditor'
import { cn } from '@/lib/cn'
import { chargeAmount, discountAmount, itemNetto } from '@/lib/calc'
import { todayStr } from '@/lib/date'
import { digitsToNumber, evalAmount, formatRupiah, groupDigits } from '@/lib/money'
import type {
  Charge,
  DiskonBasis,
  Item,
  Member,
  SplitMode,
  Transaction,
} from '@/lib/types'
import type { NewTransaction } from '@/hooks/useStore'

const PRESETS = ['🅿️ Parkir', '🚗 Bensin', '🛣️ E-toll', '🍽️ Makan', '🥤 Minum']

/** Mutable form state for a charge (value kept as a raw string). */
function useCharge(initial?: Charge) {
  const [tipe, setTipeState] = useState<Charge['tipe']>(initial?.tipe ?? 'persen')
  const [raw, setRaw] = useState(initial?.nilai ? String(initial.nilai) : '')
  const nilai = tipe === 'persen' ? Number(raw) || 0 : digitsToNumber(raw)
  const charge: Charge = { tipe, nilai }
  // switching %/Rp clears the value — "20" percent is not "20" rupiah
  const setTipe = (next: Charge['tipe']) => {
    if (next === tipe) return
    setTipeState(next)
    setRaw('')
  }
  return { tipe, setTipe, raw, setRaw, nilai, charge }
}

export function AddTransaction({
  anggota,
  editing,
  onSubmit,
  onCancelEdit,
}: {
  anggota: Member[]
  editing: Transaction | null
  onSubmit: (data: NewTransaction) => void
  onCancelEdit: () => void
}) {
  // pickers show active members + any already referenced by the edited tx
  const editingRefs = new Set(
    editing
      ? [
          editing.pembayarId,
          ...editing.pesertaId,
          ...(editing.items?.flatMap((i) => i.pesertaId) ?? []),
        ]
      : [],
  )
  const pickMembers = anggota.filter(
    (m) => m.aktif !== false || editingRefs.has(m.id),
  )
  const allIds = pickMembers.map((m) => m.id)

  const [mode, setMode] = useState<SplitMode>(editing?.mode ?? 'rata')
  const [deskripsi, setDeskripsi] = useState(editing?.deskripsi ?? '')
  const [tanggal, setTanggal] = useState(editing?.tanggal ?? todayStr())
  const [raw, setRaw] = useState(
    editing && editing.mode !== 'item'
      ? editing.jumlah.toLocaleString('id-ID')
      : '',
  )
  const [pembayarId, setPembayarId] = useState(
    editing?.pembayarId ?? allIds[0] ?? '',
  )
  const [pesertaId, setPesertaId] = useState<string[]>(
    editing && editing.mode !== 'item' ? editing.pesertaId : allIds,
  )
  const [items, setItems] = useState<Item[]>(editing?.items ?? [])
  const pajak = useCharge(editing?.pajak)
  const layanan = useCharge(editing?.layanan)
  const diskon = useCharge(editing?.diskon)
  const [diskonBasis, setDiskonBasis] = useState<DiskonBasis>(
    editing?.diskon?.basis ?? 'sebelum',
  )
  const [showDiskonRata, setShowDiskonRata] = useState(
    !!editing?.diskon && editing.mode !== 'item',
  )

  // ---- derived: item mode totals -----------------------------------------
  const validItems = items.filter((i) => i.harga > 0 && i.pesertaId.length > 0)
  const subtotalBruto = validItems.reduce((s, i) => s + i.harga, 0)
  const subtotalAll = validItems.reduce((s, i) => s + itemNetto(i), 0)
  const diskonItemTotal = subtotalBruto - subtotalAll
  // mirrors resolveTotals() in calc.ts
  const itemAfterTax = diskonBasis === 'setelah'
  const diskonBase = itemAfterTax
    ? subtotalAll +
      chargeAmount(pajak.charge, subtotalAll) +
      chargeAmount(layanan.charge, subtotalAll)
    : subtotalAll
  const diskonTotal = discountAmount(diskon.charge, diskonBase)
  const taxBase = itemAfterTax ? subtotalAll : subtotalAll - diskonTotal
  const pajakTotal = chargeAmount(pajak.charge, taxBase)
  const layananTotal = chargeAmount(layanan.charge, taxBase)
  const itemTotal = itemAfterTax
    ? subtotalAll + pajakTotal + layananTotal - diskonTotal
    : taxBase + pajakTotal + layananTotal

  // ---- derived: rata mode --------------------------------------------------
  const jumlahRata = evalAmount(raw)
  const diskonRata = discountAmount(diskon.charge, jumlahRata ?? 0)
  const totalRata = (jumlahRata ?? 0) - diskonRata

  const valid =
    deskripsi.trim() &&
    pembayarId &&
    (mode === 'rata'
      ? jumlahRata !== null && totalRata > 0 && pesertaId.length > 0
      : validItems.length > 0 && itemTotal > 0)

  const reset = () => {
    setMode('rata')
    setDeskripsi('')
    setTanggal(todayStr())
    setRaw('')
    setPembayarId(allIds[0] ?? '')
    setPesertaId(allIds)
    setItems([])
    pajak.setRaw('')
    layanan.setRaw('')
    diskon.setRaw('')
    setDiskonBasis('sebelum')
    setShowDiskonRata(false)
  }

  const submit = () => {
    if (!valid) return
    const base = { deskripsi: deskripsi.trim(), tanggal, pembayarId }
    if (mode === 'rata' && jumlahRata !== null) {
      onSubmit({
        ...base,
        jumlah: jumlahRata,
        pesertaId,
        mode: 'rata',
        // basis is meaningless without pajak/layanan, so it isn't stored here
        ...(diskon.nilai > 0 ? { diskon: diskon.charge } : {}),
      })
    } else {
      const union = Array.from(new Set(validItems.flatMap((i) => i.pesertaId)))
      onSubmit({
        ...base,
        jumlah: itemTotal,
        pesertaId: union,
        mode: 'item',
        items: validItems,
        ...(pajak.nilai > 0 ? { pajak: pajak.charge } : {}),
        ...(layanan.nilai > 0 ? { layanan: layanan.charge } : {}),
        ...(diskon.nilai > 0
          ? { diskon: { ...diskon.charge, basis: diskonBasis } }
          : {}),
      })
    }
    if (editing) onCancelEdit()
    reset()
  }

  // preset keeps the current mode (#9); just fills description & (rata) peserta
  const applyPreset = (label: string) => {
    setDeskripsi(label)
    if (mode === 'rata') {
      setPesertaId(allIds)
      document.getElementById('amt')?.focus()
    }
  }

  const togglePeserta = (id: string) =>
    setPesertaId((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    )

  const allSelected = pesertaId.length === pickMembers.length

  return (
    <Card className={cn(editing && 'ring-2 ring-amber/40')}>
      <CardHeader
        icon={<Receipt size={16} className="text-amber" />}
        title={editing ? 'Edit transaksi' : 'Tambah transaksi'}
        action={
          editing ? (
            <Button variant="ghost" onClick={onCancelEdit}>
              <X size={16} /> Batal
            </Button>
          ) : undefined
        }
      />
      <div className="space-y-4 px-5 pb-5">
        {!editing && (
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => applyPreset(p)}
                className="rounded-full border border-line bg-paper-2 px-2.5 py-1 text-xs font-medium text-ink-soft hover:border-amber hover:text-amber"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* mode toggle */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-paper-2 p-1">
          {(['rata', 'item'] as const).map((mvalue) => (
            <button
              key={mvalue}
              onClick={() => setMode(mvalue)}
              className={cn(
                'rounded-lg py-1.5 text-sm font-semibold transition-colors',
                mode === mvalue
                  ? 'bg-card text-ink shadow-[var(--shadow-card)]'
                  : 'text-ink-soft hover:text-ink',
              )}
            >
              {mvalue === 'rata' ? 'Bagi rata' : 'Per item'}
            </button>
          ))}
        </div>

        <div>
          <Label htmlFor="desk">Description</Label>
          <TextInput
            id="desk"
            placeholder={
              mode === 'item' ? 'mis. Nongkrong Cafe' : 'mis. Makan, Bensin'
            }
            value={deskripsi}
            onChange={(e) => setDeskripsi(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="tgl">Date</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <CalendarDays
                size={15}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-faint"
              />
              <TextInput
                id="tgl"
                type="date"
                value={tanggal}
                max={todayStr()}
                onChange={(e) => setTanggal(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="soft" onClick={() => setTanggal(todayStr())}>
              Hari ini
            </Button>
          </div>
        </div>

        {mode === 'rata' && (
          <div>
            <Label htmlFor="amt">Amount</Label>
            <AmountInput id="amt" raw={raw} onRawChange={setRaw} />
            {showDiskonRata ? (
              <div className="mt-2.5">
                <ChargeField
                  label="Diskon"
                  tipe={diskon.tipe}
                  setTipe={diskon.setTipe}
                  raw={diskon.raw}
                  setRaw={diskon.setRaw}
                />
              </div>
            ) : (
              <button
                onClick={() => setShowDiskonRata(true)}
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-amber hover:underline"
              >
                <Tag size={12} /> Tambah diskon
              </button>
            )}
            {jumlahRata !== null && jumlahRata > 0 && diskonRata > 0 && (
              <div className="mt-2 space-y-1 rounded-xl bg-paper-2 px-3.5 py-2.5 font-mono text-xs">
                <div className="flex justify-between text-ink-soft">
                  <span>Jumlah</span>
                  <span>{formatRupiah(jumlahRata)}</span>
                </div>
                <div className="flex justify-between text-emerald">
                  <span>
                    Diskon
                    {diskon.tipe === 'persen' ? ` ${diskon.nilai}%` : ''}
                  </span>
                  <span>−{formatRupiah(diskonRata)}</span>
                </div>
                <div className="flex justify-between border-t border-line pt-1 font-bold text-ink">
                  <span>Total</span>
                  <span>{formatRupiah(totalRata)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <Label>Paid By</Label>
          <div className="flex flex-wrap gap-2">
            {pickMembers.map((m) => {
              const on = m.id === pembayarId
              return (
                <button
                  key={m.id}
                  onClick={() => setPembayarId(m.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border py-1 pr-3 pl-1 text-sm font-medium transition-colors',
                    on
                      ? 'border-ink bg-ink text-paper'
                      : 'border-line bg-paper-2 text-ink-soft hover:border-line-strong',
                  )}
                >
                  <Avatar nama={m.nama} warna={m.warna} size="sm" />
                  {m.nama}
                </button>
              )
            })}
          </div>
        </div>

        {mode === 'rata' ? (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <Label>
                <span className="inline-flex items-center gap-1">
                  <Users2 size={12} /> Split With
                </span>
              </Label>
              <button
                onClick={() => setPesertaId(allSelected ? [] : allIds)}
                className="text-[11px] font-semibold text-amber hover:underline"
              >
                {allSelected ? 'Kosongkan' : 'Pilih semua'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {pickMembers.map((m) => {
                const on = pesertaId.includes(m.id)
                return (
                  <button
                    key={m.id}
                    onClick={() => togglePeserta(m.id)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border py-1 pr-3 pl-1 text-sm font-medium transition-colors',
                      on
                        ? 'border-emerald/40 bg-emerald-soft text-emerald'
                        : 'border-line bg-paper-2 text-ink-faint',
                    )}
                  >
                    <span className="relative">
                      <Avatar
                        nama={m.nama}
                        warna={m.warna}
                        size="sm"
                        className={cn(!on && 'opacity-40')}
                      />
                      {on && (
                        <span className="absolute -right-0.5 -bottom-0.5 grid h-3 w-3 place-items-center rounded-full bg-emerald text-white ring-1 ring-card">
                          <Check size={8} strokeWidth={4} />
                        </span>
                      )}
                    </span>
                    {m.nama}
                  </button>
                )
              })}
            </div>
            {pesertaId.length > 0 && totalRata > 0 && (
              <motion.p
                key={`${totalRata}-${pesertaId.length}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 font-mono text-xs text-ink-soft"
              >
                ≈ {formatRupiah(Math.floor(totalRata / pesertaId.length))} /
                orang
              </motion.p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <Label>
              <span className="inline-flex items-center gap-1">
                <Receipt size={12} /> Items
              </span>
            </Label>
            <ItemEditor anggota={pickMembers} items={items} onChange={setItems} />

            <div className="grid grid-cols-2 gap-2">
              <ChargeField
                label="Tax"
                tipe={pajak.tipe}
                setTipe={pajak.setTipe}
                raw={pajak.raw}
                setRaw={pajak.setRaw}
              />
              <ChargeField
                label="Service"
                tipe={layanan.tipe}
                setTipe={layanan.setTipe}
                raw={layanan.raw}
                setRaw={layanan.setRaw}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ChargeField
                label="Diskon"
                tipe={diskon.tipe}
                setTipe={diskon.setTipe}
                raw={diskon.raw}
                setRaw={diskon.setRaw}
              />
              {diskon.nilai > 0 && (pajak.nilai > 0 || layanan.nilai > 0) && (
                <div>
                  <Label>Diskon dihitung</Label>
                  <div className="flex overflow-hidden rounded-xl border border-line">
                    {(
                      [
                        ['sebelum', 'sebelum pajak'],
                        ['setelah', 'setelah pajak'],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        onClick={() => setDiskonBasis(value)}
                        className={cn(
                          'flex-1 py-2 text-[11px] font-semibold transition-colors',
                          diskonBasis === value
                            ? 'bg-ink text-paper'
                            : 'bg-paper-2 text-ink-soft',
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="text-[11px] text-ink-faint">
              Pajak, layanan &amp; diskon dibagi proporsional ke porsi pesanan
              tiap orang. Diskon per item (🏷) cuma kena ke peserta item itu.
            </p>

            {subtotalBruto > 0 && (
              <div className="space-y-1 rounded-xl bg-paper-2 px-3.5 py-2.5 font-mono text-xs">
                <div className="flex justify-between text-ink-soft">
                  <span>Subtotal</span>
                  <span>{formatRupiah(subtotalBruto)}</span>
                </div>
                {diskonItemTotal > 0 && (
                  <div className="flex justify-between text-emerald">
                    <span>Diskon item</span>
                    <span>−{formatRupiah(diskonItemTotal)}</span>
                  </div>
                )}
                {diskonTotal > 0 && !itemAfterTax && (
                  <div className="flex justify-between text-emerald">
                    <span>
                      Diskon{diskon.tipe === 'persen' ? ` ${diskon.nilai}%` : ''}
                    </span>
                    <span>−{formatRupiah(diskonTotal)}</span>
                  </div>
                )}
                {pajakTotal > 0 && (
                  <div className="flex justify-between text-ink-soft">
                    <span>Pajak</span>
                    <span>{formatRupiah(pajakTotal)}</span>
                  </div>
                )}
                {layananTotal > 0 && (
                  <div className="flex justify-between text-ink-soft">
                    <span>Layanan</span>
                    <span>{formatRupiah(layananTotal)}</span>
                  </div>
                )}
                {diskonTotal > 0 && itemAfterTax && (
                  <div className="flex justify-between text-emerald">
                    <span>
                      Diskon{diskon.tipe === 'persen' ? ` ${diskon.nilai}%` : ''}
                    </span>
                    <span>−{formatRupiah(diskonTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-line pt-1 font-bold text-ink">
                  <span>Total</span>
                  <span>{formatRupiah(itemTotal)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <Button className="w-full" disabled={!valid} onClick={submit}>
          {editing ? (
            <>
              <Check size={18} /> Simpan perubahan
            </>
          ) : mode === 'item' ? (
            <>
              <Zap size={17} /> Tambah · {formatRupiah(itemTotal)}
            </>
          ) : (
            <>
              <Plus size={18} /> Tambah
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}

/** One charge field: a %/Rp toggle + numeric input. */
function ChargeField({
  label,
  tipe,
  setTipe,
  raw,
  setRaw,
}: {
  label: string
  tipe: Charge['tipe']
  setTipe: (t: Charge['tipe']) => void
  raw: string
  setRaw: (v: string) => void
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-1.5">
        <div className="flex overflow-hidden rounded-xl border border-line">
          {(['persen', 'rupiah'] as const).map((tp) => (
            <button
              key={tp}
              onClick={() => setTipe(tp)}
              className={cn(
                'px-2.5 py-2 text-xs font-bold transition-colors',
                tipe === tp ? 'bg-ink text-paper' : 'bg-paper-2 text-ink-soft',
              )}
            >
              {tp === 'persen' ? '%' : 'Rp'}
            </button>
          ))}
        </div>
        <TextInput
          inputMode="decimal"
          placeholder={tipe === 'persen' ? '11' : '0'}
          value={tipe === 'rupiah' ? groupDigits(raw) : raw}
          onChange={(e) =>
            setRaw(
              tipe === 'persen'
                ? e.target.value.replace(/[^\d.]/g, '')
                : e.target.value.replace(/[^\d]/g, ''),
            )
          }
          className="min-w-0 flex-1 px-2 text-right font-mono"
        />
      </div>
    </div>
  )
}
