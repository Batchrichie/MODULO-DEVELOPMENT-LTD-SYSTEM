import { useEffect, useState } from 'react'
import { EmptyState } from '../../components/EmptyState'
import { PendingBackendNotice } from '../../components/PendingBackendNotice'
import { formatMoneyGhs } from '../../lib/formatMoney'
import { getRecords } from '../../lib/rpc/accountant'
import '../../styles/executive-dashboard.css'

interface PpeScheduleRecord {
  id?: string
  name?: string | null
  category?: string | null
  cost?: number | null
  useful_life_years?: number | null
  depreciation_method?: string | null
  acquisition_date?: string | null
  status?: string | null
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

    const result = await getRecords<PpeScheduleRecord[]>('fixed_assets', 1, 100)
    if (result.ok) {
      setRows(result.data)
    } else {
      setError(result.error)
      setRows([])
    }

    setLoading(false)
  }

  if (loading) {
    return <article className="admin-dashboard"><header className="admin-dashboard__header"><div><p className="admin-dashboard__eyebrow">Asset Management</p><h1>PPE Schedule</h1><p>Review the PPE schedule year-over-year.</p></div></header><section className="users-card"><div className="exec-dash__state-card"><h2 className="exec-dash__state-title">Loading PPE schedule</h2><p className="exec-dash__state-message">Fetching the schedule view from the resources endpoint.</p></div></section></article>
  }

  if (error) {
    if (error.includes('Unknown resource')) {
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
            <PendingBackendNotice
              title="Pending backend"
              description="PPE Schedule requires a backend update. The get_records function does not expose the fixed_assets resource directly."
            />
          </section>
        </article>
      )
    }

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
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Category</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>Cost</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>Useful life (years)</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Depreciation method</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Acquisition date</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id ?? row.name}>
                    <td style={{ padding: '0.5rem' }}>{row.name ?? '—'}</td>
                    <td style={{ padding: '0.5rem' }}>{row.category ?? '—'}</td>
                    <td style={{ textAlign: 'right', padding: '0.5rem' }}>{formatMoneyGhs(Number(row.cost ?? 0) || 0)}</td>
                    <td style={{ textAlign: 'right', padding: '0.5rem' }}>{row.useful_life_years ?? '—'}</td>
                    <td style={{ padding: '0.5rem' }}>{row.depreciation_method ?? '—'}</td>
                    <td style={{ padding: '0.5rem' }}>{row.acquisition_date ?? '—'}</td>
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
