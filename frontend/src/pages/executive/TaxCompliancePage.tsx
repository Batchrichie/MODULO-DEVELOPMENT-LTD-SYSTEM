import { useEffect, useState } from 'react'
import { formatMoneyGhs } from '../../lib/formatMoney'
import { reportTax } from '../../lib/rpc/accountant'
import { EmptyState } from '../../components/EmptyState'
import { FormErrorBanner } from '../../components/FormErrorBanner'
import '../../styles/executive-dashboard.css'

type TaxStatus = {
  type: string
  opening_balance?: number | null
  accrued_this_period?: number | null
  paid_this_period?: number | null
  closing_balance?: number | null
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty' }
  | { status: 'success'; records: TaxStatus[] }

const TAX_TYPES = [
  { key: 'vat', label: 'VAT' },
  { key: 'nhil', label: 'NHIL' },
  { key: 'getfund', label: 'GETFund' },
  { key: 'paye', label: 'PAYE' },
]

export function TaxCompliancePage() {
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7))
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    let active = true

    async function load() {
      setState({ status: 'loading' })
      const results = await Promise.all(
        TAX_TYPES.map(async (tax) => {
          const result = await reportTax(tax.key, period)
          return { tax, result }
        }),
      )

      if (!active) return

      const firstError = results.find((item): item is { tax: (typeof TAX_TYPES)[number]; result: { ok: false; error: string; code?: string } } => !item.result.ok)
      if (firstError) {
        setState({ status: 'error', message: `${firstError.tax.label} report failed: ${firstError.result.error}` })
        return
      }

      const records: TaxStatus[] = []
      for (const { tax, result } of results) {
        if (!result.ok) continue

        const payload = result.data as Record<string, unknown> | undefined
        records.push({
          type: tax.label,
          opening_balance: typeof payload?.opening_balance === 'number' ? payload.opening_balance : null,
          accrued_this_period: typeof payload?.accrued_this_period === 'number' ? payload.accrued_this_period : null,
          paid_this_period: typeof payload?.paid_this_period === 'number' ? payload.paid_this_period : null,
          closing_balance: typeof payload?.closing_balance === 'number' ? payload.closing_balance : null,
        })
      }

      const isEmpty = records.every((record) => !record.closing_balance && !record.opening_balance && !record.accrued_this_period && !record.paid_this_period)
      if (isEmpty) {
        setState({ status: 'empty' })
        return
      }

      setState({ status: 'success', records })
    }

    void load()
    return () => {
      active = false
    }
  }, [period])

  const highlightOpen = (closingBalance?: number | null) => closingBalance != null && closingBalance > 0

  if (state.status === 'loading') {
    return (
      <article className="exec-dash exec-screen" role="status" aria-live="polite">
        <header className="exec-screen__header">
          <p className="exec-dash__breadcrumb">Executive Dashboard</p>
          <h1>Tax & Compliance</h1>
          <p>Tax obligations and closing balances for CEO review.</p>
        </header>

        <div className="exec-dash__panel exec-dash__panel--standalone">
          <p>Loading tax compliance data…</p>
        </div>
      </article>
    )
  }

  if (state.status === 'error') {
    return (
      <article className="exec-dash exec-screen" role="alert">
        <header className="exec-screen__header">
          <p className="exec-dash__breadcrumb">Executive Dashboard</p>
          <h1>Tax & Compliance</h1>
          <p>Tax obligations and closing balances for CEO review.</p>
        </header>

        <FormErrorBanner message={state.message} label="Unable to load tax compliance" />
      </article>
    )
  }

  if (state.status === 'empty') {
    return (
      <article className="exec-dash exec-screen">
        <header className="exec-screen__header">
          <p className="exec-dash__breadcrumb">Executive Dashboard</p>
          <h1>Tax & Compliance</h1>
          <p>Tax obligations and closing balances for CEO review.</p>
        </header>

        <EmptyState title="No tax liability data" description="No tax balances were returned for the selected period." />
      </article>
    )
  }

  return (
    <article className="exec-dash exec-screen">
      <header className="exec-screen__header">
        <p className="exec-dash__breadcrumb">Executive Dashboard</p>
        <h1>Tax & Compliance</h1>
        <p>Tax obligations and closing balances for CEO review.</p>
      </header>

      <section className="form-fieldset">
        <legend className="form-fieldset__legend">Period selector</legend>
        <div className="form-field">
          <label className="form-field__label" htmlFor="tax-period">Month</label>
          <input
            id="tax-period"
            type="month"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
          />
        </div>
      </section>

      <section className="exec-screen__grid">
        {state.records.map((record) => (
          <article
            key={record.type}
            className={`exec-screen__card ${highlightOpen(record.closing_balance) ? 'exec-screen__card--liability' : ''}`}
          >
            <h2>{record.type}</h2>
            <dl className="exec-screen__definition-list">
              <div>
                <dt>Opening balance</dt>
                <dd>{formatMoneyGhs(record.opening_balance)}</dd>
              </div>
              <div>
                <dt>Accrued this period</dt>
                <dd>{formatMoneyGhs(record.accrued_this_period)}</dd>
              </div>
              <div>
                <dt>Paid this period</dt>
                <dd>{formatMoneyGhs(record.paid_this_period)}</dd>
              </div>
              <div>
                <dt>Closing balance</dt>
                <dd>{formatMoneyGhs(record.closing_balance)}</dd>
              </div>
            </dl>
          </article>
        ))}
      </section>

      <div className="exec-screen__note">
        Tax remittance and payment actions are not available in this release.
      </div>
    </article>
  )
}
