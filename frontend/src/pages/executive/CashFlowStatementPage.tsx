import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../../components/EmptyState'
import { FormErrorBanner } from '../../components/FormErrorBanner'
import { PendingBackendNotice } from '../../components/PendingBackendNotice'
import { reportCashFlow } from '../../lib/rpc/accountant'
import styles from './CashFlowStatementPage.module.css'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty' }
  | { status: 'success'; data: Record<string, unknown>[] }

function extractColumns(rows: Record<string, unknown>[]) {
  const columns = new Set<string>()
  rows.forEach((row) => Object.keys(row).forEach((key) => columns.add(key)))
  return Array.from(columns)
}

function formatCellValue(value: unknown) {
  if (typeof value === 'number') {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(value)
  }
  return String(value ?? '—')
}

export function CashFlowStatementPage() {
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
      const result = await reportCashFlow(fromDate, toDate)
      if (!active) return

      if (!result.ok) {
        setState({ status: 'error', message: `Cash flow statement failed: ${result.error}` })
        return
      }

      const rows = Array.isArray(result.data) ? result.data : []
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
          <h1>Cash Flow Statement</h1>
          <p>Track operating, investing, and financing cash movements.</p>
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
          <h1>Cash Flow Statement</h1>
          <p>Track operating, investing, and financing cash movements.</p>
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
          <h1>Cash Flow Statement</h1>
          <p>Track operating, investing, and financing cash movements.</p>
        </header>
        <EmptyState
          title="No data available for this report"
          description="No cash flow data was returned for the selected period."
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
        <h1>Cash Flow Statement</h1>
        <p>Track operating, investing, and financing cash movements.</p>
      </header>

      <section className={styles['cashflow__toolbar']}>
        <div className="form-field">
          <label className="form-field__label" htmlFor="cashflow-from">
            From
          </label>
          <input
            id="cashflow-from"
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="form-field__label" htmlFor="cashflow-to">
            To
          </label>
          <input
            id="cashflow-to"
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
          />
        </div>
      </section>

      <section className={styles['cashflow__table-wrapper']}>
        <table className={styles['cashflow__table']}>
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

      <p className={styles['cashflow__note']}>
        Report values are generated from <code>report_cash_flow</code>.
      </p>
    </article>
  )
}
