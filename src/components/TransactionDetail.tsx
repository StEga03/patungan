import { Pencil, Trash2 } from 'lucide-react'
import { Sheet } from './ui/Sheet'
import { Avatar } from './ui/Avatar'
import { Button } from './ui/Button'
import {
  chargeAmount,
  itemNetto,
  itemSubtotals,
  resolveTotals,
  resolveTransaction,
  transactionTotal,
} from '@/lib/calc'
import { formatRupiah } from '@/lib/money'
import { formatTanggal } from '@/lib/date'
import type { Member, Transaction } from '@/lib/types'

export function TransactionDetail({
  transaksi,
  anggota,
  onClose,
  onEdit,
  onDelete,
}: {
  transaksi: Transaction | null
  anggota: Member[]
  onClose: () => void
  onEdit: (t: Transaction) => void
  onDelete: (id: string) => void
}) {
  const byId = new Map(anggota.map((m) => [m.id, m]))
  const nameOf = (id: string) => byId.get(id)?.nama ?? '?'

  const t = transaksi
  const valid = new Set(anggota.map((m) => m.id))
  const { owed } = t
    ? resolveTransaction(t, valid)
    : { owed: new Map<string, number>() }
  const total = t ? transactionTotal(t) : 0

  const subtotalBruto =
    t?.items?.reduce(
      (s, i) => (i.pesertaId.length > 0 && i.harga > 0 ? s + i.harga : s),
      0,
    ) ?? 0
  const subtotalAll = t ? itemSubtotals(t).subtotalAll : 0
  const diskonItemTotal = subtotalBruto - subtotalAll
  const totals = t
    ? resolveTotals(t, subtotalAll)
    : { base: 0, diskon: 0, tambahan: 0, total: 0 }
  const afterTax = (t?.diskon?.basis ?? 'sebelum') === 'setelah'
  const taxBase = afterTax ? subtotalAll : totals.base
  const diskonRata =
    t && t.mode !== 'item' ? Math.max(0, t.jumlah) - total : 0

  return (
    <Sheet open={!!t} onClose={onClose} title="Detail transaksi">
      {t && (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold text-ink">
                {t.deskripsi}
              </p>
              <p className="text-xs text-ink-soft">
                {formatTanggal(t.tanggal) || '—'} ·{' '}
                {t.mode === 'item' ? 'Per item' : 'Bagi rata'}
              </p>
            </div>
            <p className="shrink-0 font-mono text-lg font-bold text-ink">
              {formatRupiah(total)}
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-paper-2 px-3.5 py-2.5">
            {byId.get(t.pembayarId) && (
              <Avatar
                nama={nameOf(t.pembayarId)}
                warna={byId.get(t.pembayarId)!.warna}
                size="md"
              />
            )}
            <div>
              <p className="text-[11px] text-ink-faint">Yang menalangin</p>
              <p className="text-sm font-semibold text-ink">
                {nameOf(t.pembayarId)}
              </p>
            </div>
          </div>

          {/* item breakdown */}
          {t.mode === 'item' && t.items && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-ink-soft uppercase">
                Pesanan
              </p>
              <div className="space-y-1.5">
                {t.items.map((it) => {
                  const netto = itemNetto(it)
                  const potongan = Math.max(0, it.harga) - netto
                  return (
                    <div
                      key={it.id}
                      className="rounded-lg border border-line bg-paper/50 px-3 py-2"
                    >
                      <div className="flex justify-between font-medium text-ink">
                        <span>{it.nama || 'Item'}</span>
                        <span className="font-mono">
                          {potongan > 0 && (
                            <span className="mr-1.5 text-ink-faint line-through">
                              {formatRupiah(it.harga)}
                            </span>
                          )}
                          {formatRupiah(netto)}
                        </span>
                      </div>
                      {potongan > 0 && (
                        <p className="mt-0.5 font-mono text-[11px] text-emerald">
                          diskon
                          {it.diskon?.tipe === 'persen'
                            ? ` ${it.diskon.nilai}%`
                            : ''}{' '}
                          −{formatRupiah(potongan)}
                        </p>
                      )}
                      <p className="mt-0.5 text-xs text-ink-soft">
                        {it.pesertaId.map(nameOf).join(', ')} ·{' '}
                        <span className="font-mono">
                          {formatRupiah(
                            Math.floor(netto / Math.max(1, it.pesertaId.length)),
                          )}
                          /org
                        </span>
                      </p>
                    </div>
                  )
                })}
              </div>
              <div className="mt-2 space-y-1 font-mono text-xs text-ink-soft">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatRupiah(subtotalBruto)}</span>
                </div>
                {diskonItemTotal > 0 && (
                  <div className="flex justify-between text-emerald">
                    <span>Diskon item</span>
                    <span>−{formatRupiah(diskonItemTotal)}</span>
                  </div>
                )}
                {totals.diskon > 0 && !afterTax && (
                  <div className="flex justify-between text-emerald">
                    <span>
                      Diskon
                      {t.diskon?.tipe === 'persen' ? ` ${t.diskon.nilai}%` : ''}
                    </span>
                    <span>−{formatRupiah(totals.diskon)}</span>
                  </div>
                )}
                {t.pajak && t.pajak.nilai > 0 && (
                  <div className="flex justify-between">
                    <span>Pajak{t.pajak.tipe === 'persen' ? ` ${t.pajak.nilai}%` : ''}</span>
                    <span>{formatRupiah(chargeAmount(t.pajak, taxBase))}</span>
                  </div>
                )}
                {t.layanan && t.layanan.nilai > 0 && (
                  <div className="flex justify-between">
                    <span>
                      Layanan
                      {t.layanan.tipe === 'persen' ? ` ${t.layanan.nilai}%` : ''}
                    </span>
                    <span>{formatRupiah(chargeAmount(t.layanan, taxBase))}</span>
                  </div>
                )}
                {totals.diskon > 0 && afterTax && (
                  <div className="flex justify-between text-emerald">
                    <span>
                      Diskon
                      {t.diskon?.tipe === 'persen' ? ` ${t.diskon.nilai}%` : ''}
                    </span>
                    <span>−{formatRupiah(totals.diskon)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-line pt-1 font-bold text-ink">
                  <span>Total</span>
                  <span>{formatRupiah(total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* rata mode discount recap */}
          {t.mode !== 'item' && diskonRata > 0 && (
            <div className="space-y-1 font-mono text-xs text-ink-soft">
              <div className="flex justify-between">
                <span>Jumlah</span>
                <span>{formatRupiah(t.jumlah)}</span>
              </div>
              <div className="flex justify-between text-emerald">
                <span>
                  Diskon{t.diskon?.tipe === 'persen' ? ` ${t.diskon.nilai}%` : ''}
                </span>
                <span>−{formatRupiah(diskonRata)}</span>
              </div>
              <div className="flex justify-between border-t border-line pt-1 font-bold text-ink">
                <span>Total</span>
                <span>{formatRupiah(total)}</span>
              </div>
            </div>
          )}

          {/* per-person owed */}
          <div>
            <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-ink-soft uppercase">
              Tanggungan tiap orang
            </p>
            <div className="space-y-1">
              {Array.from(owed.entries()).map(([id, amt]) => (
                <div
                  key={id}
                  className="flex items-center gap-2 rounded-lg px-1 py-1"
                >
                  <Avatar
                    nama={nameOf(id)}
                    warna={byId.get(id)?.warna ?? '#888'}
                    size="sm"
                  />
                  <span className="flex-1 text-sm text-ink">{nameOf(id)}</span>
                  <span className="font-mono text-sm font-semibold text-ink">
                    {formatRupiah(amt)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 border-t border-line pt-4">
            <Button
              variant="soft"
              onClick={() => {
                onEdit(t)
                onClose()
              }}
            >
              <Pencil size={16} /> Edit
            </Button>
            <Button
              variant="soft"
              className="text-rust hover:bg-rust-soft"
              onClick={() => {
                onDelete(t.id)
                onClose()
              }}
            >
              <Trash2 size={16} /> Hapus
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  )
}
