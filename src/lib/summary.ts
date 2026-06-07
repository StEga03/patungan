import { computeBreakdown, computeSummary } from './calc'
import { formatRupiah, formatSigned } from './money'
import type { Session } from './types'

/** Build a plain-text summary for copy/share to a group chat. */
export function buildSummaryText(session: Session): string {
  const nameOf = (id: string) =>
    session.anggota.find((m) => m.id === id)?.nama ?? '?'
  const pembayaran = session.pembayaran ?? []
  const { transfers, total } = computeSummary(
    session.anggota,
    session.transaksi,
    pembayaran,
  )
  const breakdown = computeBreakdown(session.anggota, session.transaksi)
    .slice()
    .sort((a, b) => b.saldo - a.saldo)

  const lines: string[] = []
  lines.push(`💸 ${session.nama}`)
  lines.push(`Total pengeluaran: ${formatRupiah(total)}`)
  lines.push(`Anggota: ${session.anggota.map((m) => m.nama).join(', ')}`)
  lines.push('')

  if (transfers.length === 0) {
    lines.push('✅ Semua sudah lunas — tidak ada transfer.')
  } else {
    lines.push(`Pelunasan (${transfers.length} transfer):`)
    for (const t of transfers) {
      lines.push(
        `• ${nameOf(t.dariId)} → ${formatRupiah(t.jumlah)} → ${nameOf(t.keId)}`,
      )
    }
  }

  if (pembayaran.length > 0) {
    lines.push('')
    lines.push(`✅ Sudah dibayar (${pembayaran.length}):`)
    for (const p of pembayaran) {
      lines.push(
        `• ${nameOf(p.dariId)} → ${formatRupiah(p.jumlah)} → ${nameOf(p.keId)} (lunas)`,
      )
    }
  }

  // per-member breakdown (talangin / pakai → saldo)
  lines.push('')
  lines.push('📊 Rincian (talangin / pakai → saldo):')
  for (const b of breakdown) {
    const tag = b.saldo > 0 ? ' terima' : b.saldo < 0 ? ' bayar' : ''
    lines.push(
      `• ${nameOf(b.memberId)}: ${formatRupiah(b.dibayar)} / ${formatRupiah(
        b.tanggungan,
      )} → ${formatSigned(b.saldo)}${tag}`,
    )
  }

  lines.push('')
  lines.push('— dihitung dengan Patungan')
  return lines.join('\n')
}
