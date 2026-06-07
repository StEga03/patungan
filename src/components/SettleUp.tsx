import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  ImageDown,
  Loader2,
  PartyPopper,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { Avatar } from './ui/Avatar'
import { ShareCard } from './ShareCard'
import { sharePng } from '@/lib/share'
import { formatRupiah } from '@/lib/money'
import { cn } from '@/lib/cn'
import type { Breakdown, Member, Payment, Transfer } from '@/lib/types'

export function SettleUp({
  nama,
  transfers,
  pembayaran,
  anggota,
  total,
  breakdown,
  summaryText,
  onMarkPaid,
  onUndoPaid,
}: {
  nama: string
  transfers: Transfer[]
  pembayaran: Payment[]
  anggota: Member[]
  total: number
  breakdown: Breakdown[]
  summaryText: string
  onMarkPaid: (dariId: string, keId: string, jumlah: number) => void
  onUndoPaid: (id: string) => void
}) {
  const byId = new Map(anggota.map((m) => [m.id, m]))
  const [copied, setCopied] = useState(false)
  const [showPaid, setShowPaid] = useState(false)
  const [sharing, setSharing] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard unavailable */
    }
  }

  const shareImage = async () => {
    if (!cardRef.current || sharing) return
    setSharing(true)
    try {
      const slug = nama.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'patungan'
      await sharePng(cardRef.current, `patungan-${slug}.png`, summaryText)
    } catch {
      // rendering failed (rare) — fall back to copying the text summary
      await copy()
    } finally {
      setSharing(false)
    }
  }

  const settled = transfers.length === 0
  const paidCount = pembayaran.length

  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] bg-ink text-paper shadow-[var(--shadow-pop)]">
      <div className="perforated-top h-2 bg-paper" />

      <div className="px-5 pt-4 pb-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <Sparkles size={18} className="text-amber-soft" />
            Pelunasan
          </h2>
          <span className="rounded-full bg-white/10 px-2.5 py-1 font-mono text-[11px] text-paper/70">
            total {formatRupiah(total)}
          </span>
        </div>

        {settled ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <PartyPopper size={28} className="text-amber-soft" />
            <p className="font-display text-base font-semibold">
              Semua sudah lunas!
            </p>
            <p className="text-sm text-paper/60">
              Tidak ada transfer yang perlu dilakukan.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-3 text-xs text-paper/60">
              Cukup{' '}
              <span className="font-semibold text-amber-soft">
                {transfers.length} transfer
              </span>{' '}
              untuk lunas semua:
            </p>
            <ul className="space-y-2">
              {transfers.map((t, i) => {
                const from = byId.get(t.dariId)
                const to = byId.get(t.keId)
                return (
                  <motion.li
                    key={`${t.dariId}-${t.keId}-${t.jumlah}-${i}`}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 * i + 0.05 }}
                    className="flex items-center gap-2 rounded-xl bg-white/[0.06] px-2.5 py-2.5"
                  >
                    <button
                      onClick={() => onMarkPaid(t.dariId, t.keId, t.jumlah)}
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-white/25 text-transparent transition-colors hover:border-emerald-soft hover:bg-emerald-soft hover:text-ink"
                      aria-label="Tandai sudah transfer"
                      title="Tandai sudah transfer"
                    >
                      <Check size={14} strokeWidth={3} />
                    </button>
                    <span className="flex flex-1 items-center gap-1.5">
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        <Avatar
                          nama={from?.nama ?? '?'}
                          warna={from?.warna ?? '#888'}
                          size="sm"
                        />
                        <span className="text-paper/90">{from?.nama}</span>
                      </span>
                      <span className="flex flex-1 items-center justify-center gap-1.5">
                        <span className="h-px flex-1 bg-white/15" />
                        <span className="font-mono text-sm font-bold text-amber-soft">
                          {formatRupiah(t.jumlah)}
                        </span>
                        <ArrowRight size={14} className="text-paper/40" />
                      </span>
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        <Avatar
                          nama={to?.nama ?? '?'}
                          warna={to?.warna ?? '#888'}
                          size="sm"
                        />
                        <span className="text-paper/90">{to?.nama}</span>
                      </span>
                    </span>
                  </motion.li>
                )
              })}
            </ul>
          </>
        )}

        {paidCount > 0 && (
          <div className="mt-4 border-t border-white/10 pt-3">
            <button
              onClick={() => setShowPaid((v) => !v)}
              className="flex w-full items-center justify-between text-xs text-paper/60 transition-colors hover:text-paper/80"
            >
              <span className="inline-flex items-center gap-1.5">
                <Check size={13} className="text-emerald-soft" />
                Sudah dibayar ({paidCount})
              </span>
              <ChevronDown
                size={15}
                className={cn('transition-transform', showPaid && 'rotate-180')}
              />
            </button>
            <AnimatePresence initial={false}>
              {showPaid && (
                <motion.ul
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-2 space-y-1.5 overflow-hidden"
                >
                  {pembayaran.map((p) => {
                    const from = byId.get(p.dariId)
                    const to = byId.get(p.keId)
                    return (
                      <li
                        key={p.id}
                        className="flex items-center gap-2 rounded-lg bg-emerald/10 px-2.5 py-2 text-sm"
                      >
                        <span className="flex flex-1 items-center gap-1.5 text-paper/70">
                          <span className="font-medium text-paper/90">
                            {from?.nama ?? '?'}
                          </span>
                          <ArrowRight size={12} className="text-paper/40" />
                          <span className="font-mono font-semibold text-emerald-soft">
                            {formatRupiah(p.jumlah)}
                          </span>
                          <ArrowRight size={12} className="text-paper/40" />
                          <span className="font-medium text-paper/90">
                            {to?.nama ?? '?'}
                          </span>
                        </span>
                        <button
                          onClick={() => onUndoPaid(p.id)}
                          className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-paper/50 transition-colors hover:bg-white/10 hover:text-paper/80"
                          aria-label="Batalkan pembayaran"
                          title="Batalkan"
                        >
                          <RotateCcw size={12} /> Batal
                        </button>
                      </li>
                    )
                  })}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button
            onClick={copy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-white/15"
          >
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.span
                  key="ok"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="inline-flex items-center gap-2 text-emerald-soft"
                >
                  <Check size={16} /> Tersalin
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="inline-flex items-center gap-2"
                >
                  <Copy size={16} /> Salin
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <button
            onClick={shareImage}
            disabled={sharing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-soft disabled:opacity-70"
          >
            {sharing ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Membuat…
              </>
            ) : (
              <>
                <ImageDown size={16} /> Bagikan gambar
              </>
            )}
          </button>
        </div>
      </div>

      {/* off-screen render target for the PNG export */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          left: -9999,
          top: 0,
          pointerEvents: 'none',
          opacity: 0,
        }}
      >
        <ShareCard
          ref={cardRef}
          data={{ nama, total, anggota, transfers, pembayaran, breakdown }}
        />
      </div>
    </div>
  )
}
