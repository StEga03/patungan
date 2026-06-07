import { forwardRef } from 'react'
import { formatRupiah, formatSigned } from '@/lib/money'
import type { Breakdown, Member, Payment, Transfer } from '@/lib/types'

/**
 * A self-contained, image-export receipt. Uses INLINE HEX styles only — no
 * Tailwind utilities — because html-to-image cannot serialize `oklch()` colors
 * from the stylesheet. Always the light "paper" look for a consistent share,
 * regardless of the app's current theme.
 */
export type ShareData = {
  nama: string
  total: number
  anggota: Member[]
  transfers: Transfer[]
  pembayaran: Payment[]
  breakdown: Breakdown[]
}

const C = {
  paper: '#fffdf8',
  paper2: '#f4ecde',
  ink: '#211c17',
  inkSoft: '#6f6557',
  inkFaint: '#a89c89',
  line: '#e7dcc8',
  amber: '#e0651a',
  emerald: '#1f8a5b',
  emeraldBg: '#e3f1e7',
  rust: '#c0492f',
} as const

const SECTION_LABEL = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1,
  textTransform: 'uppercase',
  color: C.inkFaint,
} as const

function initials(nama: string): string {
  return (nama.trim()[0] ?? '?').toUpperCase()
}

function Pill({ m }: { m: Member }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 9px 3px 3px',
        borderRadius: 999,
        border: `1px solid ${C.line}`,
        background: C.paper2,
        fontSize: 13,
        fontWeight: 600,
        color: C.ink,
      }}
    >
      <span
        style={{
          display: 'grid',
          placeItems: 'center',
          width: 20,
          height: 20,
          borderRadius: 999,
          background: m.warna,
          color: '#fff',
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        {initials(m.nama)}
      </span>
      {m.nama}
    </span>
  )
}

export const ShareCard = forwardRef<HTMLDivElement, { data: ShareData }>(
  function ShareCard({ data }, ref) {
    const byId = new Map(data.anggota.map((m) => [m.id, m]))
    const nameOf = (id: string) => byId.get(id)?.nama ?? '?'
    const settled = data.transfers.length === 0

    return (
      <div
        ref={ref}
        style={{
          width: 400,
          boxSizing: 'border-box',
          padding: 28,
          background: C.paper,
          color: C.ink,
          fontFamily:
            "'Plus Jakarta Sans Variable', system-ui, sans-serif",
          borderRadius: 24,
        }}
      >
        {/* header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: C.amber,
              }}
            >
              Patungan
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: -0.5,
                lineHeight: 1.15,
                color: C.ink,
              }}
            >
              {data.nama}
            </div>
          </div>
          <span style={{ fontSize: 30 }}>💸</span>
        </div>

        {/* total */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: 14,
            background: C.paper2,
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 13, color: C.inkSoft }}>
            Total pengeluaran
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: 19,
              fontWeight: 700,
              color: C.ink,
            }}
          >
            {formatRupiah(data.total)}
          </span>
        </div>

        {/* members */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: C.inkFaint,
            marginBottom: 8,
          }}
        >
          Anggota
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginBottom: 18,
          }}
        >
          {data.anggota.map((m) => (
            <Pill key={m.id} m={m} />
          ))}
        </div>

        {/* transfers */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
            color: C.inkFaint,
            marginBottom: 8,
          }}
        >
          {settled
            ? 'Pelunasan'
            : `Pelunasan · ${data.transfers.length} transfer`}
        </div>

        {settled ? (
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 12,
              background: C.emeraldBg,
              color: C.emerald,
              fontSize: 14,
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            ✅ Semua sudah lunas — tidak ada transfer.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.transfers.map((t, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '11px 14px',
                  borderRadius: 12,
                  border: `1px solid ${C.line}`,
                  background: '#fff',
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>
                  {nameOf(t.dariId)}
                </span>
                <span
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <span
                    style={{ flex: 1, height: 1, background: C.line }}
                  />
                  <span
                    style={{
                      fontFamily:
                        "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: 14,
                      fontWeight: 700,
                      color: C.amber,
                    }}
                  >
                    {formatRupiah(t.jumlah)}
                  </span>
                  <span style={{ color: C.inkFaint, fontSize: 14 }}>→</span>
                </span>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>
                  {nameOf(t.keId)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* already paid */}
        {data.pembayaran.length > 0 && (
          <>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1,
                textTransform: 'uppercase',
                color: C.inkFaint,
                margin: '18px 0 8px',
              }}
            >
              ✅ Sudah dibayar · {data.pembayaran.length}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {data.pembayaran.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '9px 14px',
                    borderRadius: 10,
                    background: C.emeraldBg,
                    fontSize: 13,
                  }}
                >
                  <span style={{ fontWeight: 600, color: C.ink }}>
                    {nameOf(p.dariId)}
                  </span>
                  <span style={{ color: C.inkFaint }}>→</span>
                  <span
                    style={{
                      fontFamily:
                        "'JetBrains Mono', ui-monospace, monospace",
                      fontWeight: 700,
                      color: C.emerald,
                    }}
                  >
                    {formatRupiah(p.jumlah)}
                  </span>
                  <span style={{ color: C.inkFaint }}>→</span>
                  <span style={{ fontWeight: 600, color: C.ink }}>
                    {nameOf(p.keId)}
                  </span>
                  <span
                    style={{
                      marginLeft: 'auto',
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.emerald,
                    }}
                  >
                    LUNAS
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* per-member breakdown */}
        <div style={{ ...SECTION_LABEL, margin: '18px 0 8px' }}>
          Rincian · talangin / pakai → saldo
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {data.breakdown
            .slice()
            .sort((a, b) => b.saldo - a.saldo)
            .map((b) => {
              const m = byId.get(b.memberId)
              const positive = b.saldo > 0
              const zero = b.saldo === 0
              return (
                <div
                  key={b.memberId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 12px',
                    borderRadius: 10,
                    background: C.paper2,
                  }}
                >
                  <span
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      width: 22,
                      height: 22,
                      borderRadius: 999,
                      background: m?.warna ?? '#888',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {initials(m?.nama ?? '?')}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ fontSize: 14, fontWeight: 600, color: C.ink }}
                    >
                      {m?.nama ?? '?'}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: C.inkSoft,
                        fontFamily:
                          "'JetBrains Mono', ui-monospace, monospace",
                      }}
                    >
                      {formatRupiah(b.dibayar)} / {formatRupiah(b.tanggungan)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontFamily:
                          "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: 14,
                        fontWeight: 700,
                        color: zero ? C.inkSoft : positive ? C.emerald : C.rust,
                      }}
                    >
                      {formatSigned(b.saldo)}
                    </div>
                    <div style={{ fontSize: 10, color: C.inkFaint }}>
                      {zero ? 'pas' : positive ? 'terima' : 'bayar'}
                    </div>
                  </div>
                </div>
              )
            })}
        </div>

        {/* footer */}
        <div
          style={{
            marginTop: 20,
            paddingTop: 14,
            borderTop: `1px dashed ${C.line}`,
            textAlign: 'center',
            fontSize: 11,
            color: C.inkFaint,
          }}
        >
          dihitung dengan Patungan · 🔒 data tersimpan di perangkat
        </div>
      </div>
    )
  },
)
