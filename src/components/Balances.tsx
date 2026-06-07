import { Fragment, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Scale } from 'lucide-react'
import { Avatar } from './ui/Avatar'
import { Card, CardHeader } from './ui/Card'
import { computeMemberLedger } from '@/lib/calc'
import { formatRupiah } from '@/lib/money'
import { cn } from '@/lib/cn'
import type { Balance, Breakdown, Member, Transaction } from '@/lib/types'

export function Balances({
  balances,
  breakdown,
  anggota,
  transaksi,
}: {
  balances: Balance[]
  breakdown: Breakdown[]
  anggota: Member[]
  transaksi: Transaction[]
}) {
  const byId = new Map(anggota.map((m) => [m.id, m]))
  const bdById = new Map(breakdown.map((b) => [b.memberId, b]))
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <Card>
      <CardHeader
        icon={<Scale size={16} className="text-amber" />}
        title="Saldo tiap orang"
      />
      <div className="grid grid-cols-2 gap-2.5 px-5 sm:grid-cols-3">
        {balances.map((b, i) => {
          const m = byId.get(b.memberId)
          if (!m) return null
          const pos = b.nilai > 0
          const neg = b.nilai < 0
          return (
            <motion.div
              key={b.memberId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={cn(
                'rounded-xl border p-3 text-center',
                pos && 'border-emerald/30 bg-emerald-soft',
                neg && 'border-rust/30 bg-rust-soft',
                !pos && !neg && 'border-line bg-paper-2',
              )}
            >
              <Avatar
                nama={m.nama}
                warna={m.warna}
                size="md"
                className="mx-auto mb-1.5"
              />
              <p className="truncate text-xs font-semibold text-ink">
                {m.nama}
              </p>
              <p
                className={cn(
                  'mt-0.5 font-mono text-sm font-bold',
                  pos && 'text-emerald',
                  neg && 'text-rust',
                  !pos && !neg && 'text-ink-faint',
                )}
              >
                {formatRupiah(b.nilai)}
              </p>
              <p className="text-[10px] text-ink-faint">
                {pos ? 'terima' : neg ? 'bayar' : 'lunas'}
              </p>
            </motion.div>
          )
        })}
      </div>

      {/* transparency: how each balance is formed */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="mt-3 flex w-full items-center justify-center gap-1 px-5 pb-4 text-xs font-semibold text-ink-soft hover:text-ink"
      >
        {open ? 'Sembunyikan rincian' : 'Lihat rincian perhitungan'}
        <ChevronDown
          size={14}
          className={cn('transition-transform', open && 'rotate-180')}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mx-5 mb-5 overflow-hidden rounded-xl border border-line">
              <table className="w-full text-right font-mono text-xs">
                <thead>
                  <tr className="bg-paper-2 text-[10px] tracking-wide text-ink-faint uppercase">
                    <th className="px-3 py-2 text-left font-semibold">Orang</th>
                    <th className="px-2 py-2 font-semibold">Nalangin</th>
                    <th className="px-2 py-2 font-semibold">Pakai</th>
                    <th className="px-3 py-2 font-semibold">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {anggota.map((m) => {
                    const bd = bdById.get(m.id)
                    if (!bd) return null
                    const isOpen = expanded === m.id
                    const ledger = isOpen
                      ? computeMemberLedger(m.id, anggota, transaksi)
                      : null
                    return (
                      <Fragment key={m.id}>
                        <tr
                          onClick={() =>
                            setExpanded((cur) => (cur === m.id ? null : m.id))
                          }
                          className="cursor-pointer border-t border-line hover:bg-paper-2/60"
                        >
                          <td className="px-3 py-2 text-left font-sans font-medium text-ink">
                            <span className="inline-flex items-center gap-1">
                              <ChevronDown
                                size={12}
                                className={cn(
                                  'text-ink-faint transition-transform',
                                  isOpen && 'rotate-180',
                                )}
                              />
                              {m.nama}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-ink-soft">
                            {formatRupiah(bd.dibayar)}
                          </td>
                          <td className="px-2 py-2 text-ink-soft">
                            {formatRupiah(bd.tanggungan)}
                          </td>
                          <td
                            className={cn(
                              'px-3 py-2 font-bold',
                              bd.saldo > 0 && 'text-emerald',
                              bd.saldo < 0 && 'text-rust',
                              bd.saldo === 0 && 'text-ink-faint',
                            )}
                          >
                            {formatRupiah(bd.saldo)}
                          </td>
                        </tr>
                        {isOpen && ledger && (
                          <tr className="border-t border-line bg-paper-2/40">
                            <td colSpan={4} className="px-3 py-2.5 text-left">
                              {ledger.paid.length > 0 && (
                                <div className="mb-2">
                                  <p className="mb-1 font-sans text-[10px] font-semibold tracking-wide text-emerald uppercase">
                                    Nalangin
                                  </p>
                                  {ledger.paid.map((l) => (
                                    <div
                                      key={`p-${l.txId}`}
                                      className="flex items-baseline justify-between gap-2 py-0.5"
                                    >
                                      <span className="font-sans text-[11px] text-ink">
                                        {l.deskripsi}
                                      </span>
                                      <span className="text-[11px] text-emerald">
                                        {formatRupiah(l.amount)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <p className="mb-1 font-sans text-[10px] font-semibold tracking-wide text-rust uppercase">
                                Pakai
                              </p>
                              {ledger.used.length === 0 ? (
                                <p className="font-sans text-[11px] text-ink-faint">
                                  Tidak ada tanggungan.
                                </p>
                              ) : (
                                ledger.used.map((l) => (
                                  <div
                                    key={`u-${l.txId}`}
                                    className="flex items-baseline justify-between gap-2 py-0.5"
                                  >
                                    <span className="min-w-0 font-sans text-[11px] text-ink">
                                      {l.deskripsi}
                                      <span className="text-ink-faint">
                                        {' '}
                                        · {l.note}
                                      </span>
                                    </span>
                                    <span className="shrink-0 text-[11px] text-ink-soft">
                                      {formatRupiah(l.amount)}
                                    </span>
                                  </div>
                                ))
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
              <p className="bg-paper-2 px-3 py-2 text-left font-sans text-[11px] text-ink-faint">
                <b>Nalangin</b> = total kamu bayarin di depan · <b>Pakai</b> =
                bagianmu yang sebenarnya · <b>Saldo</b> = nalangin − pakai.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
