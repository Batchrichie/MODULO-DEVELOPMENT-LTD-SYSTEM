import { useEffect, useMemo, useState } from 'react'
import { formatMoneyGhs } from '../../lib/formatMoney'
import { getRecords } from '../../lib/rpc/accountant'
import '../../styles/executive-dashboard.css'

interface JournalRecord {
  journal_id?: string
  id?: string
  reference?: string | null
  source_type?: string | null
  accounting_period?: string | null
  status?: string | null
  txn_date?: string | null
  description?: string | null
}

interface JournalLineRecord {
  line_id?: string
  id?: string
  journal_id?: string | null
  account_code?: string | null
  account_name?: string | null
  debit?: number | null
  credit?: number | null
  description?: string | null
}

export function AccountantGeneralLedgerPage() {
  const [journals, setJournals] = useState<JournalRecord[]>([])
  const [lines, setLines] = useState<JournalLineRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    void loadLedger()
  }, [])

  async function loadLedger() {
    setLoading(true)
    setError(null)
    const [journalsResult, linesResult] = await Promise.all([
      getRecords<JournalRecord[]>('journals', 1, 200),
      getRecords<JournalLineRecord[]>('journal_lines', 1, 500),
    ])

    if (journalsResult.ok) {
      setJournals(journalsResult.data)
    } else {
      setJournals([])
      setError((current) => (current ? `${current}; ${journalsResult.error}` : journalsResult.error))
    }

    if (linesResult.ok) {
      setLines(linesResult.data)
    } else {
      setLines([])
      setError((current) => (current ? `${current}; ${linesResult.error}` : linesResult.error))
    }

    setLoading(false)
  }

  const groupedLines = useMemo(() => {
    return lines.reduce((acc, line) => {
      const journalId = line.journal_id ?? 'unknown'
      if (!acc[journalId]) acc[journalId] = []
      acc[journalId].push(line)
      return acc
    }, {} as Record<string, JournalLineRecord[]>)
  }, [lines])

  const filteredJournals = useMemo(() => {
    const query = filter.trim().toLowerCase()
    if (!query) return journals
    return journals.filter((journal) => {
      const haystack = [journal.reference, journal.source_type, journal.accounting_period, journal.status, journal.description, journal.txn_date]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [journals, filter])

  if (loading) {
    return (
      <article className="admin-dashboard" role="status">
        <header className="admin-dashboard__header">
          <div>
            <p className="admin-dashboard__eyebrow">Accounting Workspace</p>
            <h1>General Ledger</h1>
            <p>Review ledger journals and line-level postings by journal.</p>
          </div>
        </header>
        <section className="users-card"><div className="exec-dash__state-card"><h2 className="exec-dash__state-title">Loading ledger</h2><p className="exec-dash__state-message">Fetching journal entries and ledger lines.</p></div></section>
      </article>
    )
  }

  if (error) {
    return (
      <article className="admin-dashboard" role="alert">
        <header className="admin-dashboard__header">
          <div>
            <p className="admin-dashboard__eyebrow">Accounting Workspace</p>
            <h1>General Ledger</h1>
            <p>Review ledger journals and line-level postings by journal.</p>
          </div>
        </header>
        <section className="users-card"><div className="exec-dash__state-card exec-dash__state-card--error"><h2 className="exec-dash__state-title">Unable to load ledger</h2><p className="exec-dash__state-message">{error}</p><p className="exec-dash__state-hint">The general ledger requires journal and journal_lines access.</p></div></section>
      </article>
    )
  }

  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Accounting Workspace</p>
          <h1>General Ledger</h1>
          <p>Review ledger journals and line-level postings by journal.</p>
        </div>
      </header>

      <section className="users-card">
        <div className="users-card__header">
          <div>
            <h2>Ledger overview</h2>
            <p>Use this screen to inspect journal headers and their underlying lines.</p>
          </div>
          <div className="users-card__actions">
            <label className="form-field" style={{ margin: 0, width: '100%', minWidth: 0 }}>
              <span className="form-field__label">Search journals</span>
              <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search by reference, period, or status" />
            </label>
            <button type="button" className="button button--secondary" onClick={() => void loadLedger()}>Refresh</button>
          </div>
        </div>

        {!filteredJournals.length ? (
          <div className="exec-dash__state-card exec-dash__state-card--empty"><h2 className="exec-dash__state-title">No journal entries found</h2><p className="exec-dash__state-message">There are no journals matching the current filter.</p></div>
        ) : (
          <div className="exec-dash__panel exec-dash__panel--standalone">
            <div className="exec-dash__panel-title">Journal entries</div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Date</th>
                    <th>Source</th>
                    <th>Period</th>
                    <th>Status</th>
                    <th>Lines</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJournals.map((journal) => {
                    const journalId = journal.journal_id ?? journal.id ?? 'unknown'
                    const journalLines = groupedLines[journalId] ?? []
                    return (
                      <tr key={journalId}>
                        <td>{journal.reference ?? journalId}</td>
                        <td>{journal.txn_date ?? '—'}</td>
                        <td>{journal.source_type ?? '—'}</td>
                        <td>{journal.accounting_period ?? '—'}</td>
                        <td>{journal.status ?? '—'}</td>
                        <td>{journalLines.length}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="exec-dash__panel exec-dash__panel--standalone">
          <div className="exec-dash__panel-title">Selected journal lines</div>
          {lines.length === 0 ? (
            <p className="exec-dash__state-message">No ledger lines are available. The backend may not expose the `journal_lines` resource.</p>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Journal</th>
                    <th>Account</th>
                    <th>Description</th>
                    <th className="data-table__num">Debit</th>
                    <th className="data-table__num">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => (
                    <tr key={line.line_id ?? line.id ?? `${line.journal_id}-${line.account_code}-${line.description}`}>
                      <td>{line.journal_id ?? '—'}</td>
                      <td>{line.account_code ?? line.account_name ?? '—'}</td>
                      <td>{line.description ?? '—'}</td>
                      <td className="data-table__num">{formatMoneyGhs(Number(line.debit ?? 0) || 0)}</td>
                      <td className="data-table__num">{formatMoneyGhs(Number(line.credit ?? 0) || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </article>
  )
}
