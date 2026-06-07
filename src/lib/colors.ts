/** Warm, ledger-friendly avatar palette. Assigned round-robin by index. */
export const AVATAR_COLORS = [
  '#e0651a', // amber
  '#1f8a5b', // emerald
  '#c0492f', // rust
  '#3b6db5', // ink blue
  '#9a5bb5', // plum
  '#b58a1f', // mustard
  '#2f9a93', // teal
  '#b54f7a', // berry
] as const

export function colorForIndex(i: number): string {
  return AVATAR_COLORS[i % AVATAR_COLORS.length]
}

/** First grapheme/initial of a name, uppercased. */
export function initial(nama: string): string {
  const trimmed = nama.trim()
  return trimmed ? trimmed[0].toUpperCase() : '?'
}
