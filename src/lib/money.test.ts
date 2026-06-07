import { describe, expect, it } from 'vitest'
import { evalAmount, formatRupiah } from './money'

describe('formatRupiah', () => {
  it('formats integers id-ID', () => {
    expect(formatRupiah(150_000)).toBe('Rp 150.000')
    expect(formatRupiah(0)).toBe('Rp 0')
  })
  it('uses a minus sign for negatives', () => {
    expect(formatRupiah(-135_000)).toBe('−Rp 135.000')
  })
})

describe('evalAmount', () => {
  it('parses plain numbers', () => {
    expect(evalAmount('55000')).toBe(55_000)
  })
  it('parses id-ID thousand separators', () => {
    expect(evalAmount('150.000')).toBe(150_000)
  })
  it('computes etoll selisih (subtraction)', () => {
    expect(evalAmount('200000-145000')).toBe(55_000)
  })
  it('sums bensin (addition)', () => {
    expect(evalAmount('50000+30000+20000')).toBe(100_000)
  })
  it('respects operator precedence and parentheses', () => {
    expect(evalAmount('2*3+4')).toBe(10)
    expect(evalAmount('2*(3+4)')).toBe(14)
  })
  it('handles whitespace', () => {
    expect(evalAmount('  200000 - 145000 ')).toBe(55_000)
  })
  it('rejects junk and trailing tokens', () => {
    expect(evalAmount('5 5')).toBeNull()
    expect(evalAmount('abc')).toBeNull()
    expect(evalAmount('5++')).toBeNull()
    expect(evalAmount('')).toBeNull()
  })
  it('rejects division (not supported)', () => {
    expect(evalAmount('100/2')).toBeNull()
  })
})
