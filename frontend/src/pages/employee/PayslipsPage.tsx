import { useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { useAuth } from '../../context/AuthContext'
import { companyProfile } from '../../config/companyProfile'
import { formatMoneyGhs } from '../../lib/formatMoney'
import { deriveStatusBadgeFromState, StatusBadge } from '../../components/StatusBadge'
import { fetchMyPayslips, fetchMyProfile, fetchMyEmployeeRecord, type MyEmployeeRecord, type PayslipRecord } from '../../lib/rpc/accountant'
import '../../styles/executive-dashboard.css'
import '../../styles/payslip.css'

function formatPayslipPeriod(period?: string | null) {
  if (!period) return '—'
  const [year, month] = (period ?? '').split('-')
  if (!year || !month) return period
  const parsedMonth = Number(month)
  if (Number.isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) return period
  return new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(Number(year), parsedMonth - 1, 1)).toUpperCase() + `, ${year}`
}

function formatPercent(amount: number, total: number): string {
  if (!total || total === 0) return ''
  const rate = (amount / total) * 100
  if (!Number.isFinite(rate) || rate <= 0) return ''
  return `${rate.toFixed(1)}%`
}

export function PayslipsPage() {
  const { appUser } = useAuth()
  const [payslips, setPayslips] = useState<PayslipRecord[]>([])
  const [employee, setEmployee] = useState<MyEmployeeRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [printTarget, setPrintTarget] = useState<PayslipRecord | null>(null)

  useEffect(() => {
    void loadPayslips()
  }, [])

  useEffect(() => {
    if (!appUser?.email) {
      setEmployee(null)
      return
    }

    void loadEmployee()
  }, [appUser?.email])

  useEffect(() => {
    function handleAfterPrint() {
      setPrintTarget(null)
    }

    window.addEventListener('afterprint', handleAfterPrint)
    return () => window.removeEventListener('afterprint', handleAfterPrint)
  }, [])

  function handlePrint(payslip: PayslipRecord) {
    flushSync(() => {
      setPrintTarget(payslip)
    })
    window.print()
  }

  async function loadPayslips() {
    setLoading(true)
    setError(null)

    const result = await fetchMyPayslips(1, 100)

    if (!result.ok) {
      setError(result.error)
      setPayslips([])
    } else {
      setPayslips(result.data ?? [])
    }

    setLoading(false)
  }

  async function loadEmployee() {
    const profileResult = await fetchMyProfile(appUser?.email)
    if (profileResult.ok) {
      setEmployee(profileResult.data)
      return
    }

    setEmployee(null)
  }

  const employeeName = employee?.full_name ?? employee?.email ?? 'Employee'
  const employeeDesignation = employee?.role ?? 'Employee'

  const printRow = useMemo(() => {
    if (!printTarget) return null
    const ssnitAmount = Number(printTarget.ssnit_employee ?? 0)
    const grossSalary = Number(printTarget.gross_salary ?? 0)
    const ssnitRate = formatPercent(ssnitAmount, grossSalary)
    const totalDeductions = ssnitAmount + Number(printTarget.paye ?? 0) + Number(printTarget.other_deductions ?? 0)

    return (
      <div className="payslip-print-sheet">
        <section className="payslip-letterhead">
          <div className="payslip-letterhead__brand">
            {companyProfile.logoUrl ? (
              <img src={companyProfile.logoUrl} alt="Company logo" className="payslip-letterhead__logo" />
            ) : (
              <div className="payslip-letterhead__logo-placeholder">Logo</div>
            )}
            <div>
              <div className="payslip-letterhead__company">{companyProfile.name}</div>
              <div className="payslip-letterhead__address">{companyProfile.address}</div>
              <div className="payslip-letterhead__address">{companyProfile.poBox}</div>
              <div className="payslip-letterhead__address">{companyProfile.email}</div>
            </div>
          </div>
        </section>

        <div className="payslip-title-row">
          <div>
            <div className="payslip-title">Payslip</div>
            <div className="payslip-subtitle">Payroll summary for your current pay period.</div>
          </div>
          <div className="payslip-period-card">
            <span>PAY PERIOD</span>
            <strong>{formatPayslipPeriod(printTarget.period)}</strong>
          </div>
        </div>

        <div className="payslip-summary-grid">
          <div className="payslip-summary-card">
            <span>Employee</span>
            <strong>{employeeName}</strong>
            <span>{employeeDesignation}</span>
          </div>
          <div className="payslip-summary-card">
            <span>Gross salary</span>
            <strong>{formatMoneyGhs(grossSalary)}</strong>
            <span>Net salary</span>
            <strong>{formatMoneyGhs(Number(printTarget.net_salary ?? 0) || 0)}</strong>
          </div>
        </div>

        <div className="payslip-columns">
          <div className="payslip-box">
            <div className="payslip-box-title">Earnings</div>
            <table className="payslip-amounts">
              <tbody>
                <tr>
                  <th>Gross salary</th>
                  <td className="payslip-amount">{formatMoneyGhs(grossSalary)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="payslip-box">
            <div className="payslip-box-title">Deductions</div>
            <table className="payslip-amounts">
              <tbody>
                <tr>
                  <th>P.A.Y.E</th>
                  <td className="payslip-amount">{formatMoneyGhs(Number(printTarget.paye ?? 0) || 0)}</td>
                </tr>
                <tr>
                  <th>TIER 1 + 2 (SSNIT){ssnitRate ? ` — ${ssnitRate}` : ''}</th>
                  <td className="payslip-amount">{formatMoneyGhs(ssnitAmount)}</td>
                </tr>
                <tr>
                  <th>Other deductions</th>
                  <td className="payslip-amount">{formatMoneyGhs(Number(printTarget.other_deductions ?? 0) || 0)}</td>
                </tr>
                <tr className="payslip-summary-row">
                  <th>Total deductions</th>
                  <td className="payslip-amount">{formatMoneyGhs(totalDeductions)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="payslip-net-box">
          <div>
            <div className="payslip-net-label">Net pay</div>
            <div className="payslip-net-value">{formatMoneyGhs(Number(printTarget.net_salary ?? 0) || 0)}</div>
          </div>
        </div>

        <div className="payslip-box payslip-employer-box">
          <div className="payslip-box-title">Employer contributions</div>
          <table className="payslip-amounts">
            <tbody>
              <tr>
                <th>TIER 1 (SSNIT)</th>
                <td className="payslip-amount">{formatMoneyGhs(Number(printTarget.ssnit_employer ?? 0) || 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }, [printTarget, employeeName, employeeDesignation])

  return (
    <article className="admin-dashboard payslips-page">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Employee Self-Service</p>
          <h1>Payslips</h1>
          <p>View payslips issued to your employee account.</p>
        </div>
        <div>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => void loadPayslips()}
            disabled={loading}
          >
            Refresh
          </button>
        </div>
      </header>

      <section className="users-card">
        {loading ? (
          <div className="exec-dash__state-card">
            <h2 className="exec-dash__state-title">Loading payslips</h2>
            <p className="exec-dash__state-message">Fetching your payslip history from the payroll service.</p>
          </div>
        ) : error ? (
          <div className="exec-dash__state-card exec-dash__state-card--error">
            <h2 className="exec-dash__state-title">Unable to load payslips</h2>
            <p className="exec-dash__state-message">{error}</p>
            <p className="exec-dash__state-hint">If this persists, refresh or contact your payroll administrator.</p>
          </div>
        ) : payslips.length === 0 ? (
          <div className="exec-dash__state-card exec-dash__state-card--empty">
            <h2 className="exec-dash__state-title">No payslips available</h2>
            <p className="exec-dash__state-message">No payslips have been issued to your employee account yet.</p>
          </div>
        ) : (
          <div>
            <div className="data-table__actions" style={{ marginBottom: '1rem' }}>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => void loadPayslips()}
                disabled={loading}
              >
                Refresh payslips
              </button>
            </div>
            <div className="table-responsive">
              <table className="data-table payslips-table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Status</th>
                    <th>Gross salary</th>
                    <th>PAYE</th>
                    <th>SSNIT (empl.)</th>
                    <th>SSNIT (emplr.)</th>
                    <th>Other deductions</th>
                    <th>Net salary</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payslips.map((payslip) => {
                    const statusBadge = deriveStatusBadgeFromState(payslip.status ?? 'Unknown')
                    return (
                      <tr key={payslip.payslip_id ?? payslip.id ?? `${payslip.period}-${payslip.run_id}`}>
                        <td>{payslip.period ?? '—'}</td>
                        <td className="data-table__cell--status">
                          <StatusBadge label={statusBadge.label} tone={statusBadge.tone} />
                        </td>
                        <td className="data-table__num">{formatMoneyGhs(Number(payslip.gross_salary ?? 0) || 0)}</td>
                        <td className="data-table__num">{formatMoneyGhs(Number(payslip.paye ?? 0) || 0)}</td>
                        <td className="data-table__num">{formatMoneyGhs(Number(payslip.ssnit_employee ?? 0) || 0)}</td>
                        <td className="data-table__num">{formatMoneyGhs(Number(payslip.ssnit_employer ?? 0) || 0)}</td>
                        <td className="data-table__num">{formatMoneyGhs(Number(payslip.other_deductions ?? 0) || 0)}</td>
                        <td className="data-table__num">{formatMoneyGhs(Number(payslip.net_salary ?? 0) || 0)}</td>
                        <td>
                          <button
                            type="button"
                            className="button button--secondary"
                            onClick={() => handlePrint(payslip)}
                            disabled={!employee}
                          >
                            Print
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {!employee && !loading && payslips.length > 0 && (
          <div className="exec-dash__state-card exec-dash__state-card--warning" style={{ marginTop: '1rem' }}>
            <h2 className="exec-dash__state-title">Employee profile unavailable</h2>
            <p className="exec-dash__state-message">A print-ready payslip requires your employee record. Contact your administrator if this persists.</p>
          </div>
        )}
      </section>

      <div className="payslip-print-container" aria-hidden="true">
        {printRow}
      </div>
    </article>
  )
}
