import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../../components/EmptyState'
import { formatMoneyGhs } from '../../lib/formatMoney'
import { FormErrorBanner } from '../../components/FormErrorBanner'
import { PendingBackendNotice } from '../../components/PendingBackendNotice'
import { reportIncomeStatement } from '../../lib/rpc/accountant'
import styles from './IncomeStatementPage.module.css'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty' }
  | { status: 'success'; data: Record<string, unknown>[] }

function normalizeReportIncomeStatement(data: unknown): Record<string, unknown>[] {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return []
  return Object.entries(data as Record<string, unknown>).map(([key, value]) => ({ item: key, amount: value }))
}

function extractColumns(rows: Record<string, unknown>[]) {
  const columns = new Set<string>()
  rows.forEach((row) => Object.keys(row).forEach((key) => columns.add(key)))
  return Array.from(columns)
}

function formatCellValue(value: unknown) {
  if (typeof value === 'number') {
    return formatMoneyGhs(value)
  }
  return String(value ?? '—')
}

export function IncomeStatementPage() {
  const today = new Date()
  const defaultTo = today.toISOString().slice(0, 10)
  const defaultFrom = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const [fromDate, setFromDate] = useState(defaultFrom)
  const [toDate, setToDate] = useState(defaultTo)
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    let active = true

    async function load() {
      setState({ status: 'loading' })
      const result = await reportIncomeStatement(fromDate, toDate)
      if (!active) return

      if (!result.ok) {
        setState({ status: 'error', message: `Income statement failed: ${result.error}` })
        return
      }

      const rows = normalizeReportIncomeStatement(result.data)
      if (!rows.length) {
        setState({ status: 'empty' })
        return
      }

      setState({ status: 'success', data: rows })
    }

    void load()
    return () => {
      active = false
    }
  }, [fromDate, toDate])

  if (state.status === 'loading') {
    return (
      <article className="exec-dash exec-screen" role="status" aria-live="polite">
        <header className="exec-screen__header">
          <p className="exec-dash__breadcrumb">Executive Dashboard</p>
          <h1>Profit & Loss Statement</h1>
          <p>Detailed income and expenditure breakdown</p>
        </header>

        <PendingBackendNotice />
      </article>
    )
  }

  if (state.status === 'error') {
    return (
      <article className="exec-dash exec-screen" role="alert">
        <header className="exec-screen__header">
          <p className="exec-dash__breadcrumb">Executive Dashboard</p>
          <h1>Profit & Loss Statement</h1>
          <p>Detailed income and expenditure breakdown</p>
        </header>

        <FormErrorBanner message={state.message} />
      </article>
    )
  }

  if (state.status === 'empty') {
    return (
      <article className="exec-dash exec-screen">
        <header className="exec-screen__header">
          <p className="exec-dash__breadcrumb">Executive Dashboard</p>
          <h1>Profit & Loss Statement</h1>
          <p>Detailed income and expenditure breakdown</p>
        </header>

        <EmptyState
          title="No data available for this report"
          description="No income statement data was returned for the selected period."
          action={
            <Link to="/executive/reports" className="button button--secondary">
              Back to reports
            </Link>
          }
        />
      </article>
    )
  }

  const columns = extractColumns(state.data)

  return (
    <article className="exec-dash exec-screen">
      <header className="exec-screen__header">
        <p className="exec-dash__breadcrumb">Executive Dashboard</p>
        <h1>Profit & Loss Statement</h1>
        <p>Detailed income and expenditure breakdown</p>
      </header>

      <section className={styles['incomestatement__toolbar']}>
        <div className="form-field">
          <label className="form-field__label" htmlFor="income-from">
            From
          </label>
          <input
            id="income-from"
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="form-field__label" htmlFor="income-to">
            To
          </label>
          <input
            id="income-to"
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
          />
        </div>
      </section>

      <section className={styles['incomestatement__table-wrapper']}>
        <table className={styles['incomestatement__table']}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column.replace(/_/g, ' ')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {columns.map((column) => (
                  <td key={column}>{formatCellValue(row[column])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className={styles['incomestatement__note']}>
        Report values are generated from <code>report_income_statement</code>.
      </p>
    </article>
  )
}
