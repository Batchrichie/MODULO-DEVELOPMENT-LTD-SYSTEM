import { useEffect, useMemo, useState } from 'react'
import { formatMoneyGhs } from '../../lib/formatMoney'
import { fetchJournalEntries, type AccountantJournal } from '../../lib/rpc/accountant'
import '../../styles/executive-dashboard.css'

export function AccountantJournalEntriesPage() {
  const [entries, setEntries] = useState<AccountantJournal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    void loadEntries()
  }, [])

  async function loadEntries() {
    setLoading(true)
    setError(null)
    const result = await fetchJournalEntries()
    if (result.ok) {
      setEntries(result.data)
    } else {
      setError(result.error)
      setEntries([])
    }
    setLoading(false)
  }

  const filteredEntries = useMemo(() => {
    const query = filter.trim().toLowerCase()
    if (!query) return entries
    return entries.filter((entry) => {
      const haystack = [entry.journal_id, entry.source_type, entry.accounting_period, entry.status, entry.reference, entry.description]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [entries, filter])

  if (loading) {
    return <article className="exec-dash"><p className="exec-dash__breadcrumb">Accounting Workspace / Journal Entries</p><div className="exec-dash__state-card"><h2 className="exec-dash__state-title">Loading journal entries</h2><p className="exec-dash__state-message">System-generated journals are being fetched.</p></div></article>
  }

  if (error) {
    return <article className="exec-dash"><p className="exec-dash__breadcrumb">Accounting Workspace / Journal Entries</p><div className="exec-dash__state-card exec-dash__state-card--error"><h2 className="exec-dash__state-title">Unable to load journal entries</h2><p className="exec-dash__state-message">{error}</p><p className="exec-dash__state-hint">The backend may not expose the expected journal RPC payload yet.</p></div></article>
  }

  return (
    <article className="exec-dash">
      <p className="exec-dash__breadcrumb">Accounting Workspace / Journal Entries</p>
      <div className="exec-dash__row">
        <div className="exec-dash__panel">
          <div className="exec-dash__panel-title">Read-only journal ledger</div>
          <p className="exec-dash__mock-note">No manual journal entry UI is available. Journals are system-generated only.</p>
          <label>
            Filter entries
            <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search by reference, period, or status" style={{ display: 'block', width: '100%', marginTop: '0.25rem', marginBottom: '0.75rem' }} />
          </label>
        </div>
        <div className="exec-dash__panel">
          <div className="exec-dash__panel-title">Entries</div>
          {!filteredEntries.length ? (
            <div className="exec-dash__state-card exec-dash__state-card--empty"><h2 className="exec-dash__state-title">No journal entries found</h2><p className="exec-dash__state-message">No system-generated journals are available yet.</p></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Reference</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Date</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Source</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Period</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Amount</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.map((entry) => (
                    <tr key={entry.journal_id ?? entry.id ?? entry.reference ?? entry.created_at}>
                      <td style={{ padding: '0.5rem' }}>{entry.reference ?? entry.journal_id ?? '—'}</td>
                      <td style={{ padding: '0.5rem' }}>{entry.txn_date ?? entry.created_at ?? '—'}</td>
                      <td style={{ padding: '0.5rem' }}>{entry.source_type ?? '—'}</td>
                      <td style={{ padding: '0.5rem' }}>{entry.accounting_period ?? '—'}</td>
                      <td style={{ padding: '0.5rem' }}>{formatMoneyGhs(Number(entry.amount ?? entry.total_amount ?? 0) || 0)}</td>
                      <td style={{ padding: '0.5rem' }}>{entry.status ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
