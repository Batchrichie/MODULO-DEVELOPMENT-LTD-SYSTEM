import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../../components/EmptyState'
import { FormErrorBanner } from '../../components/FormErrorBanner'
import { PendingBackendNotice } from '../../components/PendingBackendNotice'
import { reportSofp } from '../../lib/rpc/accountant'
import styles from './StatementOfFinancialPositionPage.module.css'

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
  if (typeof value === 'number') return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(value)
  return String(value ?? '—')
}

export function StatementOfFinancialPositionPage() {
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().slice(0, 10))
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    let active = true

    async function load() {
      setState({ status: 'loading' })
      const result = await reportSofp(asOfDate)
      if (!active) return

      if (!result.ok) {
        setState({ status: 'error', message: `Statement of financial position failed: ${result.error}` })
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
  }, [asOfDate])

  if (state.status === 'loading') {
    return (
      <article className="exec-dash exec-screen" role="status" aria-live="polite">
        <header className="exec-screen__header">
          <p className="exec-dash__breadcrumb">Executive Dashboard</p>
          <h1>Statement of Financial Position</h1>
          <p>Assets, liabilities, and equity at period end</p>
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
          <h1>Statement of Financial Position</h1>
          <p>Assets, liabilities, and equity at period end</p>
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
          <h1>Statement of Financial Position</h1>
          <p>Assets, liabilities, and equity at period end</p>
        </header>
        <EmptyState
          title="No data available for this report"
          description="No balance sheet data was returned for the selected date."
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
        <h1>Statement of Financial Position</h1>
        <p>Assets, liabilities, and equity at period end</p>
      </header>

      <section className={styles['sofp__toolbar']}>
        <div className="form-field">
          <label className="form-field__label" htmlFor="sofp-as-of">
            As of
          </label>
          <input
            id="sofp-as-of"
            type="date"
            value={asOfDate}
            onChange={(event) => setAsOfDate(event.target.value)}
          />
        </div>
      </section>

      <section className={styles['sofp__table-wrapper']}>
        <table className={styles['sofp__table']}>
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

      <p className={styles['sofp__note']}>
        Report values are generated from <code>report_sofp</code>.
      </p>
    </article>
  )
}
