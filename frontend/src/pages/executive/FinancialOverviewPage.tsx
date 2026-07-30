import { useEffect, useState } from 'react'
import { formatMoneyGhs } from '../../lib/formatMoney'
import { FormErrorBanner } from '../../components/FormErrorBanner'
import {
  reportCashFlow,
  reportIncomeStatement,
  reportSofp,
} from '../../lib/rpc/accountant'
import '../../styles/executive-dashboard.css'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty'; data: FinancialOverviewData }
  | { status: 'success'; data: FinancialOverviewData }

type IncomeStatementReport = {
  revenue?: number | null
  cost_of_sales?: number | null
  gross_profit?: number | null
  operating_profit?: number | null
  profit_before_tax?: number | null
  profit_for_year?: number | null
}

type SofpReport = {
  total_assets?: number | null
  total_liabilities?: number | null
  net_assets?: number | null
}

type CashFlowReport = {
  operating?: number | null
  investing?: number | null
  financing?: number | null
  net_change_in_cash?: number | null
}

type FinancialOverviewData = {
  incomeStatement: IncomeStatementReport
  sofp: SofpReport
  cashFlow: CashFlowReport
}

function isEmptyReport(data: FinancialOverviewData): boolean {
  const allValues = [
    data.incomeStatement.revenue,
    data.incomeStatement.cost_of_sales,
    data.incomeStatement.gross_profit,
    data.incomeStatement.operating_profit,
    data.incomeStatement.profit_before_tax,
    data.incomeStatement.profit_for_year,
    data.sofp.total_assets,
    data.sofp.total_liabilities,
    data.sofp.net_assets,
    data.cashFlow.operating,
    data.cashFlow.investing,
    data.cashFlow.financing,
    data.cashFlow.net_change_in_cash,
  ]

  return allValues.every((value) => !value)
}

function summaryValue(value: number | null | undefined): string {
  return formatMoneyGhs(value ?? undefined)
}

export function FinancialOverviewPage() {
  const today = new Date()
  const defaultTo = today.toISOString().slice(0, 10)
  const defaultFrom = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const defaultAsOf = today.toISOString().slice(0, 10)

  const [fromDate, setFromDate] = useState(defaultFrom)
  const [toDate, setToDate] = useState(defaultTo)
  const [asOfDate, setAsOfDate] = useState(defaultAsOf)
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [openSections, setOpenSections] = useState({ income: true, sofp: false, cash: false })

  useEffect(() => {
    let active = true

    async function load() {
      setState({ status: 'loading' })

      const [incomeResult, sofpResult, cashResult] = await Promise.all([
        reportIncomeStatement(fromDate, toDate),
        reportSofp(asOfDate),
        reportCashFlow(fromDate, toDate),
      ])

      if (!active) return

      if (!incomeResult.ok) {
        setState({ status: 'error', message: `Income statement failed: ${incomeResult.error}` })
        return
      }

      if (!sofpResult.ok) {
        setState({ status: 'error', message: `SOFP failed: ${sofpResult.error}` })
        return
      }

      if (!cashResult.ok) {
        setState({ status: 'error', message: `Cash flow failed: ${cashResult.error}` })
        return
      }

      const data: FinancialOverviewData = {
        incomeStatement: incomeResult.data,
        sofp: sofpResult.data,
        cashFlow: cashResult.data,
      }

      if (isEmptyReport(data)) {
        setState({ status: 'empty', data })
        return
      }

      setState({ status: 'success', data })
    }

    void load()
    return () => {
      active = false
    }
  }, [fromDate, toDate, asOfDate])

  const handleToggle = (section: 'income' | 'sofp' | 'cash') => {
    setOpenSections((current) => ({ ...current, [section]: !current[section] }))
  }

  if (state.status === 'loading') {
    return (
      <article className="exec-dash exec-screen" role="status" aria-live="polite">
        <header className="exec-screen__header">
          <p className="exec-dash__breadcrumb">Executive Dashboard</p>
          <h1>Financial Overview</h1>
          <p>High-level financial summaries for CEO review.</p>
        </header>

        <section className="exec-dash__kpi-grid">
          {['Total Revenue', 'Net Profit', 'Total Assets', 'Cash Position'].map((label) => (
            <div key={label} className="exec-dash__kpi exec-dash__kpi--skeleton">
              <span className="exec-dash__kpi-label">{label}</span>
              <span className="exec-dash__skeleton-bar">​</span>
            </div>
          ))}
        </section>

        <div className="exec-screen__state-card exec-screen__state-card--empty">
          <p>Loading financial reports…</p>
        </div>
      </article>
    )
  }

  if (state.status === 'error') {
    return (
      <article className="exec-dash exec-screen" role="alert">
        <header className="exec-screen__header">
          <p className="exec-dash__breadcrumb">Executive Dashboard</p>
          <h1>Financial Overview</h1>
          <p>High-level financial summaries for CEO review.</p>
        </header>

        <FormErrorBanner message={state.message} label="Unable to load financial overview" />
      </article>
    )
  }

  const data = state.data
  const cashPosition = data.cashFlow.net_change_in_cash ?? data.cashFlow.operating

  return (
    <article className="exec-dash exec-screen">
      <header className="exec-screen__header">
        <p className="exec-dash__breadcrumb">Executive Dashboard</p>
        <h1>Financial Overview</h1>
        <p>High-level financial summaries for CEO review.</p>
      </header>

      <section className="exec-dash__kpi-grid" aria-label="Financial summary cards">
        <div className="exec-dash__kpi">
          <span className="exec-dash__kpi-label">Total Revenue</span>
          <div className="exec-dash__kpi-value">{summaryValue(data.incomeStatement.revenue)}</div>
        </div>
        <div className="exec-dash__kpi">
          <span className="exec-dash__kpi-label">Net Profit</span>
          <div className="exec-dash__kpi-value">{summaryValue(data.incomeStatement.profit_for_year)}</div>
        </div>
        <div className="exec-dash__kpi">
          <span className="exec-dash__kpi-label">Total Assets</span>
          <div className="exec-dash__kpi-value">{summaryValue(data.sofp.total_assets)}</div>
        </div>
        <div className="exec-dash__kpi">
          <span className="exec-dash__kpi-label">Cash Position</span>
          <div className="exec-dash__kpi-value">{summaryValue(cashPosition)}</div>
        </div>
      </section>

      <section className="exec-screen__toolbar">
        <div className="form-field">
          <label className="form-field__label" htmlFor="financial-from">Income statement & cash flow from</label>
          <input
            id="financial-from"
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="form-field__label" htmlFor="financial-to">to</label>
          <input
            id="financial-to"
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
          />
        </div>
        <div className="form-field">
          <label className="form-field__label" htmlFor="sofp-as-of">SOFP as of</label>
          <input
            id="sofp-as-of"
            type="date"
            value={asOfDate}
            onChange={(event) => setAsOfDate(event.target.value)}
          />
        </div>
      </section>

      <section className="exec-screen__panel" aria-labelledby="income-statement-title">
        <button
          type="button"
          className="exec-screen__section-toggle"
          aria-expanded={openSections.income}
          onClick={() => handleToggle('income')}
        >
          <h2 id="income-statement-title">Income Statement</h2>
        </button>
        {openSections.income && (
          <div className="exec-screen__section-body">
            <dl className="exec-screen__definition-list">
              <div>
                <dt>Revenue</dt>
                <dd>{summaryValue(data.incomeStatement.revenue)}</dd>
              </div>
              <div>
                <dt>Cost of Sales</dt>
                <dd>{summaryValue(data.incomeStatement.cost_of_sales)}</dd>
              </div>
              <div>
                <dt>Gross Profit</dt>
                <dd>{summaryValue(data.incomeStatement.gross_profit)}</dd>
              </div>
              <div>
                <dt>Operating Profit</dt>
                <dd>{summaryValue(data.incomeStatement.operating_profit)}</dd>
              </div>
              <div>
                <dt>Profit Before Tax</dt>
                <dd>{summaryValue(data.incomeStatement.profit_before_tax)}</dd>
              </div>
              <div>
                <dt>Profit for Year</dt>
                <dd>{summaryValue(data.incomeStatement.profit_for_year)}</dd>
              </div>
            </dl>
            <p className="exec-screen__note">Showing key income statement line items only.</p>
          </div>
        )}
      </section>

      <section className="exec-screen__panel" aria-labelledby="sofp-title">
        <button
          type="button"
          className="exec-screen__section-toggle"
          aria-expanded={openSections.sofp}
          onClick={() => handleToggle('sofp')}
        >
          <h2 id="sofp-title">Statement of Financial Position</h2>
        </button>
        {openSections.sofp && (
          <div className="exec-screen__section-body">
            <dl className="exec-screen__definition-list">
              <div>
                <dt>Total Assets</dt>
                <dd>{summaryValue(data.sofp.total_assets)}</dd>
              </div>
              <div>
                <dt>Total Liabilities</dt>
                <dd>{summaryValue(data.sofp.total_liabilities)}</dd>
              </div>
              <div>
                <dt>Net Assets</dt>
                <dd>{summaryValue(data.sofp.net_assets)}</dd>
              </div>
            </dl>
            <p className="exec-screen__note">Balance sheet summary only; full statement is planned for FE-5.</p>
          </div>
        )}
      </section>

      <section className="exec-screen__panel" aria-labelledby="cash-flow-title">
        <button
          type="button"
          className="exec-screen__section-toggle"
          aria-expanded={openSections.cash}
          onClick={() => handleToggle('cash')}
        >
          <h2 id="cash-flow-title">Cash Flow</h2>
        </button>
        {openSections.cash && (
          <div className="exec-screen__section-body">
            <dl className="exec-screen__definition-list">
              <div>
                <dt>Operating</dt>
                <dd>{summaryValue(data.cashFlow.operating)}</dd>
              </div>
              <div>
                <dt>Investing</dt>
                <dd>{summaryValue(data.cashFlow.investing)}</dd>
              </div>
              <div>
                <dt>Financing</dt>
                <dd>{summaryValue(data.cashFlow.financing)}</dd>
              </div>
              <div>
                <dt>Net Change in Cash</dt>
                <dd>{summaryValue(data.cashFlow.net_change_in_cash)}</dd>
              </div>
            </dl>
            <p className="exec-screen__note">Key cash flow line items only; full cash flow structure is part of FE-5.</p>
          </div>
        )}
      </section>
    </article>
  )
}
