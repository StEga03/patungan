import { useRef } from 'react'
import { Archive, Download, FolderOpen, Trash2, Upload } from 'lucide-react'
import { Sheet } from './ui/Sheet'
import { Button } from './ui/Button'
import type { Session } from '@/lib/types'

/** Manage the current session: start new, browse & reopen archived ones. */
export function SessionSheet({
  open,
  onClose,
  sessions,
  activeId,
  onNewSession,
  onOpenSession,
  onDeleteSession,
  onExport,
  onImport,
}: {
  open: boolean
  onClose: () => void
  sessions: Session[]
  activeId: string | null
  onNewSession: () => void
  onOpenSession: (id: string) => void
  onDeleteSession: (id: string) => void
  onExport: () => string
  onImport: (raw: string) => boolean
}) {
  const others = sessions.filter((s) => s.id !== activeId)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const blob = new Blob([onExport()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'patungan-data.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportFile = async (file: File) => {
    const text = await file.text()
    if (onImport(text)) {
      onClose()
    } else {
      alert('File tidak valid — pastikan ini file ekspor Patungan.')
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Patungan">
      {activeId && (
        <Button
          variant="primary"
          className="w-full"
          onClick={() => {
            onNewSession()
            onClose()
          }}
        >
          <Archive size={17} /> Arsipkan & mulai baru
        </Button>
      )}

      <div className="mt-5">
        <p className="mb-2 text-[11px] font-semibold tracking-wide text-ink-soft uppercase">
          Riwayat
        </p>
        {others.length === 0 ? (
          <p className="py-3 text-sm text-ink-faint">Belum ada riwayat lain.</p>
        ) : (
          <ul className="space-y-1.5">
            {others.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-2 rounded-xl border border-line bg-paper-2 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {s.nama}
                    {s.arsip && (
                      <span className="ml-2 rounded-full bg-line px-1.5 py-0.5 text-[10px] font-medium text-ink-soft">
                        arsip
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink-faint">
                    {s.anggota.length} anggota · {s.transaksi.length} transaksi
                  </p>
                </div>
                <button
                  onClick={() => {
                    onOpenSession(s.id)
                    onClose()
                  }}
                  className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft hover:bg-line hover:text-ink"
                  aria-label="Buka"
                >
                  <FolderOpen size={16} />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Hapus "${s.nama}"? Tidak bisa dibatalkan.`)) {
                      onDeleteSession(s.id)
                    }
                  }}
                  className="grid h-8 w-8 place-items-center rounded-lg text-ink-soft hover:bg-rust-soft hover:text-rust"
                  aria-label="Hapus"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <p className="mb-2 text-[11px] font-semibold tracking-wide text-ink-soft uppercase">
          Cadangkan data
        </p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="soft" onClick={handleExport}>
            <Download size={16} /> Export
          </Button>
          <Button variant="soft" onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> Import
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleImportFile(f)
            e.target.value = ''
          }}
        />
        <p className="mt-2 text-[11px] text-ink-faint">
          Data hanya tersimpan di perangkat ini. Export untuk pindah perangkat
          atau berbagi backup.
        </p>
      </div>
    </Sheet>
  )
}
