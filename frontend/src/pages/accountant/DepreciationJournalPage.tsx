import { useEffect, useState } from 'react'
import { EmptyState } from '../../components/EmptyState'
import { formatMoneyGhs } from '../../lib/formatMoney'
import { supabase } from '../../lib/supabase'
import { unwrapRpcResponse } from '../../lib/common'
import '../../styles/executive-dashboard.css'

interface DepreciationJournalRecord {
  journal_id?: string
  id?: string
  asset_name?: string | null
  period?: string | null
  depreciation_amount?: number | null
  account_code?: string | null
  status?: string | null
}

export function DepreciationJournalPage() {
  const [rows, setRows] = useState<DepreciationJournalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void loadRows()
  }, [])

  async function loadRows() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.schema('api').rpc('get_records', {
      p_resource: 'depreciation_journal',
      p_page: 1,
      p_limit: 100,
    })

    if (error) {
      setError(error.message)
      setRows([])
    } else {
      const unwrapped = unwrapRpcResponse(data)
      if (!unwrapped.ok) {
        setError(unwrapped.error)
        setRows([])
      } else {
        setRows(Array.isArray(unwrapped.value) ? unwrapped.value : [])
      }
    }

    setLoading(false)
  }

  if (loading) {
    return <article className="admin-dashboard"><header className="admin-dashboard__header"><div><p className="admin-dashboard__eyebrow">Asset Management</p><h1>Depreciation Journal</h1><p>Review monthly depreciation entries and their accounting impact.</p></div></header><section className="users-card"><div className="exec-dash__state-card"><h2 className="exec-dash__state-title">Loading depreciation journal</h2><p className="exec-dash__state-message">Fetching depreciation entries so you can review asset expense timing.</p></div></section></article>
  }

  if (error) {
    return <article className="admin-dashboard"><header className="admin-dashboard__header"><div><p className="admin-dashboard__eyebrow">Asset Management</p><h1>Depreciation Journal</h1><p>Review monthly depreciation entries and their accounting impact.</p></div></header><section className="users-card"><div className="exec-dash__state-card exec-dash__state-card--error"><h2 className="exec-dash__state-title">Unable to load depreciation journal</h2><p className="exec-dash__state-message">{error}</p></div></section></article>
  }

  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Asset Management</p>
          <h1>Depreciation Journal</h1>
          <p>Review monthly depreciation entries and their accounting impact.</p>
        </div>
      </header>

      <section className="users-card">
        <div className="users-card__header">
          <div>
            <h2>Journal entries</h2>
            <p>The page exposes a read-only journal view of the depreciation resource.</p>
          </div>
          <div className="users-card__actions"><button type="button" className="button button--secondary" onClick={() => void loadRows()}>Refresh</button></div>
        </div>

        {!rows.length ? (
          <EmptyState
            icon="📉"
            title="No depreciation journal rows found"
            description="No depreciation journal records are currently available. This page calls a backend resource that may not be exposed yet."
          />
        ) : (
          <div style={{ overflowX: 'auto', padding: '0 21px 21px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Asset</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Period</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>Depreciation amount</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Account code</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.journal_id ?? row.id ?? row.asset_name}>
                    <td style={{ padding: '0.5rem' }}>{row.asset_name ?? '—'}</td>
                    <td style={{ padding: '0.5rem' }}>{row.period ?? '—'}</td>
                    <td style={{ textAlign: 'right', padding: '0.5rem' }}>{formatMoneyGhs(Number(row.depreciation_amount ?? 0) || 0)}</td>
                    <td style={{ padding: '0.5rem' }}>{row.account_code ?? '—'}</td>
                    <td style={{ padding: '0.5rem' }}>{row.status ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </article>
  )
}
