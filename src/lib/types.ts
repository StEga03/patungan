/** Domain types — stored verbatim in localStorage. */

export type Member = {
  id: string
  nama: string
  warna: string // hex avatar color
  aktif?: boolean // absent => active. false = soft-deleted (kept for history)
}

/** One ordered item in a per-item ("cafe") split. */
export type Item = {
  id: string
  nama: string
  harga: number // INTEGER rupiah
  pesertaId: string[] // who shares this item (≥1)
}

export type SplitMode = 'rata' | 'item'

/** An extra charge entered as a percent of subtotal OR an absolute rupiah. */
export type Charge = {
  tipe: 'persen' | 'rupiah'
  nilai: number // percent (e.g. 11) or rupiah, by tipe
}

export type Transaction = {
  id: string
  deskripsi: string
  jumlah: number // INTEGER rupiah — total (for item mode: items + charges)
  pembayarId: string
  pesertaId: string[] // ≥1 — for item mode: union of item participants
  dibuat: number // epoch ms (insertion order)
  tanggal?: string // 'YYYY-MM-DD' (event date); absent => use dibuat
  // --- per-item mode (optional; absent => 'rata') ---
  mode?: SplitMode
  items?: Item[]
  pajak?: Charge // distributed proportionally to item subtotal
  layanan?: Charge // distributed proportionally to item subtotal
}

export type Session = {
  id: string
  nama: string
  anggota: Member[]
  transaksi: Transaction[]
  dibuat: number
  arsip: boolean
  pembayaran?: Payment[] // settlements already made (adjust remaining balances)
}

export type Store = {
  versi: 1
  sesiAktifId: string | null
  sesi: Session[]
}

/** A computed balance for one member. Positive = should receive. */
export type Balance = {
  memberId: string
  nilai: number // integer rupiah, signed
}

/** A single transfer in the settle-up plan. */
export type Transfer = {
  dariId: string
  keId: string
  jumlah: number // integer rupiah, > 0
}

/** A real money movement already made between two members (a settlement). */
export type Payment = {
  id: string
  dariId: string
  keId: string
  jumlah: number // integer rupiah, > 0
  waktu: number // epoch ms
}

/** Per-member accounting breakdown (for the "Rincian" transparency view). */
export type Breakdown = {
  memberId: string
  dibayar: number // total fronted (as payer)
  tanggungan: number // total owed (consumption)
  saldo: number // dibayar - tanggungan
}
