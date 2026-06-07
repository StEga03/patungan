import { useCallback, useEffect, useMemo, useState } from 'react'
import { colorForIndex } from '@/lib/colors'
import { memberInUse } from '@/lib/calc'
import { uid } from '@/lib/id'
import { loadStore, saveStore } from '@/lib/storage'
import type { Member, Session, Store, Transaction } from '@/lib/types'

function createSession(nama: string): Session {
  return {
    id: uid(),
    nama: nama.trim() || 'Patungan Baru',
    anggota: [],
    transaksi: [],
    dibuat: Date.now(),
    arsip: false,
  }
}

export type NewTransaction = Omit<Transaction, 'id' | 'dibuat'>

/**
 * Central app state. Owns the whole store, persists to localStorage on every
 * change, and exposes intent-named actions that operate on the active session.
 */
export function useStore() {
  const [store, setStore] = useState<Store>(() => loadStore())

  useEffect(() => {
    saveStore(store)
  }, [store])

  const activeSession = useMemo(
    () => store.sesi.find((s) => s.id === store.sesiAktifId) ?? null,
    [store],
  )

  // ---- helpers -------------------------------------------------------------
  const patchActive = useCallback(
    (fn: (s: Session) => Session) => {
      setStore((prev) => {
        if (!prev.sesiAktifId) return prev
        return {
          ...prev,
          sesi: prev.sesi.map((s) =>
            s.id === prev.sesiAktifId ? fn(s) : s,
          ),
        }
      })
    },
    [],
  )

  // ---- session actions -----------------------------------------------------
  const startSession = useCallback((nama: string, anggota: string[]) => {
    setStore((prev) => {
      const sesi = createSession(nama)
      sesi.anggota = anggota
        .map((n) => n.trim())
        .filter(Boolean)
        .map((n, i): Member => ({ id: uid(), nama: n, warna: colorForIndex(i) }))
      return {
        ...prev,
        sesiAktifId: sesi.id,
        sesi: [sesi, ...prev.sesi],
      }
    })
  }, [])

  const openSession = useCallback((id: string) => {
    setStore((prev) => ({ ...prev, sesiAktifId: id }))
  }, [])

  const archiveAndNew = useCallback(() => {
    setStore((prev) => ({
      ...prev,
      sesiAktifId: null,
      sesi: prev.sesi.map((s) =>
        s.id === prev.sesiAktifId ? { ...s, arsip: true } : s,
      ),
    }))
  }, [])

  const deleteSession = useCallback((id: string) => {
    setStore((prev) => {
      const sesi = prev.sesi.filter((s) => s.id !== id)
      const sesiAktifId =
        prev.sesiAktifId === id ? null : prev.sesiAktifId
      return { ...prev, sesi, sesiAktifId }
    })
  }, [])

  const renameSession = useCallback(
    (nama: string) => patchActive((s) => ({ ...s, nama: nama.trim() || s.nama })),
    [patchActive],
  )

  // ---- member actions ------------------------------------------------------
  const addMember = useCallback(
    (nama: string) =>
      patchActive((s) => {
        const trimmed = nama.trim()
        if (!trimmed) return s
        const member: Member = {
          id: uid(),
          nama: trimmed,
          warna: colorForIndex(s.anggota.length),
        }
        return { ...s, anggota: [...s.anggota, member] }
      }),
    [patchActive],
  )

  /**
   * Remove a member. If they're referenced by any transaction we SOFT-delete
   * (mark inactive) so history & balances stay intact; only when they have no
   * transactions do we hard-remove. Reactivating restores them everywhere.
   */
  const removeMember = useCallback(
    (id: string) =>
      patchActive((s) => {
        if (memberInUse(id, s.transaksi)) {
          return {
            ...s,
            anggota: s.anggota.map((m) =>
              m.id === id ? { ...m, aktif: false } : m,
            ),
          }
        }
        return { ...s, anggota: s.anggota.filter((m) => m.id !== id) }
      }),
    [patchActive],
  )

  const reactivateMember = useCallback(
    (id: string) =>
      patchActive((s) => ({
        ...s,
        anggota: s.anggota.map((m) =>
          m.id === id ? { ...m, aktif: true } : m,
        ),
      })),
    [patchActive],
  )

  const addPayment = useCallback(
    (dariId: string, keId: string, jumlah: number) =>
      patchActive((s) => ({
        ...s,
        pembayaran: [
          ...(s.pembayaran ?? []),
          { id: uid(), dariId, keId, jumlah, waktu: Date.now() },
        ],
      })),
    [patchActive],
  )

  const removePayment = useCallback(
    (id: string) =>
      patchActive((s) => ({
        ...s,
        pembayaran: (s.pembayaran ?? []).filter((p) => p.id !== id),
      })),
    [patchActive],
  )

  // ---- transaction actions -------------------------------------------------
  const addTransaction = useCallback(
    (data: NewTransaction) =>
      patchActive((s) => ({
        ...s,
        transaksi: [
          { ...data, id: uid(), dibuat: Date.now() },
          ...s.transaksi,
        ],
      })),
    [patchActive],
  )

  const updateTransaction = useCallback(
    (id: string, data: NewTransaction) =>
      patchActive((s) => ({
        ...s,
        transaksi: s.transaksi.map((t) =>
          t.id === id ? { ...t, ...data } : t,
        ),
      })),
    [patchActive],
  )

  const removeTransaction = useCallback(
    (id: string) =>
      patchActive((s) => ({
        ...s,
        transaksi: s.transaksi.filter((t) => t.id !== id),
      })),
    [patchActive],
  )

  // ---- data portability ----------------------------------------------------
  const exportJson = useCallback(() => JSON.stringify(store, null, 2), [store])

  const importJson = useCallback((raw: string): boolean => {
    try {
      const parsed = JSON.parse(raw) as Store
      if (!parsed || parsed.versi !== 1 || !Array.isArray(parsed.sesi)) {
        return false
      }
      setStore(parsed)
      return true
    } catch {
      return false
    }
  }, [])

  return {
    store,
    activeSession,
    sessions: store.sesi,
    // session
    startSession,
    openSession,
    archiveAndNew,
    deleteSession,
    renameSession,
    // member
    addMember,
    removeMember,
    reactivateMember,
    // payment
    addPayment,
    removePayment,
    // transaction
    addTransaction,
    updateTransaction,
    removeTransaction,
    // portability
    exportJson,
    importJson,
  }
}

export type StoreApi = ReturnType<typeof useStore>
