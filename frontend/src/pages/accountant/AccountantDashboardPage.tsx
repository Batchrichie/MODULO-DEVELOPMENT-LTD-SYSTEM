import { useEffect, useMemo, useState } from 'react'
import { formatMoneyGhs } from '../../lib/formatMoney'
import { FormErrorBanner } from '../../components/FormErrorBanner'
import { PendingBackendNotice } from '../../components/PendingBackendNotice'
import {
  fetchDashboardAccountantTasks,
  fetchTrialBalance,
  getRecords,
  type DashboardTask,
} from '../../lib/rpc/accountant'
import '../../styles/executive-dashboard.css'

export function AccountantDashboardPage() {
  const [accountsCount, setAccountsCount] = useState<number | null>(null)
  const [journalsCount, setJournalsCount] = useState<number | null>(null)
  const [projectsCount, setProjectsCount] = useState<number | null>(null)
  const [trialBalanceRows, setTrialBalanceRows] = useState<Array<Record<string, unknown>>>([])
  const [tasks, setTasks] = useState<DashboardTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tasksError, setTasksError] = useState<string | null>(null)

  useEffect(() => {
    void loadDashboard()
  }, [])

  async function loadDashboard() {
    setLoading(true)
    setError(null)
    setTasksError(null)

    const today = new Date().toISOString().slice(0, 10)
    const [accountsResult, journalsResult, projectsResult, trialBalanceResult, tasksResult] = await Promise.all([
      getRecords('accounts', 1, 200),
      getRecords('journals', 1, 500),
      getRecords('projects', 1, 200),
      fetchTrialBalance(today),
      fetchDashboardAccountantTasks(),
    ])

    if (accountsResult.ok) {
      setAccountsCount(Array.isArray(accountsResult.data) ? accountsResult.data.length : 0)
    } else {
      setAccountsCount(null)
      setError((current) => (current ? `${current}; ${accountsResult.error}` : accountsResult.error))
    }

    if (journalsResult.ok) {
      setJournalsCount(Array.isArray(journalsResult.data) ? journalsResult.data.length : 0)
    } else {
      setJournalsCount(null)
      setError((current) => (current ? `${current}; ${journalsResult.error}` : journalsResult.error))
    }

    if (projectsResult.ok) {
      setProjectsCount(Array.isArray(projectsResult.data) ? projectsResult.data.length : 0)
    } else {
      setProjectsCount(null)
      setError((current) => (current ? `${current}; ${projectsResult.error}` : projectsResult.error))
    }

    if (trialBalanceResult.ok) {
      setTrialBalanceRows(trialBalanceResult.data)
    } else {
      setTrialBalanceRows([])
      setError((current) => (current ? `${current}; ${trialBalanceResult.error}` : trialBalanceResult.error))
    }

    if (tasksResult.ok) {
      setTasks(Array.isArray(tasksResult.data) ? tasksResult.data : [])
    } else {
      setTasks([])
      setTasksError(tasksResult.error)
    }

    setLoading(false)
  }

  const totals = useMemo(() => {
    const debit = trialBalanceRows.reduce((sum, row) => sum + (Number((row as any).debit ?? 0) || 0), 0)
    const credit = trialBalanceRows.reduce((sum, row) => sum + (Number((row as any).credit ?? 0) || 0), 0)
    return { debit, credit, difference: debit - credit }
  }, [trialBalanceRows])

  if (loading) {
    return (
      <article className="admin-dashboard" role="status">
        <header className="admin-dashboard__header">
          <div>
            <p className="admin-dashboard__eyebrow">Accounting Workspace</p>
            <h1>Dashboard</h1>
            <p>Monitor ledger health, cash flow, and accountant tasks from a central view.</p>
          </div>
        </header>
        <section className="admin-dashboard__stats" aria-label="Accounting dashboard metrics">
          {['Accounts', 'Journal Entries', 'Projects', 'Trial balance'].map((label) => (
            <div className="stat-card" key={label}>
              <div className="stat-card__icon stat-card__icon--blue">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v10H4zM8 11h8" /></svg>
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
              <h2>Accounting snapshot</h2>
              <p>Key balance and operational metrics are loading.</p>
            </div>
          </div>
          <div className="exec-dash__state-card"><h2 className="exec-dash__state-title">Loading dashboard</h2><p className="exec-dash__state-message">Fetching the latest accounting metrics and task list.</p></div>
        </section>
      </article>
    )
  }

  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Accounting Workspace</p>
          <h1>Dashboard</h1>
          <p>Monitor ledger health, cash flow, and accountant tasks from a central view.</p>
        </div>
      </header>
      {error && <FormErrorBanner message={error} label="Partial dashboard load" />}

      <section className="admin-dashboard__stats" aria-label="Accounting dashboard metrics">
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--blue"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v10H4zM8 11h8" /></svg></div>
          <div className="stat-card__content"><span>Accounts</span><strong>{accountsCount !== null ? accountsCount : '—'}</strong><small>Live view</small></div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--green"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v10H4zM8 11h8" /></svg></div>
          <div className="stat-card__content"><span>Journal Entries</span><strong>{journalsCount !== null ? journalsCount : '—'}</strong><small>Live view</small></div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--orange"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v10H4zM8 11h8" /></svg></div>
          <div className="stat-card__content"><span>Projects</span><strong>{projectsCount !== null ? projectsCount : '—'}</strong><small>Live view</small></div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--purple"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v10H4zM8 11h8" /></svg></div>
          <div className="stat-card__content"><span>Balance difference</span><strong>{formatMoneyGhs(totals.difference)}</strong><small>Live view</small></div>
        </div>
      </section>

      <section className="users-card">
        <div className="users-card__header">
          <div>
            <h2>Accounting health</h2>
            <p>Summarized totals from the latest trial balance and system balances.</p>
          </div>
          <div className="users-card__actions"><button type="button" className="button button--secondary" onClick={() => void loadDashboard()}>Refresh</button></div>
        </div>

        {error ? (
          <div className="exec-dash__state-card exec-dash__state-card--error"><h2 className="exec-dash__state-title">Partial load</h2><p className="exec-dash__state-message">{error}</p></div>
        ) : (
          <div className="exec-dash__panel exec-dash__panel--standalone">
            <div className="exec-dash__panel-title">Trial balance summary</div>
            <div className="exec-dash__kpi-grid exec-dash__kpi-grid--3">
              <div className="exec-dash__kpi"><span className="exec-dash__kpi-label">Debit</span><strong className="exec-dash__kpi-value">{formatMoneyGhs(totals.debit)}</strong></div>
              <div className="exec-dash__kpi"><span className="exec-dash__kpi-label">Credit</span><strong className="exec-dash__kpi-value">{formatMoneyGhs(totals.credit)}</strong></div>
              <div className="exec-dash__kpi"><span className="exec-dash__kpi-label">Difference</span><strong className="exec-dash__kpi-value">{formatMoneyGhs(totals.difference)}</strong></div>
            </div>
          </div>
        )}

        <div className="exec-dash__panel exec-dash__panel--standalone">
          <div className="exec-dash__panel-title">Accounting tasks</div>
          {tasksError ? (
            <PendingBackendNotice
              title="Task list unavailable"
              description={`dashboard_accountant_tasks RPC not available: ${tasksError}`}
              inline
            />
          ) : tasks.length === 0 ? (
            <p className="exec-dash__state-message">No active tasks returned from the accountant dashboard task endpoint.</p>
          ) : (
            <ul className="exec-dash__task-list">
              {tasks.map((task) => (
                <li key={task.id ?? `${task.title}-${task.due_date}`} className="exec-dash__task-item">
                  <strong>{task.title ?? 'Untitled task'}</strong>
                  <small>{task.status ?? 'Pending'} · due {task.due_date ?? 'TBD'}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </article>
  )
}
