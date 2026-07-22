import { describe, expect, it } from 'vitest'
import {
  computeBalances,
  computeBreakdown,
  computeMemberLedger,
  computeSummary,
  memberInUse,
  netBalances,
  resolveTransaction,
  settleUp,
  transactionTotal,
  transferKey,
} from './calc'
import type { Member, Payment, Transaction } from './types'

const m = (id: string, nama: string): Member => ({ id, nama, warna: '#000' })
const tx = (
  id: string,
  jumlah: number,
  pembayarId: string,
  pesertaId: string[],
): Transaction => ({
  id,
  deskripsi: id,
  jumlah,
  pembayarId,
  pesertaId,
  dibuat: 0,
})

const budi = m('b', 'Budi')
const ani = m('a', 'Ani')
const citra = m('c', 'Citra')

describe('computeBalances', () => {
  it('matches the spec example (§4.4)', () => {
    const anggota = [budi, ani, citra]
    const transaksi = [
      tx('makan', 138_000, 'b', ['b', 'a', 'c']),
      tx('grab', 90_000, 'a', ['b', 'a', 'c']),
      tx('tiket', 118_000, 'b', ['b', 'c']),
    ]
    const bal = computeBalances(anggota, transaksi)
    const byId = Object.fromEntries(bal.map((x) => [x.memberId, x.nilai]))
    expect(byId.b).toBe(121_000)
    expect(byId.a).toBe(14_000)
    expect(byId.c).toBe(-135_000)
  })

  it('always sums to zero, even with rounding remainders', () => {
    const anggota = [budi, ani, citra]
    const transaksi = [
      tx('odd', 100, 'b', ['b', 'a', 'c']), // 100/3 -> remainder to payer
      tx('odd2', 50, 'a', ['a', 'c']),
      tx('odd3', 99_999, 'c', ['b', 'a', 'c']),
    ]
    const bal = computeBalances(anggota, transaksi)
    const sum = bal.reduce((s, x) => s + x.nilai, 0)
    expect(sum).toBe(0)
  })

  it('handles a late-joiner (excluded from earlier transactions)', () => {
    const dodo = m('d', 'Dodo')
    const anggota = [budi, ani, dodo]
    const transaksi = [
      // bensin + etoll: only Budi & Ani (Dodo menyusul naik kereta)
      tx('bensin', 100_000, 'b', ['b', 'a']),
      // makan malam: semua termasuk Dodo
      tx('makan', 90_000, 'a', ['b', 'a', 'd']),
    ]
    const bal = computeBalances(anggota, transaksi)
    const byId = Object.fromEntries(bal.map((x) => [x.memberId, x.nilai]))
    // bensin: Budi +50000, Ani -50000
    // makan: Ani +60000, Budi -30000, Dodo -30000
    expect(byId.b).toBe(20_000)
    expect(byId.a).toBe(10_000)
    expect(byId.d).toBe(-30_000)
    expect(bal.reduce((s, x) => s + x.nilai, 0)).toBe(0)
  })

  it('ignores transactions with no valid participants', () => {
    const bal = computeBalances([budi], [tx('x', 100, 'b', ['ghost'])])
    expect(bal[0].nilai).toBe(0)
  })
})

describe('per-item mode', () => {
  const ega = m('e', 'Ega')
  const septa = m('s', 'Septa')
  const itemTx = (): Transaction => ({
    id: 't',
    deskripsi: 'Cafe',
    jumlah: 0,
    pembayarId: 'e',
    pesertaId: ['e', 's'],
    dibuat: 0,
    mode: 'item',
    pajak: { tipe: 'persen', nilai: 10 },
    items: [
      { id: 'i1', nama: 'Kopi', harga: 50_000, pesertaId: ['e'] },
      { id: 'i2', nama: 'Cake', harga: 60_000, pesertaId: ['s'] },
      { id: 'i3', nama: 'Pizza', harga: 100_000, pesertaId: ['e', 's'] },
    ],
  })

  it('splits items and distributes tax proportionally', () => {
    const valid = new Set(['e', 's'])
    const { jumlah, owed } = resolveTransaction(itemTx(), valid)
    // subtotal 210k + 10% tax = 231k
    expect(jumlah).toBe(231_000)
    // Ega: 100k items + 10k tax ; Septa: 110k items + 11k tax
    expect(owed.get('e')).toBe(110_000)
    expect(owed.get('s')).toBe(121_000)
    expect(transactionTotal(itemTx())).toBe(231_000)
  })

  it('produces balances that net to zero', () => {
    const bal = computeBalances([ega, septa], [itemTx()])
    const byId = Object.fromEntries(bal.map((x) => [x.memberId, x.nilai]))
    expect(byId.e).toBe(121_000) // Ega paid all, is owed Septa's consumption
    expect(byId.s).toBe(-121_000)
    expect(bal.reduce((s, x) => s + x.nilai, 0)).toBe(0)
  })

  it('sums separate pajak (%) and layanan (Rp) charges', () => {
    const t = itemTx()
    t.pajak = { tipe: 'persen', nilai: 10 } // 21.000
    t.layanan = { tipe: 'rupiah', nilai: 9_000 } // flat 9.000
    const { jumlah } = resolveTransaction(t, new Set(['e', 's']))
    expect(jumlah).toBe(210_000 + 21_000 + 9_000)
  })
})

describe('global netting (concern #3: beer paid by Ega)', () => {
  it('routes a payer-fronted expense through the big creditor correctly', () => {
    const ega = m('e', 'Ega')
    const leo = m('l', 'Leo')
    const septa = m('s', 'Septa')
    const transaksi: Transaction[] = [
      tx('hotel', 300_000, 's', ['e', 'l', 's']), // Septa fronts, split 3
      tx('beer', 200_000, 'e', ['e', 'l']), // Ega fronts, only Ega & Leo drink
    ]
    const bal = computeBalances([ega, leo, septa], transaksi)
    const byId = Object.fromEntries(bal.map((x) => [x.memberId, x.nilai]))
    // Ega: -100k (hotel) +200k(paid) -100k(beer share) = 0  -> pays nothing
    expect(byId.e).toBe(0)
    expect(byId.l).toBe(-200_000) // Leo owes hotel 100k + beer 100k
    expect(byId.s).toBe(200_000)
    const transfers = settleUp(bal)
    // single transfer: Leo -> Septa 200k. Ega settled (fronted his own beer).
    expect(transfers).toEqual([{ dariId: 'l', keId: 's', jumlah: 200_000 }])
  })
})

describe('computeBreakdown', () => {
  it('reports dibayar, tanggungan, saldo per member', () => {
    const ega = m('e', 'Ega')
    const leo = m('l', 'Leo')
    const bd = computeBreakdown(
      [ega, leo],
      [tx('makan', 100_000, 'e', ['e', 'l'])],
    )
    const byId = Object.fromEntries(bd.map((x) => [x.memberId, x]))
    expect(byId.e.dibayar).toBe(100_000)
    expect(byId.e.tanggungan).toBe(50_000)
    expect(byId.e.saldo).toBe(50_000)
    expect(byId.l.dibayar).toBe(0)
    expect(byId.l.tanggungan).toBe(50_000)
    expect(byId.l.saldo).toBe(-50_000)
  })
})

describe('computeMemberLedger', () => {
  it('reconciles exactly with computeBreakdown (rata + item, with rounding)', () => {
    const e = m('e', 'Ega')
    const s = m('s', 'Septa')
    const l = m('l', 'Leo')
    const anggota = [e, s, l]
    const transaksi: Transaction[] = [
      tx('bensin', 100_000, 'l', ['e', 's', 'l']), // 33.333 floor + remainder to Leo
      {
        id: 'makan',
        deskripsi: 'Makan',
        jumlah: 0,
        pembayarId: 's',
        pesertaId: ['e', 's'],
        dibuat: 0,
        mode: 'item',
        items: [
          { id: 'i1', nama: 'Pasta', harga: 40_000, pesertaId: ['e'] },
          { id: 'i2', nama: 'Teh', harga: 10_000, pesertaId: ['e', 's'] },
        ],
        pajak: { tipe: 'persen', nilai: 10 },
      },
    ]
    const bd = computeBreakdown(anggota, transaksi)
    for (const b of bd) {
      const ledger = computeMemberLedger(b.memberId, anggota, transaksi)
      expect(ledger.totalUsed).toBe(b.tanggungan)
      expect(ledger.totalPaid).toBe(b.dibayar)
    }
  })

  it('notes the payer absorbs the rounding remainder', () => {
    const e = m('e', 'Ega')
    const s = m('s', 'Septa')
    const l = m('l', 'Leo')
    // 100k / 3 = 33.333 → 1 rupiah remainder lands on payer Leo
    const ledger = computeMemberLedger(
      'l',
      [e, s, l],
      [tx('bensin', 100_000, 'l', ['e', 's', 'l'])],
    )
    expect(ledger.used[0].note).toContain('sisa pembulatan')
    expect(ledger.used[0].amount).toBe(33_334) // 33.333 + 1 remainder
  })
})

describe('memberInUse (data-loss guard)', () => {
  const txns = [
    tx('a', 100_000, 'b', ['b', 'a']),
    {
      ...tx('cafe', 0, 'a', ['a']),
      mode: 'item' as const,
      items: [{ id: 'i', nama: 'Kopi', harga: 50_000, pesertaId: ['c'] }],
    },
  ]
  it('detects payer, participant, and item-participant references', () => {
    expect(memberInUse('b', txns)).toBe(true) // payer + participant
    expect(memberInUse('a', txns)).toBe(true) // participant
    expect(memberInUse('c', txns)).toBe(true) // only inside an item
    expect(memberInUse('z', txns)).toBe(false) // unused
  })
})

describe('transferKey', () => {
  it('is stable for the same transfer', () => {
    expect(transferKey({ dariId: 'a', keId: 'b', jumlah: 50_000 })).toBe(
      'a|b|50000',
    )
  })
})

describe('settleUp', () => {
  it('produces 2 transfers for the spec example', () => {
    const transfers = settleUp([
      { memberId: 'b', nilai: 121_000 },
      { memberId: 'a', nilai: 14_000 },
      { memberId: 'c', nilai: -135_000 },
    ])
    expect(transfers).toHaveLength(2)
    expect(transfers).toContainEqual({ dariId: 'c', keId: 'b', jumlah: 121_000 })
    expect(transfers).toContainEqual({ dariId: 'c', keId: 'a', jumlah: 14_000 })
  })

  it('returns no transfers when everyone is settled', () => {
    expect(
      settleUp([
        { memberId: 'b', nilai: 0 },
        { memberId: 'a', nilai: 0 },
      ]),
    ).toHaveLength(0)
  })

  it('every transfer is positive and balances reconcile', () => {
    const balances = [
      { memberId: 'b', nilai: 70_000 },
      { memberId: 'a', nilai: -30_000 },
      { memberId: 'c', nilai: -40_000 },
    ]
    const transfers = settleUp(balances)
    for (const t of transfers) expect(t.jumlah).toBeGreaterThan(0)
    // net movement equals balances
    const net = new Map<string, number>()
    for (const t of transfers) {
      net.set(t.keId, (net.get(t.keId) ?? 0) + t.jumlah)
      net.set(t.dariId, (net.get(t.dariId) ?? 0) - t.jumlah)
    }
    for (const b of balances) expect(net.get(b.memberId) ?? 0).toBe(b.nilai)
  })
})

describe('recorded payments (concern #4: paid stays paid as new tx pile up)', () => {
  const members = [budi, ani, citra]
  const pay = (dariId: string, keId: string, jumlah: number): Payment => ({
    id: `${dariId}-${keId}`,
    dariId,
    keId,
    jumlah,
    waktu: 0,
  })

  it('a payment moves the payer up and the receiver down by exactly jumlah', () => {
    // Budi fronts 90k for all three → Ani & Citra each owe 30k.
    const transaksi = [tx('t1', 90_000, 'b', ['b', 'a', 'c'])]
    const base = computeBalances(members, transaksi)
    expect(base.find((x) => x.memberId === 'a')?.nilai).toBe(-30_000)

    // Ani settles 30k to Budi.
    const net = netBalances(members, transaksi, [pay('a', 'b', 30_000)])
    expect(net.find((x) => x.memberId === 'a')?.nilai).toBe(0)
    expect(net.find((x) => x.memberId === 'b')?.nilai).toBe(30_000) // only Citra left owing
    expect(net.find((x) => x.memberId === 'c')?.nilai).toBe(-30_000)
  })

  it('once Ani has paid, a NEW transaction does not revive her settled debt', () => {
    // Round 1: Budi fronts 90k → Ani owes 30k, then Ani pays it off.
    const round1 = [tx('t1', 90_000, 'b', ['b', 'a', 'c'])]
    const pembayaran = [pay('a', 'b', 30_000)]

    // Round 2: Citra fronts a new 60k bill split with Ani & Budi (+20k each).
    const transaksi = [...round1, tx('t2', 60_000, 'c', ['b', 'a', 'c'])]
    const net = netBalances(members, transaksi, pembayaran)

    // Ani's settled 30k stays settled; she only owes the NEW 20k.
    expect(net.find((x) => x.memberId === 'a')?.nilai).toBe(-20_000)
    // Σ net is still zero.
    expect(net.reduce((s, b) => s + b.nilai, 0)).toBe(0)
  })

  it('computeSummary nets payments out of the remaining transfers', () => {
    const transaksi = [tx('t1', 90_000, 'b', ['b', 'a', 'c'])]
    const before = computeSummary(members, transaksi)
    expect(before.transfers).toHaveLength(2) // Ani→Budi, Citra→Budi

    const after = computeSummary(members, transaksi, [pay('a', 'b', 30_000)])
    expect(after.transfers).toHaveLength(1)
    expect(after.transfers[0]).toEqual({ dariId: 'c', keId: 'b', jumlah: 30_000 })
    // total expenditure is unchanged by settlements
    expect(after.total).toBe(before.total)
  })
})

// ---------------------------------------------------------------------------
// Diskon
// ---------------------------------------------------------------------------

const itemTx = (over: Partial<Transaction> = {}): Transaction => ({
  id: 'cafe',
  deskripsi: 'Cafe',
  jumlah: 0,
  pembayarId: 'b',
  pesertaId: ['b', 'a'],
  dibuat: 0,
  mode: 'item',
  items: [
    { id: 'i1', nama: 'Kopi', harga: 60_000, pesertaId: ['b'] },
    { id: 'i2', nama: 'Teh', harga: 40_000, pesertaId: ['a'] },
  ],
  ...over,
})

describe('diskon — mode rata', () => {
  const anggota = [budi, ani, citra]

  it('potong rupiah dari jumlah lalu dibagi rata', () => {
    const t: Transaction = {
      ...tx('t', 200_000, 'b', ['b', 'a', 'c']),
      diskon: { tipe: 'rupiah', nilai: 50_000 },
    }
    expect(transactionTotal(t)).toBe(150_000)
    const { jumlah, owed } = resolveTransaction(t, new Set(['b', 'a', 'c']))
    expect(jumlah).toBe(150_000)
    expect(owed.get('a')).toBe(50_000)
    expect(computeBalances(anggota, [t]).reduce((s, x) => s + x.nilai, 0)).toBe(0)
  })

  it('potong persen dari jumlah', () => {
    const t: Transaction = {
      ...tx('t', 200_000, 'b', ['b', 'a']),
      diskon: { tipe: 'persen', nilai: 25 },
    }
    expect(transactionTotal(t)).toBe(150_000)
    expect(resolveTransaction(t, new Set(['b', 'a'])).owed.get('a')).toBe(75_000)
  })

  it('diskon lebih besar dari jumlah di-clamp ke total 0', () => {
    const t: Transaction = {
      ...tx('t', 100_000, 'b', ['b', 'a']),
      diskon: { tipe: 'rupiah', nilai: 500_000 },
    }
    expect(transactionTotal(t)).toBe(0)
    expect(resolveTransaction(t, new Set(['b', 'a'])).jumlah).toBe(0)
    expect(computeBalances(anggota, [t]).every((x) => x.nilai === 0)).toBe(true)
  })
})

describe('diskon — mode item', () => {
  const anggota = [budi, ani]
  const valid = new Set(['b', 'a'])

  it('diskon per item cuma kena ke peserta item itu', () => {
    const t = itemTx({
      items: [
        {
          id: 'i1',
          nama: 'Kopi',
          harga: 60_000,
          pesertaId: ['b'],
          diskon: { tipe: 'persen', nilai: 50 },
        },
        { id: 'i2', nama: 'Teh', harga: 40_000, pesertaId: ['a'] },
      ],
    })
    expect(transactionTotal(t)).toBe(70_000)
    const { owed } = resolveTransaction(t, valid)
    expect(owed.get('b')).toBe(30_000)
    expect(owed.get('a')).toBe(40_000) // tidak terpengaruh
  })

  it('diskon transaksi basis "sebelum" — pajak & layanan dari harga diskon', () => {
    const t = itemTx({
      pajak: { tipe: 'persen', nilai: 11 },
      layanan: { tipe: 'persen', nilai: 5 },
      diskon: { tipe: 'persen', nilai: 20, basis: 'sebelum' },
    })
    expect(transactionTotal(t)).toBe(92_800)
  })

  it('diskon transaksi basis "setelah" — pajak & layanan dari subtotal penuh', () => {
    const t = itemTx({
      pajak: { tipe: 'persen', nilai: 11 },
      layanan: { tipe: 'persen', nilai: 5 },
      diskon: { tipe: 'rupiah', nilai: 20_000, basis: 'setelah' },
    })
    expect(transactionTotal(t)).toBe(96_000)

    const sebelum = itemTx({
      pajak: { tipe: 'persen', nilai: 11 },
      layanan: { tipe: 'persen', nilai: 5 },
      diskon: { tipe: 'rupiah', nilai: 20_000, basis: 'sebelum' },
    })
    expect(transactionTotal(sebelum)).toBe(92_800)
  })

  it('basis absen dianggap "sebelum"', () => {
    const t = itemTx({
      pajak: { tipe: 'persen', nilai: 11 },
      diskon: { tipe: 'rupiah', nilai: 20_000 },
    })
    expect(transactionTotal(t)).toBe(88_800) // (100k−20k) + 11%
  })

  it('diskon item + diskon transaksi berlapis, proporsional ke porsi', () => {
    const t = itemTx({
      items: [
        {
          id: 'i1',
          nama: 'Kopi',
          harga: 60_000,
          pesertaId: ['b'],
          diskon: { tipe: 'rupiah', nilai: 20_000 },
        },
        { id: 'i2', nama: 'Teh', harga: 40_000, pesertaId: ['a'] },
      ],
      diskon: { tipe: 'persen', nilai: 10 },
    })
    // netto 40k + 40k = 80k, diskon 10% -> 72k
    expect(transactionTotal(t)).toBe(72_000)
    const { owed } = resolveTransaction(t, valid)
    expect(owed.get('b')).toBe(36_000)
    expect(owed.get('a')).toBe(36_000)
  })

  it('diskon 100% membuat transaksi tidak mempengaruhi saldo', () => {
    const t = itemTx({ diskon: { tipe: 'persen', nilai: 100 } })
    expect(transactionTotal(t)).toBe(0)
    expect(resolveTransaction(t, valid).owed.size).toBe(0)
    expect(computeBalances(anggota, [t]).every((x) => x.nilai === 0)).toBe(true)
  })

  it('sisa pembulatan tetap ditanggung pembayar (Σ saldo = 0)', () => {
    const t = itemTx({
      items: [
        { id: 'i1', nama: 'Sate', harga: 33_333, pesertaId: ['b', 'a'] },
        { id: 'i2', nama: 'Es', harga: 10_001, pesertaId: ['a'] },
      ],
      pajak: { tipe: 'persen', nilai: 11 },
      diskon: { tipe: 'persen', nilai: 7, basis: 'sebelum' },
    })
    const { jumlah, owed } = resolveTransaction(t, valid)
    const owedSum = Array.from(owed.values()).reduce((s, v) => s + v, 0)
    expect(jumlah - owedSum).toBeLessThanOrEqual(2)
    expect(computeBalances(anggota, [t]).reduce((s, x) => s + x.nilai, 0)).toBe(0)
  })

  it('ledger tiap orang konsisten dengan breakdown & nyebut diskon', () => {
    const t = itemTx({
      items: [
        {
          id: 'i1',
          nama: 'Kopi',
          harga: 60_000,
          pesertaId: ['b'],
          diskon: { tipe: 'persen', nilai: 50 },
        },
        { id: 'i2', nama: 'Teh', harga: 40_000, pesertaId: ['a'] },
      ],
      diskon: { tipe: 'persen', nilai: 10 },
    })
    const breakdown = computeBreakdown(anggota, [t])
    for (const b of breakdown) {
      const ledger = computeMemberLedger(b.memberId, anggota, [t])
      expect(ledger.totalUsed).toBe(b.tanggungan)
      expect(ledger.totalPaid).toBe(b.dibayar)
    }
    const budiLedger = computeMemberLedger('b', anggota, [t])
    expect(budiLedger.used[0].note).toContain('diskon')
  })
})
