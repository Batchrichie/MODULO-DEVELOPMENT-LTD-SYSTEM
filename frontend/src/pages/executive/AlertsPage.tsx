import { useEffect, useState } from 'react'
import { EmptyState } from '../../components/EmptyState'
import { FormErrorBanner } from '../../components/FormErrorBanner'
import { fetchDashboardExecutive } from '../../lib/rpc/dashboardExecutive'
import '../../styles/executive-dashboard.css'

type AlertItem = {
  type?: string | null
  date?: string | null
  message?: string | null
  severity?: string | null
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty' }
  | { status: 'success'; alerts: AlertItem[] }

function formatDate(value?: string | null): string {
  if (!value) return 'Unknown'
  return new Date(value).toLocaleDateString('en-GB')
}

export function AlertsPage() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    let active = true

    async function load() {
      const result = await fetchDashboardExecutive()
      if (!active) return

      if (!result.ok) {
        setState({ status: 'error', message: result.error })
        return
      }

      const alerts = Array.isArray((result.data as any).alerts)
        ? (result.data as any).alerts.map((alert: any) => ({
            type: alert.type,
            date: alert.date,
            message: alert.message,
            severity: alert.severity,
          }))
        : []

      if (alerts.length === 0) {
        setState({ status: 'empty' })
        return
      }

      setState({ status: 'success', alerts })
    }

    void load()
    return () => {
      active = false
    }
  }, [])

  if (state.status === 'loading') {
    return (
      <article className="exec-dash exec-screen" role="status" aria-live="polite">
        <header className="exec-screen__header">
          <p className="exec-dash__breadcrumb">Executive Dashboard</p>
          <h1>Alerts & Notifications</h1>
          <p>Full alert view for CEO review.</p>
        </header>

        <div className="exec-dash__panel exec-dash__panel--standalone">
          <p>Loading alerts…</p>
        </div>
      </article>
    )
  }

  if (state.status === 'error') {
    return (
      <article className="exec-dash exec-screen" role="alert">
        <header className="exec-screen__header">
          <p className="exec-dash__breadcrumb">Executive Dashboard</p>
          <h1>Alerts & Notifications</h1>
          <p>Full alert view for CEO review.</p>
        </header>

        <FormErrorBanner message={state.message} label="Unable to load alerts" />
      </article>
    )
  }

  if (state.status === 'empty') {
    return (
      <article className="exec-dash exec-screen">
        <header className="exec-screen__header">
          <p className="exec-dash__breadcrumb">Executive Dashboard</p>
          <h1>Alerts & Notifications</h1>
          <p>Full alert view for CEO review.</p>
        </header>

        <EmptyState title="No alerts at this time" description="There are currently no executive alerts to display." />
      </article>
    )
  }

  return (
    <article className="exec-dash exec-screen">
      <header className="exec-screen__header">
        <p className="exec-dash__breadcrumb">Executive Dashboard</p>
        <h1>Alerts & Notifications</h1>
        <p>Full alert view for CEO review.</p>
      </header>

      <section className="exec-screen__panel exec-screen__panel--standalone" aria-labelledby="alerts-list-title">
        <h2 id="alerts-list-title">Alerts</h2>
        <ul className="exec-dash__alerts">
          {state.alerts.map((alert, index) => (
            <li key={`${alert.message ?? ''}-${index}`} className="exec-dash__alert">
              <div>
                <strong>{alert.type ?? 'Alert'}</strong>
                <p>{alert.message ?? 'No details available.'}</p>
              </div>
              <div>
                <span>{formatDate(alert.date)}</span>
                {alert.severity ? <span>Severity: {alert.severity}</span> : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </article>
  )
}
