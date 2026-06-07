/** Today's local date as 'YYYY-MM-DD'. */
export function todayStr(): string {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** Format 'YYYY-MM-DD' as a short id-ID date, e.g. "5 Jun 2026". */
export function formatTanggal(s?: string): string {
  if (!s) return ''
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return ''
  return new Date(y, m - 1, d).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
