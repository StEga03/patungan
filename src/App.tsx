import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Header } from './components/Header'
import { MembersBar } from './components/MembersBar'
import { AddTransaction } from './components/AddTransaction'
import { TransactionList } from './components/TransactionList'
import { TransactionDetail } from './components/TransactionDetail'
import { Balances } from './components/Balances'
import { SettleUp } from './components/SettleUp'
import { StartScreen } from './components/StartScreen'
import { SessionSheet } from './components/SessionSheet'
import { useStore } from './hooks/useStore'
import { useTheme } from './hooks/useTheme'
import { computeBreakdown, computeSummary } from './lib/calc'
import { buildSummaryText } from './lib/summary'
import type { Transaction } from './lib/types'

export default function App() {
  const store = useStore()
  const { theme, toggle: toggleTheme } = useTheme()
  const { activeSession } = store
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [detail, setDetail] = useState<Transaction | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const summary = useMemo(() => {
    if (!activeSession) return null
    return {
      ...computeSummary(
        activeSession.anggota,
        activeSession.transaksi,
        activeSession.pembayaran ?? [],
      ),
      breakdown: computeBreakdown(
        activeSession.anggota,
        activeSession.transaksi,
      ),
    }
  }, [activeSession])

  if (!activeSession) {
    return (
      <div className="grain">
        <div className="relative z-10">
          <StartScreen
            onStart={store.startSession}
            archived={store.sessions}
            onOpenArchived={() => setMenuOpen(true)}
            theme={theme}
            onToggleTheme={toggleTheme}
          />
          <SessionSheet
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            sessions={store.sessions}
            activeId={null}
            onNewSession={store.archiveAndNew}
            onOpenSession={store.openSession}
            onDeleteSession={store.deleteSession}
            onExport={store.exportJson}
            onImport={store.importJson}
          />
        </div>
      </div>
    )
  }

  const hasMembers = activeSession.anggota.length > 0
  const hasTx = activeSession.transaksi.length > 0

  return (
    <div className="grain">
      <main className="relative z-10 mx-auto w-full max-w-md px-4 pt-3 pb-16">
        <Header
          nama={activeSession.nama}
          onRename={store.renameSession}
          onOpenMenu={() => setMenuOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <div className="space-y-4">
          <MembersBar
            anggota={activeSession.anggota}
            onAdd={store.addMember}
            onRemove={store.removeMember}
            onReactivate={store.reactivateMember}
          />

          {hasMembers ? (
            <AddTransaction
              key={editing?.id ?? 'new'}
              anggota={activeSession.anggota}
              editing={editing}
              onSubmit={(data) =>
                editing
                  ? store.updateTransaction(editing.id, data)
                  : store.addTransaction(data)
              }
              onCancelEdit={() => setEditing(null)}
            />
          ) : (
            <p className="rounded-[var(--radius-card)] border border-dashed border-line-strong bg-card/50 px-5 py-6 text-center text-sm text-ink-soft">
              Tambahkan anggota dulu untuk mulai mencatat transaksi.
            </p>
          )}

          {hasTx && (
            <TransactionList
              transaksi={activeSession.transaksi}
              anggota={activeSession.anggota}
              onEdit={(t) => {
                setEditing(t)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              onDelete={store.removeTransaction}
              onOpenDetail={setDetail}
            />
          )}

          <AnimatePresence>
            {hasTx && summary && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <Balances
                  balances={summary.balances}
                  breakdown={summary.breakdown}
                  anggota={activeSession.anggota}
                  transaksi={activeSession.transaksi}
                />
                <SettleUp
                  nama={activeSession.nama}
                  transfers={summary.transfers}
                  pembayaran={activeSession.pembayaran ?? []}
                  anggota={activeSession.anggota}
                  total={summary.total}
                  breakdown={summary.breakdown}
                  summaryText={buildSummaryText(activeSession)}
                  onMarkPaid={store.addPayment}
                  onUndoPaid={store.removePayment}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <footer className="mt-10 text-center text-[11px] text-ink-faint">
          🔒 Semua data tersimpan di perangkat ini saja
        </footer>
      </main>

      <SessionSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        sessions={store.sessions}
        activeId={activeSession.id}
        onNewSession={store.archiveAndNew}
        onOpenSession={store.openSession}
        onDeleteSession={store.deleteSession}
        onExport={store.exportJson}
        onImport={store.importJson}
      />

      <TransactionDetail
        transaksi={detail}
        anggota={activeSession.anggota}
        onClose={() => setDetail(null)}
        onEdit={(t) => {
          setEditing(t)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
        onDelete={store.removeTransaction}
      />
    </div>
  )
}
