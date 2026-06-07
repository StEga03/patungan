import { toPng } from 'html-to-image'

/** Snapshot a DOM node to a high-DPI PNG blob. */
export async function nodeToPngBlob(node: HTMLElement): Promise<Blob> {
  // ensure web fonts are loaded so the first export isn't a fallback font
  try {
    await document.fonts.ready
  } catch {
    /* fonts API unavailable — proceed anyway */
  }
  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    cacheBust: true,
    // ShareCard already paints its own background; keep it explicit anyway.
    backgroundColor: '#fbf7f0',
  })
  const res = await fetch(dataUrl)
  return res.blob()
}

/**
 * Share a PNG of `node`. Prefers the native share sheet with the image file
 * (so it lands as a picture in WhatsApp/Telegram); falls back to downloading
 * the PNG when file-sharing isn't available (most desktops).
 *
 * Returns how the share resolved so the caller can show the right feedback.
 */
export async function sharePng(
  node: HTMLElement,
  filename: string,
  shareText?: string,
): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const blob = await nodeToPngBlob(node)
  const file = new File([blob], filename, { type: 'image/png' })

  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean
  }
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], text: shareText })
      return 'shared'
    } catch (err) {
      // AbortError = user dismissed the sheet; treat as a no-op
      if (err instanceof DOMException && err.name === 'AbortError') {
        return 'cancelled'
      }
      // otherwise fall through to download
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  return 'downloaded'
}
