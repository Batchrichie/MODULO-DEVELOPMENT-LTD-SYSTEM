import { useEffect, useMemo, useState } from 'react'
import { formatMoneyGhs } from '../../lib/formatMoney'
import { fetchTrialBalance, type TrialBalanceRow } from '../../lib/rpc/accountant'
import '../../styles/executive-dashboard.css'

function MetricCard({ label, value, tone, icon }: { label: string; value: string; tone: string; icon: string }) {
  return (
    <div className="stat-card">
      <div className={`stat-card__icon stat-card__icon--${tone}`}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d={statPath(icon)} />
        </svg>
      </div>
      <div className="stat-card__content">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>Live view</small>
      </div>
    </div>
  )
}

function statPath(icon: string) {
  const paths: Record<string, string> = {
    debit: 'M5 7h14v10H5zM8 11h8',
    credit: 'M5 7h14v10H5zM8 11h8',
    difference: 'M5 12h14M12 5l7 7-7 7',
    report: 'M7 3h10a2 2 0 0 1 2 2v14l-4-2-4 2-4-2-4 2V5a2 2 0 0 1 2-2Z',
  }

  return paths[icon] ?? paths.report
}

export function AccountantTrialBalancePage() {
  const [rows, setRows] = useState<TrialBalanceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10))

  useEffect(() => {
    void loadTrialBalance()
  }, [])

  async function loadTrialBalance() {
    setLoading(true)
    setError(null)
    const result = await fetchTrialBalance(asOf)
    if (result.ok) {
      setRows(result.data)
    } else {
      setError(result.error)
      setRows([])
    }
    setLoading(false)
  }

  const totals = useMemo(() => {
    const debit = rows.reduce((sum, row) => sum + (Number(row.debit ?? 0) || 0), 0)
    const credit = rows.reduce((sum, row) => sum + (Number(row.credit ?? 0) || 0), 0)
    return { debit, credit, difference: debit - credit }
  }, [rows])

  if (loading) {
    return (
      <article className="admin-dashboard">
        <header className="admin-dashboard__header">
          <div>
            <p className="admin-dashboard__eyebrow">Accounting Workspace</p>
            <h1>Trial Balance</h1>
            <p>Check the ledger movement and verify the books remain in balance.</p>
          </div>
        </header>
        <section className="users-card">
          <div className="users-card__header">
            <div>
              <h2>Trial Balance Report</h2>
              <p>Generate and review the report for the selected period.</p>
            </div>
          </div>
          <div className="exec-dash__state-card"><h2 className="exec-dash__state-title">Loading trial balance</h2><p className="exec-dash__state-message">The report is being generated for the selected date.</p></div>
        </section>
      </article>
    )
  }

  if (error) {
    return (
      <article className="admin-dashboard">
        <header className="admin-dashboard__header">
          <div>
            <p className="admin-dashboard__eyebrow">Accounting Workspace</p>
            <h1>Trial Balance</h1>
            <p>Check the ledger movement and verify the books remain in balance.</p>
          </div>
        </header>
        <section className="users-card">
          <div className="users-card__header">
            <div>
              <h2>Trial Balance Report</h2>
              <p>Generate and review the report for the selected period.</p>
            </div>
          </div>
          <div className="exec-dash__state-card exec-dash__state-card--error"><h2 className="exec-dash__state-title">Unable to load trial balance</h2><p className="exec-dash__state-message">{error}</p><p className="exec-dash__state-hint">The backend may not expose the report trial balance RPC yet.</p></div>
        </section>
      </article>
    )
  }

  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Accounting Workspace</p>
          <h1>Trial Balance</h1>
          <p>Check the ledger movement and verify the books remain in balance.</p>
        </div>
      </header>

      <section className="admin-dashboard__stats" aria-label="Trial balance metrics">
        <MetricCard label="Debit" value={formatMoneyGhs(totals.debit)} tone="blue" icon="debit" />
        <MetricCard label="Credit" value={formatMoneyGhs(totals.credit)} tone="green" icon="credit" />
        <MetricCard label="Difference" value={formatMoneyGhs(totals.difference)} tone="purple" icon="difference" />
      </section>

      <section className="users-card">
        <div className="users-card__header">
          <div>
            <h2>Trial Balance Report</h2>
            <p>Generate and review the report for the selected period.</p>
          </div>
          <div className="users-card__actions">
            <button type="button" className="button button--secondary" onClick={() => void loadTrialBalance()}>Refresh report</button>
          </div>
        </div>

        <div className="exec-dash__row">
          <div className="exec-dash__panel">
            <div className="exec-dash__panel-title">Report parameters</div>
            <label>
              As of date
              <input type="date" value={asOf} onChange={(event) => setAsOf(event.target.value)} style={{ display: 'block', width: '100%', marginTop: '0.25rem', marginBottom: '0.75rem' }} />
            </label>
            <button type="button" className="button button--primary" onClick={() => void loadTrialBalance()}>Refresh report</button>
          </div>
          <div className="exec-dash__panel">
            <div className="exec-dash__panel-title">Summary</div>
            <p className="exec-dash__mock-note">Totals shown in GHS with two decimal places.</p>
            <div className="exec-dash__kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="exec-dash__kpi"><span className="exec-dash__kpi-label">Debit</span><strong className="exec-dash__kpi-value">{formatMoneyGhs(totals.debit)}</strong></div>
              <div className="exec-dash__kpi"><span className="exec-dash__kpi-label">Credit</span><strong className="exec-dash__kpi-value">{formatMoneyGhs(totals.credit)}</strong></div>
              <div className="exec-dash__kpi"><span className="exec-dash__kpi-label">Difference</span><strong className="exec-dash__kpi-value">{formatMoneyGhs(totals.difference)}</strong></div>
            </div>
          </div>
        </div>

        <div className="exec-dash__panel" style={{ margin: '0 21px 21px' }}>
          <div className="exec-dash__panel-title">Trial balance rows</div>
          {!rows.length ? (
            <div className="exec-dash__state-card exec-dash__state-card--empty"><h2 className="exec-dash__state-title">No trial balance rows</h2><p className="exec-dash__state-message">No balances are available for this date.</p></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Code</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Account</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem' }}>Debit</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem' }}>Credit</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem' }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.account_id ?? row.account_code ?? row.code ?? row.name ?? Math.random().toString()}>
                      <td style={{ padding: '0.5rem' }}>{row.account_code ?? row.code ?? '—'}</td>
                      <td style={{ padding: '0.5rem' }}>{row.account_name ?? row.name ?? '—'}</td>
                      <td style={{ textAlign: 'right', padding: '0.5rem' }}>{formatMoneyGhs(Number(row.debit ?? 0) || 0)}</td>
                      <td style={{ textAlign: 'right', padding: '0.5rem' }}>{formatMoneyGhs(Number(row.credit ?? 0) || 0)}</td>
                      <td style={{ textAlign: 'right', padding: '0.5rem' }}>{formatMoneyGhs(Number(row.balance ?? 0) || 0)}</td>
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
