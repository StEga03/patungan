import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  ReceiptText,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react'
import { Avatar } from './ui/Avatar'
import { Card, CardHeader } from './ui/Card'
import { transactionTotal } from '@/lib/calc'
import { formatRupiah } from '@/lib/money'
import { formatTanggal } from '@/lib/date'
import type { Member, Transaction } from '@/lib/types'

const PAGE_SIZE = 10

export function TransactionList({
  transaksi,
  anggota,
  onEdit,
  onDelete,
  onOpenDetail,
}: {
  transaksi: Transaction[]
  anggota: Member[]
  onEdit: (t: Transaction) => void
  onDelete: (id: string) => void
  onOpenDetail: (t: Transaction) => void
}) {
  const byId = new Map(anggota.map((m) => [m.id, m]))
  const [page, setPage] = useState(0)

  const sorted = useMemo(
    () =>
      [...transaksi].sort(
        (a, b) =>
          (b.tanggal ?? '').localeCompare(a.tanggal ?? '') ||
          b.dibuat - a.dibuat,
      ),
    [transaksi],
  )

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const slice = sorted.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  return (
    <Card>
      <CardHeader
        icon={<ReceiptText size={16} className="text-amber" />}
        title={`Transaksi · ${transaksi.length}`}
      />
      {transaksi.length === 0 ? (
        <p className="px-5 pb-5 text-sm text-ink-faint">
          Belum ada transaksi. Tambahkan pengeluaran pertama di atas.
        </p>
      ) : (
        <>
          <ul className="px-2">
            <AnimatePresence initial={false}>
              {slice.map((t) => {
                const payer = byId.get(t.pembayarId)
                const peserta = t.pesertaId
                  .map((id) => byId.get(id))
                  .filter((x): x is Member => Boolean(x))
                const semua =
                  peserta.length === anggota.length && anggota.length > 0
                const isItem = t.mode === 'item'
                return (
                  <motion.li
                    key={t.id}
                    layout
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="group"
                  >
                    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-paper-2">
                      <button
                        onClick={() => onOpenDetail(t)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        {payer && (
                          <Avatar
                            nama={payer.nama}
                            warna={payer.warna}
                            size="lg"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-1.5 truncate text-[15px] font-semibold text-ink">
                            {t.deskripsi}
                            {isItem && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-amber/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber">
                                <UtensilsCrossed size={10} />
                                {t.items?.length ?? 0}
                              </span>
                            )}
                          </p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            {t.tanggal && (
                              <span className="text-xs text-ink-faint">
                                {formatTanggal(t.tanggal)} ·
                              </span>
                            )}
                            {semua ? (
                              <span className="text-xs text-ink-soft">
                                dibagi ke semua
                              </span>
                            ) : (
                              <span className="flex -space-x-1.5">
                                {peserta.slice(0, 5).map((p) => (
                                  <Avatar
                                    key={p.id}
                                    nama={p.nama}
                                    warna={p.warna}
                                    size="sm"
                                    className="ring-2 ring-card"
                                  />
                                ))}
                                {peserta.length > 5 && (
                                  <span className="grid h-6 w-6 place-items-center rounded-full bg-paper-2 text-[10px] font-bold text-ink-soft ring-2 ring-card">
                                    +{peserta.length - 5}
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                      <div className="text-right">
                        <p className="font-mono text-[15px] font-bold text-ink">
                          {formatRupiah(transactionTotal(t))}
                        </p>
                        <div className="mt-0.5 flex justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => onEdit(t)}
                            className="grid h-7 w-7 place-items-center rounded-lg text-ink-soft hover:bg-line hover:text-ink"
                            aria-label="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => onDelete(t.id)}
                            className="grid h-7 w-7 place-items-center rounded-lg text-ink-soft hover:bg-rust-soft hover:text-rust"
                            aria-label="Hapus"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>

          {pageCount > 1 && (
            <div className="flex items-center justify-between px-5 py-3">
              <button
                onClick={() => setPage(safePage - 1)}
                disabled={safePage === 0}
                className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink-soft disabled:opacity-30 enabled:hover:text-ink"
                aria-label="Sebelumnya"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-mono text-xs text-ink-soft">
                Hal {safePage + 1} / {pageCount}
              </span>
              <button
                onClick={() => setPage(safePage + 1)}
                disabled={safePage >= pageCount - 1}
                className="grid h-8 w-8 place-items-center rounded-lg border border-line text-ink-soft disabled:opacity-30 enabled:hover:text-ink"
                aria-label="Berikutnya"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
          <div className="pb-2" />
        </>
      )}
    </Card>
  )
}
