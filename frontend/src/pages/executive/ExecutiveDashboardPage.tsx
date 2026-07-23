import { useEffect, useState } from 'react'
import { fetchDashboardExecutive } from '../../lib/rpc/dashboardExecutive'
import { formatCount, formatMoneyGhs } from '../../lib/formatMoney'
import {
  isExecutiveDashboardEmpty,
  type ExecutiveDashboardData,
  type ExecutiveAlert,
  type ExecutiveTaxStatusItem,
} from '../../types/dashboardExecutive'
import '../../styles/executive-dashboard.css'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string; code?: string }
  | { status: 'empty'; data: ExecutiveDashboardData }
  | { status: 'success'; data: ExecutiveDashboardData }

const TAX_TYPES = ['VAT', 'NHIL', 'GETFund', 'PAYE', 'SSNIT'] as const

function StatCard({ label, value, tone, icon }: { label: string; value: string; tone: string; icon: string }) {
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

function MockChartPanel({ title }: { title: string }) {
  return (
    <section className="exec-dash__panel exec-dash__panel--mock" aria-labelledby={`mock-${title}`}>
      <h3 className="exec-dash__panel-title" id={`mock-${title}`}>
        {title}
      </h3>
      <div className="exec-dash__mock-body">
        <span className="exec-dash__mock-badge">Mock data — pending backend</span>
        <p className="exec-dash__mock-note">
          No aggregate endpoint exists for this chart yet (per Frontend Engineering Standard known
          gaps). This panel is intentionally not wired to live data.
        </p>
      </div>
    </section>
  )
}

function TaxStatusPanel({
  items,
  taxDataMissing,
}: {
  items: ExecutiveTaxStatusItem[] | null
  taxDataMissing: boolean
}) {
  return (
    <section className="exec-dash__panel" aria-labelledby="tax-status-title">
      <h3 className="exec-dash__panel-title" id="tax-status-title">
        Tax Status
      </h3>
      {taxDataMissing ? (
        <p className="exec-dash__gap-note">
          Tax status data was not returned by <code>dashboard_executive()</code>. A separate
          endpoint was not called — flagging as a backend response-shape gap.
        </p>
      ) : items && items.length > 0 ? (
        <ul className="exec-dash__tax-list">
          {items.map((item) => (
            <li key={item.type} className="exec-dash__tax-item">
              <span className="exec-dash__tax-type">{item.type}</span>
              <span className={`exec-dash__tax-status exec-dash__tax-status--${item.status.toLowerCase()}`}>
                {item.status}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="exec-dash__tax-list exec-dash__tax-list--placeholder">
          {TAX_TYPES.map((type) => (
            <li key={type} className="exec-dash__tax-item">
              <span className="exec-dash__tax-type">{type}</span>
              <span className="exec-dash__tax-status exec-dash__tax-status--unknown">No data</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function AlertsPanel({ alerts }: { alerts: ExecutiveAlert[] }) {
  return (
    <section className="exec-dash__panel" aria-labelledby="alerts-title">
      <h3 className="exec-dash__panel-title" id="alerts-title">
        Alerts &amp; Notifications
      </h3>
      {alerts.length === 0 ? (
        <p className="exec-dash__empty-inline">No alerts at this time.</p>
      ) : (
        <ul className="exec-dash__alerts">
          {alerts.map((alert, index) => (
            <li key={`${alert.message}-${index}`} className="exec-dash__alert">
              {alert.message}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function statPath(icon: string) {
  const paths: Record<string, string> = {
    cash: 'M4 7h16v10H4zM4 10h16',
    revenue: 'M5 19V9m7 10V5m7 14v-7',
    profit: 'M5 15l4-4 3 3 7-8',
    projects: 'M4 6h16v12H4zM8 6v12m8-12v12',
    tax: 'M5 7h14M7 12h10m-8 5h6',
    alerts: 'M12 4a4 4 0 0 1 4 4v2.2c0 .4.1.8.3 1.2l1.1 2.8a1 1 0 0 1-.9 1.4H7.5a1 1 0 0 1-.9-1.4l1.1-2.8c.2-.4.3-.8.3-1.2V8a4 4 0 0 1 4-4Z',
  }

  return paths[icon] ?? paths.cash
}

export function ExecutiveDashboardPage() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    async function load() {
      const result = await fetchDashboardExecutive()
      if (cancelled) return

      if (!result.ok) {
        setState({
          status: 'error',
          message: result.error,
          code: result.code,
        })
        return
      }

      if (isExecutiveDashboardEmpty(result.data)) {
        setState({ status: 'empty', data: result.data })
        return
      }

      setState({ status: 'success', data: result.data })
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (state.status === 'loading') {
    return (
      <article className="admin-dashboard" role="status" aria-live="polite">
        <header className="admin-dashboard__header">
          <div>
            <p className="admin-dashboard__eyebrow">Leadership</p>
            <h1>Executive Dashboard</h1>
            <p>Track cash, revenue, tax obligations, and delivery health from one view.</p>
          </div>
        </header>
        <section className="admin-dashboard__stats" aria-label="Executive metrics">
          {['Cash Position', 'Revenue (period)', 'Net Profit', 'Active Projects'].map((label) => (
            <div key={label} className="stat-card">
              <div className="stat-card__icon stat-card__icon--blue">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d={statPath('cash')} /></svg>
              </div>
              <div className="stat-card__content">
                <span>{label}</span>
                <strong>Loading…</strong>
                <small>Live view</small>
              </div>
            </div>
          ))}
        </section>
        <section className="users-card">
          <div className="users-card__header">
            <div>
              <h2>Executive Snapshot</h2>
              <p>Performance signals and current action items will appear here.</p>
            </div>
          </div>
          <div className="exec-dash__state-card exec-dash__state-card--empty">
            <p className="exec-dash__state-message">Loading executive dashboard…</p>
          </div>
        </section>
      </article>
    )
  }

  if (state.status === 'error') {
    return (
      <article className="admin-dashboard" role="alert">
        <header className="admin-dashboard__header">
          <div>
            <p className="admin-dashboard__eyebrow">Leadership</p>
            <h1>Executive Dashboard</h1>
            <p>Track cash, revenue, tax obligations, and delivery health from one view.</p>
          </div>
        </header>
        <section className="users-card">
          <div className="users-card__header">
            <div>
              <h2>Executive Snapshot</h2>
              <p>Performance signals and current action items will appear here.</p>
            </div>
          </div>
          <div className="exec-dash__state-card exec-dash__state-card--error">
            <h2 className="exec-dash__state-title">Unable to load dashboard</h2>
            <p className="exec-dash__state-message">{state.message}</p>
            {state.code && (
              <p className="exec-dash__state-code">
                Error code: <code>{state.code}</code>
              </p>
            )}
            <p className="exec-dash__state-hint">
              This screen calls <code>dashboard_executive()</code> only. If the function is missing
              or your role is unauthorized, contact an administrator.
            </p>
          </div>
        </section>
      </article>
    )
  }

  const data = state.data
  const taxDataMissing = data.taxStatus === null

  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Leadership</p>
          <h1>Executive Dashboard</h1>
          <p>Track cash, revenue, tax obligations, and delivery health from one view.</p>
        </div>
      </header>

      <section className="admin-dashboard__stats" aria-label="Executive metrics">
        <StatCard label="Cash Position" value={formatMoneyGhs(data.cashPosition)} tone="green" icon="cash" />
        <StatCard label="Revenue (period)" value={formatMoneyGhs(data.revenue)} tone="blue" icon="revenue" />
        <StatCard label="Net Profit" value={formatMoneyGhs(data.netProfit)} tone="purple" icon="profit" />
        <StatCard label="Active Projects" value={formatCount(data.activeProjects)} tone="orange" icon="projects" />
      </section>

      <section className="users-card">
        <div className="users-card__header">
          <div>
            <h2>Executive Snapshot</h2>
            <p>High-level operational signals and immediate follow-up items.</p>
          </div>
        </div>

        {state.status === 'empty' && (
          <div className="exec-dash__state-card exec-dash__state-card--empty" role="status">
            <p className="exec-dash__state-message">
              Dashboard loaded but contains no project or financial activity yet.
            </p>
          </div>
        )}

        <div className="exec-dash__row">
          <MockChartPanel title="Project Profitability" />
          <MockChartPanel title="Equipment Rental Revenue" />
        </div>

        <div className="exec-dash__row">
          <TaxStatusPanel items={data.taxStatus} taxDataMissing={taxDataMissing} />
          <AlertsPanel alerts={data.alerts} />
        </div>
      </section>
    </article>
  )
}
