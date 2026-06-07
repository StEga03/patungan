import type {
  Balance,
  Breakdown,
  Charge,
  Member,
  Payment,
  Transaction,
  Transfer,
} from './types'

/** Stable identity for a settle-up transfer (for "sudah transfer" tracking). */
export function transferKey(t: Transfer): string {
  return `${t.dariId}|${t.keId}|${t.jumlah}`
}

/** Is a member referenced by any transaction (payer / participant / item)? */
export function memberInUse(id: string, transaksi: Transaction[]): boolean {
  return transaksi.some(
    (t) =>
      t.pembayarId === id ||
      t.pesertaId.includes(id) ||
      (t.items?.some((i) => i.pesertaId.includes(id)) ?? false),
  )
}

/**
 * Resolve a transaction into its effective total `jumlah` and the integer
 * amount each member owes. Works for both split modes:
 *
 *  - 'rata'  : jumlah split equally among participants.
 *  - 'item'  : each item split among its own participants; the extra charge
 *              (pajak + service) is distributed PROPORTIONALLY to each
 *              member's item subtotal.
 *
 * Rounding remainders are NOT forced here — `computeBalances` charges the
 * leftover (jumlah − Σ owed) to the payer so every transaction nets to 0.
 */
export function resolveTransaction(
  t: Transaction,
  valid: Set<string>,
): { jumlah: number; owed: Map<string, number> } {
  const owed = new Map<string, number>()

  if (t.mode === 'item' && t.items && t.items.length > 0) {
    // per-person item subtotal
    const subtotal = new Map<string, number>()
    let subtotalAll = 0
    for (const item of t.items) {
      const peserta = item.pesertaId.filter((id) => valid.has(id))
      if (peserta.length === 0 || item.harga <= 0) continue
      subtotalAll += item.harga
      const share = item.harga / peserta.length
      for (const id of peserta) {
        subtotal.set(id, (subtotal.get(id) ?? 0) + share)
      }
    }
    if (subtotalAll <= 0) return { jumlah: 0, owed }

    const tambahan = computeTambahan(t, subtotalAll)
    const jumlah = subtotalAll + tambahan

    for (const [id, sub] of subtotal) {
      const extra = subtotalAll > 0 ? (tambahan * sub) / subtotalAll : 0
      owed.set(id, Math.round(sub + extra))
    }
    return { jumlah, owed }
    // (rounding leftover reconciled by computeBalances via the payer)
  }

  // 'rata' mode (default)
  const peserta = t.pesertaId.filter((id) => valid.has(id))
  if (peserta.length === 0 || t.jumlah <= 0) return { jumlah: 0, owed }
  const share = Math.floor(t.jumlah / peserta.length)
  for (const id of peserta) owed.set(id, share)
  return { jumlah: t.jumlah, owed }
}

/** Amount of one charge (percent of subtotal or absolute rupiah). */
export function chargeAmount(
  charge: Charge | undefined,
  subtotalAll: number,
): number {
  if (!charge || charge.nilai <= 0) return 0
  if (charge.tipe === 'persen') {
    return Math.round((subtotalAll * charge.nilai) / 100)
  }
  return Math.round(charge.nilai)
}

/** Total extra charge (pajak + layanan) in rupiah for a per-item transaction. */
export function computeTambahan(t: Transaction, subtotalAll: number): number {
  return (
    chargeAmount(t.pajak, subtotalAll) + chargeAmount(t.layanan, subtotalAll)
  )
}

/** Effective total of a transaction (recomputed for item mode). */
export function transactionTotal(t: Transaction): number {
  if (t.mode === 'item' && t.items && t.items.length > 0) {
    const subtotalAll = t.items
      .filter((i) => i.pesertaId.length > 0 && i.harga > 0)
      .reduce((s, i) => s + i.harga, 0)
    return subtotalAll + computeTambahan(t, subtotalAll)
  }
  return Math.max(0, t.jumlah)
}

/**
 * Compute each member's balance in integer rupiah.
 * Positive = should receive; negative = should pay. Σ balances == 0 always
 * (the per-transaction rounding remainder is charged to the payer).
 */
export function computeBalances(
  anggota: Member[],
  transaksi: Transaction[],
): Balance[] {
  const valid = new Set(anggota.map((m) => m.id))
  const bal = new Map<string, number>()
  for (const m of anggota) bal.set(m.id, 0)

  for (const t of transaksi) {
    if (!valid.has(t.pembayarId)) continue
    const { jumlah, owed } = resolveTransaction(t, valid)
    if (jumlah <= 0 || owed.size === 0) continue

    bal.set(t.pembayarId, (bal.get(t.pembayarId) as number) + jumlah)
    let owedSum = 0
    for (const [id, amt] of owed) {
      bal.set(id, (bal.get(id) as number) - amt)
      owedSum += amt
    }
    // leftover (rounding) borne by payer => transaction nets to exactly 0
    const remainder = jumlah - owedSum
    bal.set(t.pembayarId, (bal.get(t.pembayarId) as number) - remainder)
  }

  return anggota.map((m) => ({ memberId: m.id, nilai: bal.get(m.id) as number }))
}

/** Per-member breakdown: how much each fronted vs consumed. */
export function computeBreakdown(
  anggota: Member[],
  transaksi: Transaction[],
): Breakdown[] {
  const valid = new Set(anggota.map((m) => m.id))
  const dibayar = new Map<string, number>()
  const tanggungan = new Map<string, number>()
  for (const m of anggota) {
    dibayar.set(m.id, 0)
    tanggungan.set(m.id, 0)
  }

  for (const t of transaksi) {
    if (!valid.has(t.pembayarId)) continue
    const { jumlah, owed } = resolveTransaction(t, valid)
    if (jumlah <= 0 || owed.size === 0) continue
    dibayar.set(t.pembayarId, (dibayar.get(t.pembayarId) as number) + jumlah)
    let owedSum = 0
    for (const [id, amt] of owed) {
      tanggungan.set(id, (tanggungan.get(id) as number) + amt)
      owedSum += amt
    }
    // assign rounding remainder to payer's tanggungan so dibayar−tanggungan==saldo
    const remainder = jumlah - owedSum
    tanggungan.set(t.pembayarId, (tanggungan.get(t.pembayarId) as number) + remainder)
  }

  return anggota.map((m) => ({
    memberId: m.id,
    dibayar: dibayar.get(m.id) as number,
    tanggungan: tanggungan.get(m.id) as number,
    saldo: (dibayar.get(m.id) as number) - (tanggungan.get(m.id) as number),
  }))
}

/** One line in a member's personal ledger (per transaction). */
export type LedgerLine = {
  txId: string
  deskripsi: string
  amount: number // rupiah
  note: string // human explanation of how `amount` was derived
}

/** A member's itemized ledger: what they fronted vs what they consumed. */
export type MemberLedger = {
  paid: LedgerLine[] // transactions they fronted (full effective total)
  used: LedgerLine[] // their consumption share per transaction
  totalPaid: number
  totalUsed: number
}

const SHARED_CHARGE_NOTE = 'pajak/layanan proporsional'

/** Build the per-transaction note explaining a member's share in one item-mode tx. */
function itemModeNote(t: Transaction, memberId: string): string {
  const parts: string[] = []
  for (const item of t.items ?? []) {
    if (!item.pesertaId.includes(memberId) || item.harga <= 0) continue
    const n = item.pesertaId.length
    parts.push(n > 1 ? `${item.nama || 'Item'} (patungan ${n})` : item.nama || 'Item')
  }
  const hasCharge =
    (t.pajak?.nilai ?? 0) > 0 || (t.layanan?.nilai ?? 0) > 0
  if (hasCharge) parts.push(SHARED_CHARGE_NOTE)
  return parts.join(' + ') || 'item'
}

/**
 * Itemize one member's ledger so each rupiah in their "pakai"/"nalangin" can be
 * traced to a transaction. The per-transaction `used` amounts sum EXACTLY to the
 * member's `tanggungan` in computeBreakdown (rounding remainder is attributed to
 * the payer here too), and `paid` sums to their `dibayar`.
 */
export function computeMemberLedger(
  memberId: string,
  anggota: Member[],
  transaksi: Transaction[],
): MemberLedger {
  const valid = new Set(anggota.map((m) => m.id))
  const paid: LedgerLine[] = []
  const used: LedgerLine[] = []

  for (const t of transaksi) {
    if (!valid.has(t.pembayarId)) continue
    const { jumlah, owed } = resolveTransaction(t, valid)
    if (jumlah <= 0 || owed.size === 0) continue

    if (t.pembayarId === memberId) {
      paid.push({
        txId: t.id,
        deskripsi: t.deskripsi,
        amount: jumlah,
        note: 'kamu yang nalangin',
      })
    }

    // rounding remainder is borne by the payer (mirrors computeBreakdown)
    const owedSum = Array.from(owed.values()).reduce((s, v) => s + v, 0)
    const remainder = t.pembayarId === memberId ? jumlah - owedSum : 0
    const amount = (owed.get(memberId) ?? 0) + remainder
    if (amount === 0 && !owed.has(memberId)) continue

    let note: string
    if (t.mode === 'item' && t.items && t.items.length > 0) {
      note = itemModeNote(t, memberId)
    } else {
      const n = t.pesertaId.filter((id) => valid.has(id)).length
      note = `bagi rata ${n} orang`
    }
    if (remainder !== 0) note += ' + sisa pembulatan'
    used.push({ txId: t.id, deskripsi: t.deskripsi, amount, note })
  }

  return {
    paid,
    used,
    totalPaid: paid.reduce((s, l) => s + l.amount, 0),
    totalUsed: used.reduce((s, l) => s + l.amount, 0),
  }
}

/**
 * Balances after subtracting settlements already made. A payment dari→ke means
 * `dari` handed `ke` real money, so `dari` owes that much less (balance up) and
 * `ke` is owed that much less (balance down). Settle-up runs on THIS.
 */
export function netBalances(
  anggota: Member[],
  transaksi: Transaction[],
  pembayaran: Payment[] = [],
): Balance[] {
  const valid = new Set(anggota.map((m) => m.id))
  const base = new Map(
    computeBalances(anggota, transaksi).map((b) => [b.memberId, b.nilai]),
  )
  for (const p of pembayaran) {
    if (!valid.has(p.dariId) || !valid.has(p.keId) || p.jumlah <= 0) continue
    base.set(p.dariId, (base.get(p.dariId) as number) + p.jumlah)
    base.set(p.keId, (base.get(p.keId) as number) - p.jumlah)
  }
  return anggota.map((m) => ({ memberId: m.id, nilai: base.get(m.id) as number }))
}

/**
 * Greedy minimal settle-up: from signed balances (Σ == 0), produce a short
 * list of transfers. Each step settles the largest debtor against the largest
 * creditor. Near-optimal for small groups and far better than naive transfers.
 */
export function settleUp(balances: Balance[]): Transfer[] {
  const debtors = balances
    .filter((b) => b.nilai < 0)
    .map((b) => ({ id: b.memberId, sisa: -b.nilai }))
    .sort((a, b) => b.sisa - a.sisa)
  const creditors = balances
    .filter((b) => b.nilai > 0)
    .map((b) => ({ id: b.memberId, sisa: b.nilai }))
    .sort((a, b) => b.sisa - a.sisa)

  const transfers: Transfer[] = []
  let di = 0
  let ci = 0
  while (di < debtors.length && ci < creditors.length) {
    const d = debtors[di]
    const c = creditors[ci]
    const amount = Math.min(d.sisa, c.sisa)
    if (amount > 0) {
      transfers.push({ dariId: d.id, keId: c.id, jumlah: amount })
      d.sisa -= amount
      c.sisa -= amount
    }
    if (d.sisa === 0) di++
    if (c.sisa === 0) ci++
  }
  return transfers
}

/**
 * Convenience: net balances (after payments) + remaining transfers + totals.
 * `balances` here is the EXPENSE truth (pre-payment); `transfers` is what's
 * still left to pay after settlements.
 */
export function computeSummary(
  anggota: Member[],
  transaksi: Transaction[],
  pembayaran: Payment[] = [],
) {
  const balances = computeBalances(anggota, transaksi)
  const net = netBalances(anggota, transaksi, pembayaran)
  const transfers = settleUp(net)
  const total = transaksi.reduce((sum, t) => sum + transactionTotal(t), 0)
  return { balances, net, transfers, total }
}
