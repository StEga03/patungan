/** Rupiah formatting + safe arithmetic expression evaluation. */

/** Format an integer rupiah value as "Rp 150.000". */
export function formatRupiah(n: number): string {
  const sign = n < 0 ? '−' : ''
  const abs = Math.abs(Math.round(n))
  return `${sign}Rp ${abs.toLocaleString('id-ID')}`
}

/** Format without the "Rp" prefix, e.g. "150.000". */
export function formatNumber(n: number): string {
  return Math.abs(Math.round(n)).toLocaleString('id-ID')
}

/** Format a signed balance with an explicit +/− prefix, e.g. "+Rp 740.576". */
export function formatSigned(n: number): string {
  const r = Math.round(n)
  if (r === 0) return formatRupiah(0)
  return r > 0 ? `+${formatRupiah(r)}` : formatRupiah(r)
}

/** Group raw input digits with id-ID separators ("100000" -> "100.000"). */
export function groupDigits(val: string): string {
  const digits = val.replace(/[^\d]/g, '')
  return digits ? Number(digits).toLocaleString('id-ID') : ''
}

/** Parse a grouped/plain digit string to an integer ("100.000" -> 100000). */
export function digitsToNumber(val: string): number {
  const d = val.replace(/[^\d]/g, '')
  return d ? Number(d) : 0
}

/**
 * Evaluate a "smart amount" expression safely — no eval().
 * Supports + - * ( ) and integer/decimal numbers. Indonesian users may
 * type "200000-145000" (etoll selisih) or "50000+30000" (bensin).
 * Also accepts plain typed numbers with thousand separators ("150.000").
 *
 * Returns the rounded integer result, or null if invalid/empty.
 */
export function evalAmount(raw: string): number | null {
  const input = raw.trim()
  if (!input) return null

  // If it's a plain number possibly with id-ID separators (dots as thousands),
  // strip the dots so "150.000" -> 150000. Only when there are no operators.
  const hasOperator = /[+\-*()]/.test(input.replace(/^-/, ''))
  if (!hasOperator) {
    const cleaned = input.replace(/\./g, '').replace(/,/g, '.')
    const v = Number(cleaned)
    if (!Number.isFinite(v)) return null
    return Math.round(v)
  }

  // Expression mode: allow only digits, whitespace, and + - * ( ) and . , .
  // (No division — splits/etoll never need it, and it avoids /0 surprises.)
  if (!/^[\d\s+\-*().,]+$/.test(input)) return null

  const tokens = tokenize(input)
  if (!tokens || tokens.length === 0) return null
  try {
    const cursor = { i: 0 }
    const v = parseExpr(tokens, cursor)
    if (v === null || cursor.i !== tokens.length || !Number.isFinite(v)) {
      return null // trailing/unparsed tokens => invalid
    }
    return Math.round(v)
  } catch {
    return null
  }
}

type Token = { type: 'num'; value: number } | { type: 'op'; value: string }

function tokenize(s: string): Token[] | null {
  const tokens: Token[] = []
  let i = 0
  while (i < s.length) {
    const c = s[i]
    if (c === ' ' || c === '\t') {
      i++
      continue
    }
    if (c === '+' || c === '-' || c === '*' || c === '(' || c === ')') {
      tokens.push({ type: 'op', value: c })
      i++
      continue
    }
    if (/[\d.,]/.test(c)) {
      let j = i
      while (j < s.length && /[\d.,]/.test(s[j])) j++
      // treat dots as thousand separators, comma as decimal
      const numStr = s.slice(i, j).replace(/\./g, '').replace(/,/g, '.')
      const v = Number(numStr)
      if (!Number.isFinite(v)) return null
      tokens.push({ type: 'num', value: v })
      i = j
      continue
    }
    return null
  }
  return tokens
}

// Recursive-descent: expr = term (('+'|'-') term)* ; term = factor ('*' factor)*
// factor = number | '(' expr ')' | '-' factor
type Cursor = { i: number }

function peek(tokens: Token[], c: Cursor): Token | null {
  return c.i < tokens.length ? tokens[c.i] : null
}

function parseExpr(tokens: Token[], c: Cursor): number | null {
  let left = parseTerm(tokens, c)
  if (left === null) return null
  for (;;) {
    const t = peek(tokens, c)
    if (t && t.type === 'op' && (t.value === '+' || t.value === '-')) {
      c.i++
      const right = parseTerm(tokens, c)
      if (right === null) return null
      left = t.value === '+' ? left + right : left - right
    } else break
  }
  return left
}

function parseTerm(tokens: Token[], c: Cursor): number | null {
  let left = parseFactor(tokens, c)
  if (left === null) return null
  for (;;) {
    const t = peek(tokens, c)
    if (t && t.type === 'op' && t.value === '*') {
      c.i++
      const right = parseFactor(tokens, c)
      if (right === null) return null
      left = left * right
    } else break
  }
  return left
}

function parseFactor(tokens: Token[], c: Cursor): number | null {
  const t = peek(tokens, c)
  if (!t) return null
  if (t.type === 'op' && t.value === '-') {
    c.i++
    const f = parseFactor(tokens, c)
    return f === null ? null : -f
  }
  if (t.type === 'op' && t.value === '(') {
    c.i++
    const e = parseExpr(tokens, c)
    const close = peek(tokens, c)
    if (!close || close.type !== 'op' || close.value !== ')') return null
    c.i++
    return e
  }
  if (t.type === 'num') {
    c.i++
    return t.value
  }
  return null
}
