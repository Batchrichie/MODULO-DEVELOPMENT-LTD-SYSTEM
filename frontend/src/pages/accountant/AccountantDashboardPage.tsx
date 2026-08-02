import { useEffect, useMemo, useState } from 'react'
import { formatMoneyGhs } from '../../lib/formatMoney'
import { FormErrorBanner } from '../../components/FormErrorBanner'
import { PendingBackendNotice } from '../../components/PendingBackendNotice'
import {
  fetchDashboardAccountantTasks,
  fetchTrialBalance,
  getRecords,
  reportAgeing,
  reportIncomeStatement,
  reportSofp,
  type DashboardTask,
} from '../../lib/rpc/accountant'
import '../../styles/executive-dashboard.css'

const DONUT_COLORS = ['#0d9488', '#7c3aed', '#f59e0b', '#2563eb', '#d946ef', '#14b8a6', '#f97316', '#38bdf8']

function formatPercent(value: number, total: number): string {
  if (!total || Number.isNaN(total)) return '0%'
  return `${((value / total) * 100).toFixed(0)}%`
}

function getAccountType(row: Record<string, unknown>): string {
  return String(row.type ?? row.account_type ?? row.accountType ?? row.reporting_group ?? 'Other')
}

function DonutChart({ data }: { data: Array<{ label: string; value: number }> }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  if (!total) {
    return <div>No chart data available</div>
  }

  const stops = data
    .map((item, index) => `${DONUT_COLORS[index % DONUT_COLORS.length]} ${((item.value / total) * 100).toFixed(2)}%`)
    .join(', ')

  const style: Record<string, string | number> = {
    width: '11rem',
    height: '11rem',
    borderRadius: '50%',
    background: `conic-gradient(${stops})`,
    display: 'grid',
    placeItems: 'center',
    boxShadow: '0 18px 40px rgba(15, 23, 42, 0.08)',
    minWidth: '11rem',
  }

  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={style} aria-label="Donut chart" role="img">
        <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{formatPercent(total, total)}</span>
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, minWidth: '12rem' }}>
        {data.map((item, index) => (
          <li key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ width: '0.75rem', height: '0.75rem', borderRadius: '50%', background: DONUT_COLORS[index % DONUT_COLORS.length], display: 'inline-block' }} />
            <span>{item.label}</span>
            <strong>{formatPercent(item.value, total)}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

function BarMeter({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
        <span>{label}</span>
        <span>{formatMoneyGhs(value)}</span>
      </div>
      <div style={{ width: '100%', height: '0.75rem', background: '#e5e7eb', borderRadius: '999px' }}>
        <div style={{ width: `${width}%`, height: '100%', background: '#0d9488', borderRadius: '999px' }} />
      </div>
    </div>
  )
}

export function AccountantDashboardPage() {
  const [accountsCount, setAccountsCount] = useState<number | null>(null)
  const [journalsCount, setJournalsCount] = useState<number | null>(null)
  const [activeProjectsCount, setActiveProjectsCount] = useState<number | null>(null)
  const [activeEmployeesCount, setActiveEmployeesCount] = useState<number | null>(null)
  const [trialBalanceRows, setTrialBalanceRows] = useState<Array<Record<string, unknown>>>([])
  const [chartOfAccounts, setChartOfAccounts] = useState<Array<Record<string, unknown>>>([])
  const [incomeStatement, setIncomeStatement] = useState<Record<string, unknown> | null>(null)
  const [sofpReport, setSofpReport] = useState<Record<string, unknown> | null>(null)
  const [ageingRows, setAgeingRows] = useState<Array<Record<string, unknown>>>([])
  const [projects, setProjects] = useState<Array<Record<string, unknown>>>([])
  const [expenses, setExpenses] = useState<Array<Record<string, unknown>>>([])
  const [journals, setJournals] = useState<Array<Record<string, unknown>>>([])
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
    const fromDate = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const toDate = today

    const [accountsResult, journalsResult, projectsResult, employeesResult, expensesResult, trialBalanceResult, incomeResult, sofpResult, ageingResult, tasksResult] =
      await Promise.all([
        getRecords('accounts', 1, 500),
        getRecords('journals', 1, 500),
        getRecords('projects', 1, 200),
        getRecords('employees', 1, 200),
        getRecords('expenses', 1, 500),
        fetchTrialBalance(today),
        reportIncomeStatement(fromDate, toDate),
        reportSofp(today),
        reportAgeing('customer', 1, 100),
        fetchDashboardAccountantTasks(),
      ])

    if (accountsResult.ok) {
      setAccountsCount(Array.isArray(accountsResult.data) ? accountsResult.data.length : 0)
      setChartOfAccounts(Array.isArray(accountsResult.data) ? accountsResult.data : [])
    } else {
      setAccountsCount(null)
      setChartOfAccounts([])
      setError((current) => (current ? `${current}; ${accountsResult.error}` : accountsResult.error))
    }

    if (journalsResult.ok) {
      setJournalsCount(Array.isArray(journalsResult.data) ? journalsResult.data.length : 0)
      setJournals(Array.isArray(journalsResult.data) ? journalsResult.data : [])
    } else {
      setJournalsCount(null)
      setJournals([])
      setError((current) => (current ? `${current}; ${journalsResult.error}` : journalsResult.error))
    }

    if (projectsResult.ok) {
      const projectRows = Array.isArray(projectsResult.data) ? projectsResult.data : []
      setActiveProjectsCount(projectRows.filter((project) => String(project.status ?? '').toLowerCase() === 'active').length)
      setProjects(projectRows)
    } else {
      setActiveProjectsCount(null)
      setProjects([])
      setError((current) => (current ? `${current}; ${projectsResult.error}` : projectsResult.error))
    }

    if (employeesResult.ok) {
      const employeeRows = Array.isArray(employeesResult.data) ? employeesResult.data : []
      setActiveEmployeesCount(employeeRows.filter((employee) => String(employee.employment_status ?? '').toLowerCase() === 'active').length)
    } else {
      setActiveEmployeesCount(null)
      setError((current) => (current ? `${current}; ${employeesResult.error}` : employeesResult.error))
    }

    if (expensesResult.ok) {
      setExpenses(Array.isArray(expensesResult.data) ? expensesResult.data : [])
    } else {
      setExpenses([])
      setError((current) => (current ? `${current}; ${expensesResult.error}` : expensesResult.error))
    }

    if (trialBalanceResult.ok) {
      setTrialBalanceRows(trialBalanceResult.data)
    } else {
      setTrialBalanceRows([])
      setError((current) => (current ? `${current}; ${trialBalanceResult.error}` : trialBalanceResult.error))
    }

    if (incomeResult.ok) {
      setIncomeStatement(incomeResult.data ?? null)
    } else {
      setIncomeStatement(null)
      setError((current) => (current ? `${current}; ${incomeResult.error}` : incomeResult.error))
    }

    if (sofpResult.ok) {
      setSofpReport(sofpResult.data ?? null)
    } else {
      setSofpReport(null)
      setError((current) => (current ? `${current}; ${sofpResult.error}` : sofpResult.error))
    }

    if (ageingResult.ok) {
      setAgeingRows(Array.isArray(ageingResult.data) ? ageingResult.data : [])
    } else {
      setAgeingRows([])
      setError((current) => (current ? `${current}; ${ageingResult.error}` : ageingResult.error))
    }

    if (tasksResult.ok) {
      setTasks(Array.isArray(tasksResult.data) ? tasksResult.data : [])
    } else {
      setTasks([])
      setTasksError(tasksResult.error)
    }

    setLoading(false)
  }

  const trialTotals = useMemo(() => {
    const debit = trialBalanceRows.reduce((sum, row) => sum + (Number(row.debit ?? 0) || 0), 0)
    const credit = trialBalanceRows.reduce((sum, row) => sum + (Number(row.credit ?? 0) || 0), 0)
    return { debit, credit, difference: debit - credit }
  }, [trialBalanceRows])

  const accountTypeBreakdown = useMemo(() => {
    const groups: Record<string, number> = {}
    trialBalanceRows.forEach((row) => {
      const type = getAccountType(row)
      const balance = Math.abs(Number(row.balance ?? row.debit ?? row.credit ?? 0) || 0)
      groups[type] = (groups[type] ?? 0) + balance
    })
    return Object.entries(groups)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
  }, [trialBalanceRows])

  const incomeRevenueDetail = useMemo(() => {
    const detail = Array.isArray(incomeStatement?.revenue_detail) ? incomeStatement?.revenue_detail : []
    return detail as Array<Record<string, unknown>>
  }, [incomeStatement])

  const expenseBreakdown = useMemo(() => {
    return [
      { label: 'Cost of sales', value: Number(incomeStatement?.cost_of_sales ?? 0) || 0 },
      { label: 'Admin expenses', value: Number(incomeStatement?.admin_expenses ?? 0) || 0 },
      { label: 'Other expenses', value: Number(incomeStatement?.other_expenses ?? 0) || 0 },
      { label: 'Finance costs', value: Number(incomeStatement?.finance_costs ?? 0) || 0 },
      { label: 'Tax expense', value: Number(incomeStatement?.tax_expense ?? 0) || 0 },
    ]
  }, [incomeStatement])

  const taxLiabilitiesSummary = useMemo(() => {
    const taxAccounts = chartOfAccounts.filter(
      (account) =>
        String(account.reporting_group ?? '').toLowerCase() === 'tax liabilities' ||
        (String(account.type ?? '').toLowerCase() === 'liability' && String(account.reporting_group ?? '').toLowerCase().includes('tax')),
    )

    return taxAccounts
      .map((account) => {
        const code = String(account.code ?? account.account_code ?? '')
        const name = String(account.name ?? account.account_name ?? 'Unknown')
        const balanceRow = trialBalanceRows.find(
          (row) =>
            String(row.account_code ?? row.code ?? '').trim() === code.trim() ||
            String(row.account_name ?? row.name ?? '').trim() === name.trim(),
        )
        const balance = Number(balanceRow?.balance ?? balanceRow?.credit ?? balanceRow?.debit ?? 0) || 0
        return { code, name, balance }
      })
      .sort((a, b) => a.code.localeCompare(b.code))
  }, [chartOfAccounts, trialBalanceRows])

  const projectBudgetVsActual = useMemo(() => {
    const budgetKeys = ['labour', 'materials', 'fuel', 'transport', 'subcontractors', 'miscellaneous']

    return projects
      .map((project) => {
        const budget = (project.budget ?? {}) as Record<string, unknown>
        const budgetTotal = budgetKeys.reduce((sum, key) => sum + (Number(budget[key] ?? 0) || 0), 0)
        const actualTotal = expenses
          .filter((expense) => String(expense.project_id ?? expense.projectId ?? '') === String(project.project_id ?? project.id ?? ''))
          .reduce((sum, expense) => sum + (Number(expense.amount ?? 0) || 0), 0)
        return {
          id: String(project.project_id ?? project.id ?? ''),
          name: String(project.name ?? project.project_name ?? 'Unnamed'),
          budgetTotal,
          actualTotal,
        }
      })
      .sort((a, b) => b.budgetTotal - a.budgetTotal)
      .slice(0, 6)
  }, [projects, expenses])

  const recentJournals = useMemo(() => {
    return [...journals]
      .sort((a, b) => {
        const dateA = new Date(String(a.txn_date ?? a.created_at ?? '')).getTime()
        const dateB = new Date(String(b.txn_date ?? b.created_at ?? '')).getTime()
        return dateB - dateA
      })
      .slice(0, 8)
  }, [journals])

  const ageingColumns = useMemo(() => {
    const columns = new Set<string>()
    ageingRows.forEach((row) => Object.keys(row).forEach((key) => columns.add(key)))
    return Array.from(columns)
  }, [ageingRows])

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
          {['Accounts', 'Journal Entries', 'Active Projects', 'Active Employees'].map((label) => (
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
              <h2>Dashboard snapshot</h2>
              <p>Loading the latest live accounting reports.</p>
            </div>
          </div>
          <div className="exec-dash__state-card"><h2 className="exec-dash__state-title">Loading dashboard</h2><p className="exec-dash__state-message">Fetching live financial and operational data.</p></div>
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
          <div className="stat-card__content"><span>Active Projects</span><strong>{activeProjectsCount !== null ? activeProjectsCount : '—'}</strong><small>Live view</small></div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--purple"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v10H4zM8 11h8" /></svg></div>
          <div className="stat-card__content"><span>Active Employees</span><strong>{activeEmployeesCount !== null ? activeEmployeesCount : '—'}</strong><small>Live view</small></div>
        </div>
      </section>

      <section className="users-card">
        <div className="users-card__header">
          <div>
            <h2>Dashboard snapshot</h2>
            <p>All panels are derived from live RPC responses only. No mock dashboard values are shown.</p>
            <p className="exec-dash__note">Trial balance difference: {formatMoneyGhs(trialTotals.difference)}</p>
          </div>
          <div className="users-card__actions"><button type="button" className="button button--secondary" onClick={() => void loadDashboard()}>Refresh</button></div>
        </div>

        <div className="exec-dash__row">
          <div className="exec-dash__panel">
            <div className="exec-dash__panel-title">Account type breakdown</div>
            <DonutChart data={accountTypeBreakdown.slice(0, 6)} />
          </div>

          <div className="exec-dash__panel">
            <div className="exec-dash__panel-title">Revenue breakdown</div>
            {incomeRevenueDetail.length === 0 ? (
              <p className="exec-dash__state-message">No revenue detail returned for the selected period.</p>
            ) : (
              <ul className="exec-dash__tax-list">
                {incomeRevenueDetail.map((item, index) => (
                  <li key={index} className="exec-dash__tax-item">
                    <span>{String(item.description ?? item.label ?? item.name ?? item.account ?? `Item ${index + 1}`)}</span>
                    <strong>{formatMoneyGhs(Number(item.amount ?? item.value ?? 0) || 0)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="exec-dash__row">
          <div className="exec-dash__panel">
            <div className="exec-dash__panel-title">Expense analysis</div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <DonutChart data={expenseBreakdown.filter((item) => item.value !== 0)} />
            </div>
          </div>

          <div className="exec-dash__panel">
            <div className="exec-dash__panel-title">Accounts receivable ageing</div>
            {ageingRows.length === 0 ? (
              <p className="exec-dash__state-message">No customer ageing rows were returned.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      {ageingColumns.map((column) => (
                        <th key={column}>{column.replace(/_/g, ' ')}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ageingRows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {ageingColumns.map((column) => (
                          <td key={column} className={typeof row[column] === 'number' ? 'data-table__num' : undefined}>
                            {typeof row[column] === 'number' ? formatMoneyGhs(row[column] as number) : String(row[column] ?? '—')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="exec-dash__row">
          <div className="exec-dash__panel">
            <div className="exec-dash__panel-title">Tax liabilities summary</div>
            {taxLiabilitiesSummary.length === 0 ? (
              <p className="exec-dash__state-message">No tax liabilities could be resolved from chart of accounts and trial balance.</p>
            ) : (
              <ul className="exec-dash__tax-list">
                {taxLiabilitiesSummary.map((tax) => (
                  <li key={tax.code} className="exec-dash__tax-item">
                    <div>
                      <span className="exec-dash__tax-type">{tax.code}</span>
                      <div>{tax.name}</div>
                    </div>
                    <strong>{formatMoneyGhs(tax.balance)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="exec-dash__panel">
            <div className="exec-dash__panel-title">Budget vs actual (projects)</div>
            {projectBudgetVsActual.length === 0 ? (
              <p className="exec-dash__state-message">No project budgets or expense records were available.</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {projectBudgetVsActual.map((proj) => (
                  <div key={proj.id} style={{ border: '1px solid var(--color-border)', borderRadius: '0.75rem', padding: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontWeight: 700 }}>
                      <span>{proj.name}</span>
                      <span>{formatMoneyGhs(proj.budgetTotal)}</span>
                    </div>
                    <BarMeter label="Actual expenses" value={proj.actualTotal} max={Math.max(proj.budgetTotal, proj.actualTotal, 1)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="exec-dash__row">
          <div className="exec-dash__panel">
            <div className="exec-dash__panel-title">Balance sheet summary</div>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <BarMeter label="Total Assets" value={Number(sofpReport?.total_assets ?? 0) || 0} max={Math.max(Number(sofpReport?.total_assets ?? 0) || 0, Number(sofpReport?.total_liabilities ?? 0) || 0, Number(sofpReport?.net_assets ?? 0) || 0, 1)} />
              <BarMeter label="Total Liabilities" value={Number(sofpReport?.total_liabilities ?? 0) || 0} max={Math.max(Number(sofpReport?.total_assets ?? 0) || 0, Number(sofpReport?.total_liabilities ?? 0) || 0, Number(sofpReport?.net_assets ?? 0) || 0, 1)} />
              <BarMeter label="Equity / Net assets" value={Number(sofpReport?.net_assets ?? 0) || 0} max={Math.max(Number(sofpReport?.total_assets ?? 0) || 0, Number(sofpReport?.total_liabilities ?? 0) || 0, Number(sofpReport?.net_assets ?? 0) || 0, 1)} />
            </div>
            <p className="exec-dash__note">This simplified 3-bar summary replaces the mockup's five-bar balance sheet; current/non-current split is blocked on Decision #13.</p>
          </div>

          <div className="exec-dash__panel">
            <div className="exec-dash__panel-title">Recent journal activity</div>
            {recentJournals.length === 0 ? (
              <p className="exec-dash__state-message">No recent journals available.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Reference</th>
                      <th>Type</th>
                      <th className="data-table__num">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentJournals.map((journal, index) => (
                      <tr key={String(journal.journal_id ?? journal.id ?? index)}>
                        <td>{String(journal.txn_date ?? journal.created_at ?? '—')}</td>
                        <td>{String(journal.reference ?? journal.source_type ?? '—')}</td>
                        <td>{String(journal.source_type ?? journal.status ?? '—')}</td>
                        <td className="data-table__num">{formatMoneyGhs(Number(journal.amount ?? journal.total_amount ?? 0) || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="exec-dash__row">
          <div className="exec-dash__panel">
            <div className="exec-dash__panel-title">Open accountant tasks</div>
            {tasksError ? (
              <PendingBackendNotice
                title="Task list unavailable"
                description={`dashboard_accountant_tasks RPC not available: ${tasksError}`}
                inline
              />
            ) : tasks.length === 0 ? (
              <p className="exec-dash__state-message">No active accountant tasks returned.</p>
            ) : (
              <ul className="exec-dash__task-list">
                {tasks.map((task) => (
                  <li key={String(task.id ?? task.title ?? task.due_date ?? Math.random())} className="exec-dash__task-item">
                    <strong>{task.title ?? 'Untitled task'}</strong>
                    <small>{task.status ?? 'Pending'} · due {task.due_date ?? 'TBD'}</small>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </article>
  )
}
