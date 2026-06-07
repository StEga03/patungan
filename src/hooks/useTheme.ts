import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const KEY = 'patungan_theme'

function readStored(): Theme | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}

function systemTheme(): Theme {
  return typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

/**
 * App theme. Defaults to the OS preference, remembers the user's explicit
 * choice in localStorage, and reflects it on <html data-theme> so the CSS
 * token overrides take effect.
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => readStored() ?? systemTheme())

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    // keep the mobile status-bar / PWA chrome in sync with the surface color
    const meta = document.querySelector('meta[name="theme-color"]')
    meta?.setAttribute('content', theme === 'dark' ? '#16120e' : '#fbf7f0')
  }, [theme])

  // follow the OS until the user makes an explicit choice
  useEffect(() => {
    if (readStored()) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) =>
      setTheme(e.matches ? 'dark' : 'light')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(KEY, next)
      } catch {
        /* ignore quota */
      }
      return next
    })
  }, [])

  return { theme, toggle }
}
