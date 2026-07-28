import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../../components/Modal'
import { formatMoneyGhs } from '../../lib/formatMoney'
import { supabase } from '../../lib/supabase'
import { unwrapRpcResponse } from '../../lib/common'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EmptyState } from '../../components/EmptyState'
import { PendingBackendNotice } from '../../components/PendingBackendNotice'
import { deriveStatusBadgeFromState, StatusBadge } from '../../components/StatusBadge'
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

interface SettlementAccountRecord {
  account_id?: string
  id?: string
  name?: string | null
  payment_method_type?: string | null
}

type ApproveTarget = { runId: string; period?: string } | null
type RejectTarget = { runId: string; period?: string } | null
type PayTarget = { runId: string; period?: string } | null

export function PayrollPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([])
  const [settlementAccounts, setSettlementAccounts] = useState<SettlementAccountRecord[]>([])
  const [createdRun, setCreatedRun] = useState<PayrollRunRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [runPeriod, setRunPeriod] = useState(new Date().toISOString().slice(0, 7))
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [selectedSettlementAccountId, setSelectedSettlementAccountId] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [approveTarget, setApproveTarget] = useState<ApproveTarget>(null)
  const [rejectTarget, setRejectTarget] = useState<RejectTarget>(null)
  const [payTarget, setPayTarget] = useState<PayTarget>(null)

  useEffect(() => {
    void loadAllData()
  }, [])

  useEffect(() => {
    if (!showModal) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setShowModal(false)
    }
    document.addEventListener('keydown', onKey)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = originalOverflow
    }
  }, [showModal])

  async function loadAllData() {
    setLoading(true)
    setError(null)
    setStatusMessage(null)

    const [employeesResult, settlementAccountsResult] = await Promise.all([
      supabase.schema('api').rpc('get_records', {
        p_resource: 'employees',
        p_page: 1,
        p_limit: 200,
      }),
      supabase.schema('api').rpc('list_payment_method_accounts'),
    ])

    if (employeesResult.error) {
      setError(employeesResult.error.message)
      setEmployees([])
    } else {
      const unwrapped = unwrapRpcResponse<EmployeeRecord[]>(employeesResult.data)
      if (!unwrapped.ok) {
        setError(unwrapped.error)
        setEmployees([])
      } else {
        setEmployees(Array.isArray(unwrapped.value) ? unwrapped.value : [])
      }
    }

    if (settlementAccountsResult.error) {
      setError((current) => current ? `${current}; ${settlementAccountsResult.error.message}` : settlementAccountsResult.error.message)
      setSettlementAccounts([])
    } else {
      const unwrapped = unwrapRpcResponse<SettlementAccountRecord[]>(settlementAccountsResult.data)
      if (!unwrapped.ok) {
        setError((current) => current ? `${current}; ${unwrapped.error}` : unwrapped.error)
        setSettlementAccounts([])
      } else {
        const accounts = Array.isArray(unwrapped.value) ? unwrapped.value : []
        setSettlementAccounts(accounts)
        if (!selectedSettlementAccountId && accounts.length > 0) {
          setSelectedSettlementAccountId(accounts[0].account_id ?? accounts[0].id ?? '')
        }
      }
    }

    setLoading(false)
  }

  const employeeNameById = useMemo(() => {
    return employees.reduce((acc, employee) => {
      acc[employee.employee_id ?? employee.id ?? ''] = employee.full_name ?? 'Unknown employee'
      return acc
    }, {} as Record<string, string>)
  }, [employees])

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

  const runTotals = useMemo(() => {
    if (selectedRunPayslips.length === 0) return null
    return selectedRunPayslips.reduce(
      (acc, p) => ({
        gross: acc.gross + (Number(p.gross_salary ?? 0) || 0),
        paye: acc.paye + (Number(p.paye ?? 0) || 0),
        ssnitEmp: acc.ssnitEmp + (Number(p.ssnit_employee ?? 0) || 0),
        ssnitEmpLr: acc.ssnitEmpLr + (Number(p.ssnit_employer ?? 0) || 0),
        other: acc.other + (Number(p.other_deductions ?? 0) || 0),
        net: acc.net + (Number(p.net_salary ?? 0) || 0),
      }),
      { gross: 0, paye: 0, ssnitEmp: 0, ssnitEmpLr: 0, other: 0, net: 0 } as { gross: number; paye: number; ssnitEmp: number; ssnitEmpLr: number; other: number; net: number }
    )
  }, [selectedRunPayslips])

  async function createRun() {
    setSubmitting(true)
    setFormError(null)
    setStatusMessage(null)

    if (blockingEmployees.length > 0) {
      setFormError(`Payroll run blocked for named employees: ${blockingEmployees.map((employee) => employee.full_name ?? 'Unknown employee').join(', ')}. Every active employee must have staff_category set.`)
      setSubmitting(false)
      return
    }

    const { data, error: rpcError } = await supabase.schema('api').rpc('payroll_run_create', {
      period: runPeriod,
    })

    if (rpcError) {
      setFormError(rpcError.message)
      setSubmitting(false)
      return
    }

    const unwrapped = unwrapRpcResponse<Record<string, unknown>>(data)
    if (!unwrapped.ok) {
      setFormError(unwrapped.error)
      setSubmitting(false)
      return
    }

    const payload = unwrapped.value
    if (!payload) {
      setFormError('Empty response from payroll_run_create')
      setSubmitting(false)
      return
    }

    const runId = String(payload.run_id ?? payload.id ?? '')
    const payslips = Array.isArray(payload.payslips) ? (payload.payslips as PayslipRecord[]) : []

    const nextRun: PayrollRunRecord = {
      run_id: runId,
      id: runId,
      period: String(payload.period ?? runPeriod),
      status: String(payload.status ?? 'Draft'),
      payslips,
    }

    setCreatedRun(nextRun)
    setSelectedRunId(runId)
    setShowModal(false)
    setStatusMessage(`Payroll run ${runId} created for ${runPeriod}. ${payslips.length} payslip(s) returned — status: ${nextRun.status}.`)
    await loadAllData()
    setSubmitting(false)
  }

  async function handleApproveConfirm() {
    if (!approveTarget) return
    setSubmitting(true)
    setFormError(null)
    setStatusMessage(null)
    const { data, error: rpcError } = await supabase.schema('api').rpc('payroll_run_approve', { p_run_id: approveTarget.runId })
    if (rpcError) {
      setFormError(rpcError.message)
    } else {
      const unwrapped = unwrapRpcResponse<unknown>(data)
      if (!unwrapped.ok) {
        setFormError(unwrapped.error)
      } else {
        setStatusMessage(`Payroll run ${approveTarget.runId} has been approved.`)
        setCreatedRun((current) => current && (current.run_id ?? current.id) === approveTarget.runId ? { ...current, status: 'Approved' } : current)
        await loadAllData()
      }
    }
    setApproveTarget(null)
    setSubmitting(false)
  }

  async function handleRejectConfirm(_reason?: string) {
    if (!rejectTarget) return
    setSubmitting(true)
    setFormError(null)
    setStatusMessage(null)
    const { data, error: rpcError } = await supabase.schema('api').rpc('payroll_run_reject', { p_run_id: rejectTarget.runId })
    if (rpcError) {
      setFormError(rpcError.message)
    } else {
      const unwrapped = unwrapRpcResponse<unknown>(data)
      if (!unwrapped.ok) {
        setFormError(unwrapped.error)
      } else {
        setStatusMessage(`Payroll run ${rejectTarget.runId} has been rejected${_reason ? ` (reason: ${_reason}).` : '.'}`)
        setCreatedRun((current) => current && (current.run_id ?? current.id) === rejectTarget.runId ? { ...current, status: 'Rejected' } : current)
        await loadAllData()
      }
    }
    setRejectTarget(null)
    setSubmitting(false)
  }

  async function handlePayConfirm() {
    if (!payTarget) return
    setSubmitting(true)
    setFormError(null)
    setStatusMessage(null)

    if (!selectedSettlementAccountId) {
      setFormError('Choose a settlement account before paying the run.')
      setPayTarget(null)
      setSubmitting(false)
      return
    }

    const { data, error: rpcError } = await supabase.schema('api').rpc('payroll_run_pay', {
      p_run_id: payTarget.runId,
      p_payload: { settlement_account_id: selectedSettlementAccountId },
    })
    if (rpcError) {
      setFormError(rpcError.message)
    } else {
      const unwrapped = unwrapRpcResponse<unknown>(data)
      if (!unwrapped.ok) {
        setFormError(unwrapped.error)
      } else {
        const selectedAccount = settlementAccounts.find((account) => (account.account_id ?? account.id) === selectedSettlementAccountId)
        setStatusMessage(`Payroll run ${payTarget.runId} has been paid using ${selectedAccount?.name ?? 'the selected settlement account'}.`)
        setCreatedRun((current) => current && (current.run_id ?? current.id) === payTarget.runId ? { ...current, status: 'Paid' } : current)
        await loadAllData()
      }
    }
    setPayTarget(null)
    setSubmitting(false)
  }

  function runActionButtons(run: PayrollRunRecord) {
    const runId = run.run_id ?? run.id ?? ''
    const status = (run.status ?? '').toLowerCase()
    const isApprovedOrPaid = status === 'approved' || status === 'paid'
    const isDraftOrCreated = status === 'draft' || status === 'created' || status === 'submitted'
    return (
      <div className="data-table__actions">
        <button type="button" className="button button--secondary" onClick={() => setSelectedRunId(runId)}>View payslips</button>
        <button
          type="button"
          className="button button--secondary"
          onClick={() => setApproveTarget({ runId, period: run.period ?? undefined })}
          disabled={!isDraftOrCreated || submitting}
        >
          Approve
        </button>
        <button
          type="button"
          className="button button--secondary"
          onClick={() => setRejectTarget({ runId, period: run.period ?? undefined })}
          disabled={!isDraftOrCreated || submitting}
        >
          Reject
        </button>
        <button
          type="button"
          className="button button--secondary"
          onClick={() => setPayTarget({ runId, period: run.period ?? undefined })}
          disabled={!isApprovedOrPaid || !selectedSettlementAccountId || submitting}
        >
          Pay
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <article className="admin-dashboard">
        <header className="admin-dashboard__header">
          <div>
            <p className="admin-dashboard__eyebrow">Payroll &amp; HR</p>
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
            <p className="admin-dashboard__eyebrow">Payroll &amp; HR</p>
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
          <p className="admin-dashboard__eyebrow">Payroll &amp; HR</p>
          <h1>Payroll</h1>
          <p>Review payroll runs, validate employee eligibility, and publish payments. Workflow: Draft → Submitted → Approved / Rejected → Paid.</p>
        </div>
      </header>

      <section className="admin-dashboard__stats" aria-label="Payroll metrics">
        <div className="stat-card"><div className="stat-card__icon stat-card__icon--blue"><span>Σ</span></div><div className="stat-card__content"><span>Eligible employees</span><strong>{String(employees.filter((e) => e.employment_status === 'Active' && e.staff_category).length)}</strong><small>Ready for run</small></div></div>
        <div className="stat-card"><div className="stat-card__icon stat-card__icon--orange"><span>⚠</span></div><div className="stat-card__content"><span>Missing category</span><strong>{String(blockingEmployees.length)}</strong><small>Blocks runs</small></div></div>
        <div className="stat-card"><div className="stat-card__icon stat-card__icon--purple"><span>🏦</span></div><div className="stat-card__content"><span>Settlement accounts</span><strong>{String(settlementAccounts.length)}</strong><small>CoA payment methods</small></div></div>
      </section>

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

        {statusMessage && <div className="exec-dash__state-card exec-dash__state-card--inline exec-dash__state-card--success"><h2 className="exec-dash__state-title">RPC response</h2><p className="exec-dash__state-message">{statusMessage}</p></div>}

        {!showModal && formError && <div className="exec-dash__state-card exec-dash__state-card--error exec-dash__state-card--inline"><h2 className="exec-dash__state-title">Form error</h2><p className="exec-dash__state-message">{formError}</p></div>}

        {blockingEmployees.length > 0 && (
          <div className="exec-dash__state-card exec-dash__state-card--warning exec-dash__state-card--inline">
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
          <section className="exec-dash__panel" aria-labelledby="payroll-history-title">
            <h3 className="exec-dash__panel-title" id="payroll-history-title">Payroll history</h3>
            <PendingBackendNotice
              inline
              title="History listing pending backend"
              description="Historical payroll runs and payslip history are not backed by a live listing RPC. The run creation, approve, reject, and pay actions remain functional; the history view is pending payroll_run_list RPC."
            />
          </section>

          <div className="exec-dash__panel">
            <div className="exec-dash__panel-title">Latest created run</div>
            {!createdRun ? (
              <EmptyState
                icon="📊"
                title="No run created yet"
                description="Create a payroll run above to expose its inline payslips and action controls."
              />
            ) : (
              <>
                <label className="form-field">
                  <span className="form-field__label">Settlement account</span>
                  <select
                    value={selectedSettlementAccountId}
                    onChange={(event) => setSelectedSettlementAccountId(event.target.value)}
                  >
                    {settlementAccounts.length === 0 ? <option value="">No payment accounts available</option> : settlementAccounts.map((account) => (
                      <option key={account.account_id ?? account.id ?? account.name} value={account.account_id ?? account.id ?? ''}>
                        {account.name ?? 'Unnamed account'} ({account.payment_method_type ?? 'Unknown'})
                      </option>
                    ))}
                  </select>
                </label>

                <div className="table-wrapper" style={{ marginTop: 'var(--space-md)' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Period</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong style={{ display: 'block' }}>{createdRun.period ?? '—'}</strong></td>
                        <td className="data-table__cell--status">
                          <StatusBadge
                            label={deriveStatusBadgeFromState(createdRun.status ?? 'Draft').label}
                            tone={deriveStatusBadgeFromState(createdRun.status ?? 'Draft').tone}
                          />
                        </td>
                        <td>{runActionButtons(createdRun)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="exec-dash__panel--standalone">
          <div className="exec-dash__panel-title">Payslips for created run</div>
          {!selectedRunId ? (
            <EmptyState
              icon="📄"
              title="No run selected"
              description="Create a payroll run and click View payslips to inspect generated payslip rows."
            />
          ) : selectedRunPayslips.length === 0 ? (
            <EmptyState
              icon="🧾"
              title="No payslips returned"
              description="The payroll run response did not include payslip rows."
            />
          ) : (
            <>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th className="data-table__num">Gross salary</th>
                      <th className="data-table__num">PAYE</th>
                      <th className="data-table__num">SSNIT employee</th>
                      <th className="data-table__num">SSNIT employer</th>
                      <th className="data-table__num">Other deductions</th>
                      <th className="data-table__num">Net salary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRunPayslips.map((payslip) => (
                      <tr key={payslip.payslip_id ?? payslip.id ?? payslip.employee_id}>
                        <td>{employeeNameById[payslip.employee_id ?? ''] ?? payslip.employee_id ?? '—'}</td>
                        <td className="data-table__num">{formatMoneyGhs(Number(payslip.gross_salary ?? 0) || 0)}</td>
                        <td className="data-table__num">{formatMoneyGhs(Number(payslip.paye ?? 0) || 0)}</td>
                        <td className="data-table__num">{formatMoneyGhs(Number(payslip.ssnit_employee ?? 0) || 0)}</td>
                        <td className="data-table__num">{formatMoneyGhs(Number(payslip.ssnit_employer ?? 0) || 0)}</td>
                        <td className="data-table__num">{formatMoneyGhs(Number(payslip.other_deductions ?? 0) || 0)}</td>
                        <td className="data-table__num"><strong>{formatMoneyGhs(Number(payslip.net_salary ?? 0) || 0)}</strong></td>
                      </tr>
                    ))}
                    {runTotals && (
                      <tr style={{ fontWeight: 600, background: 'var(--color-bg-muted)' }}>
                        <td>Totals ({selectedRunPayslips.length} payslips)</td>
                        <td className="data-table__num">{formatMoneyGhs(runTotals.gross)}</td>
                        <td className="data-table__num">{formatMoneyGhs(runTotals.paye)}</td>
                        <td className="data-table__num">{formatMoneyGhs(runTotals.ssnitEmp)}</td>
                        <td className="data-table__num">{formatMoneyGhs(runTotals.ssnitEmpLr)}</td>
                        <td className="data-table__num">{formatMoneyGhs(runTotals.other)}</td>
                        <td className="data-table__num">{formatMoneyGhs(runTotals.net)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Create payroll run"
        subtitle="Generate payslips for all eligible active employees for the selected period."
        maxWidth={760}
        footer={(
          <>
            <button type="button" className="button button--secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="button" className="button button--primary" onClick={() => { void createRun() }} disabled={submitting || blockingEmployees.length > 0}>
              {submitting ? 'Creating…' : 'Create run'}
            </button>
          </>
        )}
      >
        {formError && <div className="exec-dash__state-card exec-dash__state-card--error exec-dash__state-card--inline"><h2 className="exec-dash__state-title">Error</h2><p className="exec-dash__state-message">{formError}</p></div>}
        <div className="form-grid">
          <label className="form-field form-field--full">
            <span className="form-field__label">Period (YYYY-MM)</span>
            <input type="month" value={runPeriod} onChange={(event) => setRunPeriod(event.target.value)} required />
          </label>
        </div>
        {blockingEmployees.length > 0 && (
          <div className="exec-dash__state-card exec-dash__state-card--warning exec-dash__state-card--inline">
            <h2 className="exec-dash__state-title">Run will fail — {blockingEmployees.length} employee(s) unclassified</h2>
            <p className="exec-dash__state-message">Assign `staff_category` (Project / Admin) to each active employee in Employee Records before creating a run.</p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={() => void handleApproveConfirm()}
        tone="warning"
        iconGlyph="✓"
        title="Approve this payroll run?"
        description={`Approving payroll run${approveTarget?.period ? ` for ${approveTarget.period}` : ''} (${approveTarget?.runId ?? ''}) marks it as Approved and eligible for payment. Approved runs can still be rejected if corrections are needed before Pay.`}
        confirmLabel="Approve run"
        cancelLabel="Keep current status"
        confirmingLabel="Approving…"
      />

      <ConfirmDialog
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={(reason) => void handleRejectConfirm(reason)}
        tone="danger"
        iconGlyph="✕"
        title="Reject this payroll run?"
        description={`Rejecting payroll run${rejectTarget?.period ? ` for ${rejectTarget.period}` : ''} (${rejectTarget?.runId ?? ''}) returns it to Draft for corrections. Payslips are NOT deleted — run must be corrected and re-submitted for approval.`}
        requireReason
        reasonLabel="Reason for rejection (required)"
        reasonPlaceholder="e.g. Missing contractor, PAYE rates incorrect, SSNIT columns swapped…"
        confirmLabel="Reject run"
        cancelLabel="Keep current status"
        confirmingLabel="Rejecting…"
      />

      <ConfirmDialog
        open={!!payTarget}
        onClose={() => setPayTarget(null)}
        onConfirm={() => void handlePayConfirm()}
        tone="info"
        iconGlyph="₵"
        title="Initiate payroll disbursement?"
        description={`Paying payroll run${payTarget?.period ? ` for ${payTarget.period}` : ''} (${payTarget?.runId ?? ''}) marks the run as Paid. Settlement account: ${settlementAccounts.find((a) => (a.account_id ?? a.id) === selectedSettlementAccountId)?.name ?? '(none selected)'} — confirm BEFORE clicking as this triggers the final disbursement RPC.`}
        confirmLabel="Pay run"
        cancelLabel="Review again"
        confirmingLabel="Dispersing…"
      />
    </article>
  )
}
