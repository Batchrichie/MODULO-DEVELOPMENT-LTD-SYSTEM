import { useEffect, useState } from 'react'
import { EmptyState } from '../../components/EmptyState'
import { formatMoneyGhs } from '../../lib/formatMoney'
import { supabase } from '../../lib/supabase'
import { unwrapRpcResponse } from '../../lib/common'
import '../../styles/executive-dashboard.css'

interface PpeScheduleRecord {
  schedule_id?: string
  id?: string
  asset_name?: string | null
  year?: string | null
  opening_balance?: number | null
  additions?: number | null
  disposals?: number | null
  closing_balance?: number | null
}

export function PpeSchedulePage() {
  const [rows, setRows] = useState<PpeScheduleRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void loadRows()
  }, [])

  async function loadRows() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.schema('api').rpc('get_records', {
      p_resource: 'ppe_schedule',
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
    return <article className="admin-dashboard"><header className="admin-dashboard__header"><div><p className="admin-dashboard__eyebrow">Asset Management</p><h1>PPE Schedule</h1><p>Review the PPE schedule year-over-year.</p></div></header><section className="users-card"><div className="exec-dash__state-card"><h2 className="exec-dash__state-title">Loading PPE schedule</h2><p className="exec-dash__state-message">Fetching the schedule view from the resources endpoint.</p></div></section></article>
  }

  if (error) {
    return <article className="admin-dashboard"><header className="admin-dashboard__header"><div><p className="admin-dashboard__eyebrow">Asset Management</p><h1>PPE Schedule</h1><p>Review the PPE schedule year-over-year.</p></div></header><section className="users-card"><div className="exec-dash__state-card exec-dash__state-card--error"><h2 className="exec-dash__state-title">Unable to load PPE schedule</h2><p className="exec-dash__state-message">{error}</p></div></section></article>
  }

  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Asset Management</p>
          <h1>PPE Schedule</h1>
          <p>Review the PPE schedule year-over-year.</p>
        </div>
      </header>

      <section className="users-card">
        <div className="users-card__header">
          <div>
            <h2>PPE movement schedule</h2>
            <p>The page uses a resource-backed read-only view for the current PPE schedule data.</p>
          </div>
          <div className="users-card__actions"><button type="button" className="button button--secondary" onClick={() => void loadRows()}>Refresh</button></div>
        </div>

        {!rows.length ? (
          <EmptyState
            icon="📋"
            title="No PPE schedule data found"
            description="No rows are available for the `ppe_schedule` resource. This page calls a backend resource that may not be exposed yet."
          />
        ) : (
          <div style={{ overflowX: 'auto', padding: '0 21px 21px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Asset</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Year</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>Opening balance</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>Additions</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>Disposals</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>Closing balance</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.schedule_id ?? row.id ?? row.asset_name}>
                    <td style={{ padding: '0.5rem' }}>{row.asset_name ?? '—'}</td>
                    <td style={{ padding: '0.5rem' }}>{row.year ?? '—'}</td>
                    <td style={{ textAlign: 'right', padding: '0.5rem' }}>{formatMoneyGhs(Number(row.opening_balance ?? 0) || 0)}</td>
                    <td style={{ textAlign: 'right', padding: '0.5rem' }}>{formatMoneyGhs(Number(row.additions ?? 0) || 0)}</td>
                    <td style={{ textAlign: 'right', padding: '0.5rem' }}>{formatMoneyGhs(Number(row.disposals ?? 0) || 0)}</td>
                    <td style={{ textAlign: 'right', padding: '0.5rem' }}>{formatMoneyGhs(Number(row.closing_balance ?? 0) || 0)}</td>
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
