import { useEffect, useMemo, useState } from 'react'
import { formatMoneyGhs } from '../../lib/formatMoney'
import { supabase } from '../../lib/supabase'
import '../../styles/executive-dashboard.css'

interface PayrollRunRecord {
  run_id?: string
  id?: string
  period?: string | null
  status?: string | null
  created_at?: string | null
  payslips?: PayslipRecord[]
}

interface PayslipRecord {
  payslip_id?: string
  id?: string
  run_id?: string | null
  employee_id?: string | null
  gross_salary?: number | null
  paye?: number | null
  ssnit_employee?: number | null
  ssnit_employer?: number | null
  other_deductions?: number | null
  net_salary?: number | null
}

interface EmployeeRecord {
  employee_id?: string
  id?: string
  full_name?: string | null
  employment_status?: string | null
  staff_category?: string | null
}

export function PayrollPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([])
  const [createdRun, setCreatedRun] = useState<PayrollRunRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [runPeriod, setRunPeriod] = useState(new Date().toISOString().slice(0, 7))
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    void loadAllData()
  }, [])

  async function loadAllData() {
    setLoading(true)
    setError(null)
    setStatusMessage(null)

    const employeesResult = await supabase.schema('api').rpc('get_records', {
      p_resource: 'employees',
      p_page: 1,
      p_limit: 200,
    })

    if (employeesResult.error) {
      setError(employeesResult.error.message)
      setEmployees([])
    } else {
      setEmployees(Array.isArray(employeesResult.data) ? employeesResult.data : employeesResult.data?.rows || employeesResult.data?.data || [])
    }

    setLoading(false)
  }

  const selectedRunPayslips = useMemo(() => {
    if (!selectedRunId || !createdRun?.payslips) return []
    return createdRun.payslips.filter((payslip) => (payslip.run_id ?? payslip.id) === selectedRunId)
  }, [createdRun, selectedRunId])

  const blockingEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const status = employee.employment_status?.trim()
      return status === 'Active' && (!employee.staff_category || employee.staff_category.trim() === '')
    })
  }, [employees])

  async function createRun() {
    setSubmitting(true)
    setError(null)
    setStatusMessage(null)

    if (blockingEmployees.length > 0) {
      setError(`Payroll run blocked for named employees: ${blockingEmployees.map((employee) => employee.full_name ?? 'Unknown employee').join(', ')}. Every active employee must have staff_category set.`)
      setSubmitting(false)
      return
    }

    const { data, error } = await supabase.schema('api').rpc('payroll_run_create', {
      period: runPeriod,
    })

    if (error) {
      setError(error.message)
      setSubmitting(false)
      return
    }

    const payload = data as Record<string, unknown>
    const runId = String(payload.run_id ?? payload.id ?? '')
    const payslips = Array.isArray(payload.payslips)
      ? payload.payslips as PayslipRecord[]
      : Array.isArray((payload.data as Record<string, unknown> | undefined)?.payslips)
        ? ((payload.data as Record<string, unknown>).payslips as PayslipRecord[])
        : []

    const nextRun: PayrollRunRecord = {
      run_id: runId,
      id: runId,
      period: String(payload.period ?? runPeriod),
      status: String(payload.status ?? 'created'),
      payslips,
    }

    setCreatedRun(nextRun)
    setSelectedRunId(runId)
    setShowModal(false)
    setStatusMessage(`Run created successfully. Response: ${JSON.stringify(data)}`)
    await loadAllData()
    setSubmitting(false)
  }

  async function approveRun(runId: string) {
    setSubmitting(true)
    setError(null)
    setStatusMessage(null)
    const { data, error } = await supabase.schema('api').rpc('payroll_run_approve', { p_run_id: runId })
    if (error) {
      setError(error.message)
    } else {
      setStatusMessage(`Approve response: ${JSON.stringify(data)}`)
      await loadAllData()
    }
    setSubmitting(false)
  }

  async function rejectRun(runId: string) {
    setSubmitting(true)
    setError(null)
    setStatusMessage(null)
    const { data, error } = await supabase.schema('api').rpc('payroll_run_reject', { p_run_id: runId })
    if (error) {
      setError(error.message)
    } else {
      setStatusMessage(`Reject response: ${JSON.stringify(data)}`)
      await loadAllData()
    }
    setSubmitting(false)
  }

  async function payRun(runId: string) {
    setSubmitting(true)
    setError(null)
    setStatusMessage(null)
    const { data, error } = await supabase.schema('api').rpc('payroll_run_pay', {
      p_run_id: runId,
      p_payload: {},
    })
    if (error) {
      setError(error.message)
    } else {
      setStatusMessage(`Pay response: ${JSON.stringify(data)}`)
      await loadAllData()
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <article className="admin-dashboard">
        <header className="admin-dashboard__header">
          <div>
            <p className="admin-dashboard__eyebrow">Payroll & HR</p>
            <h1>Payroll</h1>
            <p>Review payroll runs, validate employee eligibility, and publish payments.</p>
          </div>
        </header>
        <section className="users-card"><div className="exec-dash__state-card"><h2 className="exec-dash__state-title">Loading payroll</h2><p className="exec-dash__state-message">Fetching payroll runs, payslips, and employee status data.</p></div></section>
      </article>
    )
  }

  if (error) {
    return (
      <article className="admin-dashboard">
        <header className="admin-dashboard__header">
          <div>
            <p className="admin-dashboard__eyebrow">Payroll & HR</p>
            <h1>Payroll</h1>
            <p>Review payroll runs, validate employee eligibility, and publish payments.</p>
          </div>
        </header>
        <section className="users-card"><div className="exec-dash__state-card exec-dash__state-card--error"><h2 className="exec-dash__state-title">Unable to load payroll</h2><p className="exec-dash__state-message">{error}</p></div></section>
      </article>
    )
  }

  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Payroll & HR</p>
          <h1>Payroll</h1>
          <p>Review payroll runs, validate employee eligibility, and publish payments.</p>
        </div>
      </header>

      <section className="users-card">
        <div className="users-card__header">
          <div>
            <h2>Payroll control center</h2>
            <p>Run creation is gated on active employees that have a `staff_category` value set.</p>
          </div>
          <div className="users-card__actions">
            <button type="button" className="button button--secondary" onClick={() => void loadAllData()}>Refresh</button>
            <button type="button" className="button button--primary" onClick={() => setShowModal(true)}>Create run</button>
          </div>
        </div>

        {statusMessage && <div className="exec-dash__state-card" style={{ marginBottom: '1rem' }}><h2 className="exec-dash__state-title">RPC response</h2><p className="exec-dash__state-message">{statusMessage}</p></div>}

        {blockingEmployees.length > 0 && (
          <div className="exec-dash__state-card exec-dash__state-card--error" style={{ marginBottom: '1rem' }}>
            <h2 className="exec-dash__state-title">Payroll run blocked</h2>
            <p className="exec-dash__state-message">The following active employees are missing `staff_category`:</p>
            <ul>
              {blockingEmployees.map((employee) => (
                <li key={employee.employee_id ?? employee.id ?? employee.full_name}>{employee.full_name ?? 'Unnamed employee'} — missing staff_category</li>
              ))}
            </ul>
          </div>
        )}

        <div className="exec-dash__row">
          <section className="exec-dash__panel exec-dash__panel--mock" aria-labelledby="payroll-history-title">
            <h3 className="exec-dash__panel-title" id="payroll-history-title">Payroll history</h3>
            <div className="exec-dash__mock-body">
              <span className="exec-dash__mock-badge">Mock data — pending backend</span>
              <p className="exec-dash__mock-note">
                Historical payroll runs and payslip history are not backed by a live listing RPC in the current backend surface. The run creation, approve, reject, and pay actions remain functional; the history view is intentionally marked pending-backend.
              </p>
            </div>
          </section>

          <div className="exec-dash__panel">
            <div className="exec-dash__panel-title">Latest created run</div>
            {!createdRun ? (
              <div className="exec-dash__state-card exec-dash__state-card--empty"><h2 className="exec-dash__state-title">No run created yet</h2><p className="exec-dash__state-message">Create a payroll run to expose its inline payslips and action controls.</p></div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '0.5rem' }}>Period</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem' }}>Status</th>
                      <th style={{ textAlign: 'left', padding: '0.5rem' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ padding: '0.5rem' }}>{createdRun.period ?? '—'}</td>
                      <td style={{ padding: '0.5rem' }}>{createdRun.status ?? '—'}</td>
                      <td style={{ padding: '0.5rem' }}>
                        <button type="button" className="button button--secondary" onClick={() => setSelectedRunId(createdRun.run_id ?? createdRun.id ?? null)}>View payslips</button>{' '}
                        <button type="button" className="button button--secondary" onClick={() => void approveRun(createdRun.run_id ?? createdRun.id ?? '')}>Approve</button>{' '}
                        <button type="button" className="button button--secondary" onClick={() => void rejectRun(createdRun.run_id ?? createdRun.id ?? '')}>Reject</button>{' '}
                        <button type="button" className="button button--secondary" onClick={() => void payRun(createdRun.run_id ?? createdRun.id ?? '')}>Pay</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="exec-dash__panel" style={{ margin: '0 21px 21px' }}>
          <div className="exec-dash__panel-title">Payslips for created run</div>
          {!selectedRunId ? (
            <div className="exec-dash__state-card exec-dash__state-card--empty"><h2 className="exec-dash__state-title">No run selected</h2><p className="exec-dash__state-message">Create a run to inspect its inline payslips.</p></div>
          ) : selectedRunPayslips.length === 0 ? (
            <div className="exec-dash__state-card exec-dash__state-card--empty"><h2 className="exec-dash__state-title">No payslips returned</h2><p className="exec-dash__state-message">The create response did not include payslip rows, so no inline payslip table can be displayed yet.</p></div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '0.5rem' }}>Employee</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem' }}>Gross salary</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem' }}>PAYE</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem' }}>SSNIT employee</th>
                    <th style={{ textAlign: 'right', padding: '0.5rem' }}>Net salary</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedRunPayslips.map((payslip) => (
                    <tr key={payslip.payslip_id ?? payslip.id ?? payslip.employee_id}>
                      <td style={{ padding: '0.5rem' }}>{payslip.employee_id ?? '—'}</td>
                      <td style={{ textAlign: 'right', padding: '0.5rem' }}>{formatMoneyGhs(Number(payslip.gross_salary ?? 0) || 0)}</td>
                      <td style={{ textAlign: 'right', padding: '0.5rem' }}>{formatMoneyGhs(Number(payslip.paye ?? 0) || 0)}</td>
                      <td style={{ textAlign: 'right', padding: '0.5rem' }}>{formatMoneyGhs(Number(payslip.ssnit_employee ?? 0) || 0)}</td>
                      <td style={{ textAlign: 'right', padding: '0.5rem' }}>{formatMoneyGhs(Number(payslip.net_salary ?? 0) || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 14, 26, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 1000 }}>
          <div style={{ width: '100%', maxWidth: 460, background: 'var(--surface)', borderRadius: 16, padding: '1rem', boxShadow: '0 20px 45px rgba(0,0,0,0.35)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>Create payroll run</h2>
              <button type="button" className="button button--secondary" onClick={() => setShowModal(false)}>Close</button>
            </div>
            <label>
              Period
              <input type="month" value={runPeriod} onChange={(event) => setRunPeriod(event.target.value)} style={{ display: 'block', width: '100%', marginTop: '0.25rem', marginBottom: '0.75rem' }} />
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button type="button" className="button button--secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="button" className="button button--primary" onClick={() => { void createRun(); setShowModal(false) }} disabled={submitting}>{submitting ? 'Creating…' : 'Create run'}</button>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}
