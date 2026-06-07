import type { Store } from './types'

const KEY = 'patungan_v1'

export const emptyStore: Store = { versi: 1, sesiAktifId: null, sesi: [] }

/** Load the store from localStorage, tolerating corruption. */
export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyStore
    const parsed = JSON.parse(raw) as Store
    if (!parsed || parsed.versi !== 1 || !Array.isArray(parsed.sesi)) {
      return emptyStore
    }
    return parsed
  } catch {
    return emptyStore
  }
}

/** Persist the store. Swallows quota/serialization errors. */
export function saveStore(store: Store): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    // ignore — nothing actionable on a phone if storage is full
  }
}
