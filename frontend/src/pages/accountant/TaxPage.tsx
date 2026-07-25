import { useEffect, useState } from 'react'
import { fetchTaxRates, taxRatesUpdate, reportTax } from '../../lib/rpc/accountant'
import { Modal } from '../../components/Modal'
import { FormErrorBanner } from '../../components/FormErrorBanner'
import '../../styles/executive-dashboard.css'

interface TaxRateDisplay {
  tax_type?: string | null
  rate?: number | null
}

interface TaxAccountRecord {
  code: string
  name: string
  opening_balance: number
  accrued_this_period: number
  paid_this_period: number
  input_tax_accrued: number | null
}

interface TaxScheduleReport {
  type?: string
  period?: string
  closing_balance?: number
  note?: string
  accounts: TaxAccountRecord[]
}

type ValidTaxType = 'vat' | 'nhil' | 'getfund' | 'paye' | 'ssnit'

const VALID_TAX_TYPES: ValidTaxType[] = ['vat', 'nhil', 'getfund', 'paye', 'ssnit']

export function TaxPage() {
  const [taxRates, setTaxRates] = useState<TaxRateDisplay[]>([])
  const [scheduleReport, setScheduleReport] = useState<TaxScheduleReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  // #region debug-point A:setShowUpdateModal-traces
  const [showUpdateModal, _setShowUpdateModal] = useState(false)
  const setShowUpdateModal = (next: boolean) => {
    ;(window as any).__tax_showUpdate = next
    const stackLines = new Error('stack').stack?.split('\n').slice(2, 6).join(' ← ') ?? '(no stack)'
    console.warn(`[TAX-MODAL] setShowUpdateModal(${next}) — current was ${showUpdateModal} | call chain: ${stackLines}`)
    return _setShowUpdateModal(next)
  }
  // #endregion
  const [selectedTaxType, setSelectedTaxType] = useState<string>('')
  const [selectedRate, setSelectedRate] = useState<string>('')
  const [reportPeriod, setReportPeriod] = useState(new Date().toISOString().slice(0, 7))
  const [scheduleType, setScheduleType] = useState<ValidTaxType>('vat')

  useEffect(() => {
    void loadAllData()
  }, [])

  async function loadAllData() {
    setLoading(true)
    setError(null)
    setFormError(null)

    const ratesResult = await fetchTaxRates()
    if (ratesResult.ok) {
      setTaxRates(ratesResult.data)
    } else {
      setError(ratesResult.error)
      setTaxRates([])
    }

    const schedulesResult = await reportTax(scheduleType, reportPeriod)
    if (schedulesResult.ok) {
      setScheduleReport(schedulesResult.data)
    } else {
      setScheduleReport(null)
    }

    setLoading(false)
  }

  async function handleUpdateRate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setFormError(null)
    setStatusMessage(null)

    if (!selectedTaxType) {
      setFormError('Select a tax type.')
      setSubmitting(false)
      return
    }

    if (!selectedRate || isNaN(Number(selectedRate))) {
      setFormError('Enter a valid rate percentage (0-100).')
      setSubmitting(false)
      return
    }

    const rateValue = Number(selectedRate)
    if (rateValue < 0 || rateValue > 100) {
      setFormError('Rate must be between 0 and 100.')
      setSubmitting(false)
      return
    }

    const result = await taxRatesUpdate(selectedTaxType, rateValue)
    if (result.ok) {
      setStatusMessage(`Tax rate for ${selectedTaxType} updated to ${rateValue}%.`)
      setShowUpdateModal(false)
      setSelectedTaxType('')
      setSelectedRate('')
      await loadAllData()
    } else {
      setFormError(result.error)
    }

    setSubmitting(false)
  }

  async function loadScheduleForPeriod() {
    const schedulesResult = await reportTax(scheduleType, reportPeriod)
    if (schedulesResult.ok) {
      setScheduleReport(schedulesResult.data)
      setStatusMessage(`Tax schedule loaded for ${scheduleType.toUpperCase()} / ${reportPeriod}.`)
    } else {
      setError(schedulesResult.error)
      setScheduleReport(null)
    }
  }

  const uniqueTaxTypes = Array.from(new Set(taxRates.map((r) => r.tax_type).filter(Boolean))) as string[]

  if (loading) {
    return (
      <article className="admin-dashboard">
        <header className="admin-dashboard__header">
          <div>
            <p className="admin-dashboard__eyebrow">Compliance & Tax</p>
            <h1>Tax Configuration</h1>
            <p>Manage tax rates and review tax compliance schedules.</p>
          </div>
        </header>
        <section className="users-card"><div className="exec-dash__state-card"><h2 className="exec-dash__state-title">Loading tax data</h2><p className="exec-dash__state-message">Fetching current tax rates and schedule information.</p></div></section>
      </article>
    )
  }

  if (error && !statusMessage) {
    return (
      <article className="admin-dashboard">
        <header className="admin-dashboard__header">
          <div>
            <p className="admin-dashboard__eyebrow">Compliance & Tax</p>
            <h1>Tax Configuration</h1>
            <p>Manage tax rates and review tax compliance schedules.</p>
          </div>
        </header>
        <section className="users-card"><div className="exec-dash__state-card exec-dash__state-card--error"><h2 className="exec-dash__state-title">Unable to load tax data</h2><p className="exec-dash__state-message">{error}</p></div></section>
      </article>
    )
  }

  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Compliance & Tax</p>
          <h1>Tax Configuration</h1>
          <p>Manage tax rates and review tax compliance schedules.</p>
        </div>
      </header>

      <section className="users-card">
        <div className="users-card__header">
          <div>
            <h2>Current Tax Rates</h2>
            <p>Review and update the current tax rates applied to transactions.</p>
          </div>
          <div className="users-card__actions">
            <button type="button" className="button button--secondary" onClick={() => void loadAllData()}>Refresh</button>
            <button type="button" className="button button--primary" onClick={() => setShowUpdateModal(true)}>Update Rate</button>
          </div>
        </div>

        {statusMessage && <div className="exec-dash__state-card" style={{ marginBottom: '1rem' }}><h2 className="exec-dash__state-title">Success</h2><p className="exec-dash__state-message">{statusMessage}</p></div>}

        {!taxRates.length ? (
          <div className="exec-dash__state-card exec-dash__state-card--empty">
            <h2 className="exec-dash__state-title">No tax rates found</h2>
            <p className="exec-dash__state-message">Tax rate data is not currently available.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', padding: '0 21px 21px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Tax Type</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>Rate (%)</th>
                </tr>
              </thead>
              <tbody>
                {taxRates.map((rate, index) => (
                  <tr key={`${rate.tax_type}-${index}`}>
                    <td style={{ padding: '0.5rem' }}>{rate.tax_type ?? '—'}</td>
                    <td style={{ textAlign: 'right', padding: '0.5rem' }}>{typeof rate.rate === 'number' ? `${rate.rate}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="users-card" style={{ marginTop: '1.5rem' }}>
        <div className="users-card__header">
          <div>
            <h2>Tax Compliance Schedule</h2>
            <p>Review tax liabilities and payments for the selected period and tax type.</p>
          </div>
          <div className="users-card__actions">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Tax Type:
              <select value={scheduleType} onChange={(event) => setScheduleType(event.target.value as ValidTaxType)} style={{ padding: '0.4rem' }}>
                {VALID_TAX_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Period:
              <input type="month" value={reportPeriod} onChange={(event) => setReportPeriod(event.target.value)} style={{ padding: '0.4rem' }} />
              <button type="button" className="button button--secondary" onClick={() => void loadScheduleForPeriod()}>Load</button>
            </label>
          </div>
        </div>

        {!scheduleReport || !scheduleReport.accounts.length ? (
          <div className="exec-dash__state-card exec-dash__state-card--empty">
            <h2 className="exec-dash__state-title">No schedule data</h2>
            <p className="exec-dash__state-message">No tax schedule records are available for the selected tax type and period.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto', padding: '0 21px 21px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Account Code</th>
                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Account Name</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem' }}>Opening Balance</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem' }}>Accrued This Period</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem' }}>Paid This Period</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem' }}>Input Tax Accrued</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleReport.accounts.map((account, index) => (
                    <tr key={index}>
                      <td style={{ padding: '0.5rem' }}>{account.code}</td>
                      <td style={{ padding: '0.5rem' }}>{account.name}</td>
                      <td style={{ textAlign: 'right', padding: '0.5rem' }}>{account.opening_balance.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '0.5rem' }}>{account.accrued_this_period.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '0.5rem' }}>{account.paid_this_period.toFixed(2)}</td>
                      <td style={{ textAlign: 'right', padding: '0.5rem' }}>{account.input_tax_accrued !== null ? account.input_tax_accrued.toFixed(2) : '—'}</td>
                    </tr>
                  ))}
                  {typeof scheduleReport.closing_balance === 'number' && (
                    <tr style={{ borderTop: '2px solid var(--text-secondary)' }}>
                      <td colSpan={5} style={{ padding: '0.5rem', fontWeight: 'bold', textAlign: 'right' }}>Closing Balance:</td>
                      <td style={{ textAlign: 'right', padding: '0.5rem', fontWeight: 'bold' }}>{scheduleReport.closing_balance.toFixed(2)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {scheduleReport.note && <p style={{ padding: '0 21px 21px', fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: '0.5rem' }}>📋 {scheduleReport.note}</p>}
          </>
        )}
      </section>

      <Modal
        open={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        title="Update Tax Rate"
        maxWidth={460}
        footer={
          <>
            <button type="button" className="button button--secondary" onClick={() => setShowUpdateModal(false)}>Cancel</button>
            <button type="submit" form="tax-update-form" className="button button--primary" disabled={submitting}>{submitting ? 'Updating…' : 'Update Rate'}</button>
          </>
        }
      >
        <form id="tax-update-form" onSubmit={(event) => void handleUpdateRate(event)}>
          <FormErrorBanner message={formError} />
          <label>
            Tax Type
            <select value={selectedTaxType} onChange={(event) => setSelectedTaxType(event.target.value)} required style={{ display: 'block', width: '100%', marginTop: '0.25rem', marginBottom: '0.75rem' }}>
              <option value="">Select tax type</option>
              {uniqueTaxTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label>
            Rate (%)
            <input type="number" value={selectedRate} onChange={(event) => setSelectedRate(event.target.value)} min="0" max="100" step="0.01" required style={{ display: 'block', width: '100%', marginTop: '0.25rem', marginBottom: '0.75rem' }} />
          </label>
        </form>
      </Modal>
    </article>
  )
}

