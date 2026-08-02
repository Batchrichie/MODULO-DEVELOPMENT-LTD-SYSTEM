import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { EmptyState } from '../../components/EmptyState'
import { formatMoneyGhs } from '../../lib/formatMoney'
import { fetchAccounts, pettyCashDisbursementCreate } from '../../lib/rpc/accountant'
import { supabase } from '../../lib/supabase'
import { unwrapRpcResponse } from '../../lib/common'
import '../../styles/executive-dashboard.css'

interface PettyCashFormState {
  disbursement_type: 'direct' | 'advance' | 'advance_clearing'
  amount: string
  employee_id: string
  coa_account: string
  settlement_account_id: string
  linked_advance_id: string
}

interface SelectOption {
  id: string
  label: string
}

interface PettyCashDisbursementRecord {
  id?: string
  disbursement_id?: string
  amount?: number | null
  employee_id?: string | null
  disbursement_type?: string | null
  linked_advance_id?: string | null
  created_at?: string | null
  [key: string]: unknown
}

const emptyForm = (): PettyCashFormState => ({
  disbursement_type: 'direct',
  amount: '',
  employee_id: '',
  coa_account: '',
  settlement_account_id: '',
  linked_advance_id: '',
})

function getId(record: PettyCashDisbursementRecord): string {
  return String(record.disbursement_id ?? record.id ?? record.petty_cash_disbursement_id ?? '')
}

function getLabel(record: PettyCashDisbursementRecord): string {
  const id = getId(record)
  const employee = String(record.employee_id ?? 'Unknown')
  const amount = formatMoneyGhs(Number(record.amount ?? 0) || 0)
  const date = String(record.created_at ?? record.disbursement_date ?? 'No date')
  return `${id} · ${employee} · ${amount} · ${date}`
}

export function PettyCashPage() {
  const [form, setForm] = useState<PettyCashFormState>(emptyForm())
  const [employees, setEmployees] = useState<SelectOption[]>([])
  const [expenseAccounts, setExpenseAccounts] = useState<SelectOption[]>([])
  const [settlementAccounts, setSettlementAccounts] = useState<SelectOption[]>([])
  const [disbursements, setDisbursements] = useState<PettyCashDisbursementRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    void loadInitialData()
  }, [])

  async function loadInitialData() {
    setLoading(true)
    setLoadError(null)
    setFormError(null)
    setStatusMessage(null)

    const [employeesResult, accountsResult, settlementAccountsResult, disbursementsResult] = await Promise.all([
      supabase.schema('api').rpc('get_records', { p_resource: 'employees', p_page: 1, p_limit: 200 }),
      fetchAccounts(),
      supabase.schema('api').rpc('list_payment_method_accounts'),
      supabase.schema('api').rpc('get_records', { p_resource: 'petty_cash_disbursements', p_id: null, p_page: 1, p_limit: 500 }),
    ])

    if (employeesResult.error) {
      setLoadError(`Failed to load employees: ${employeesResult.error.message}`)
      setEmployees([])
    } else {
      const unwrapped = unwrapRpcResponse(employeesResult.data)
      if (!unwrapped.ok) {
        setLoadError(`Failed to load employees: ${unwrapped.error}`)
        setEmployees([])
      } else {
        const rows = Array.isArray(unwrapped.value) ? unwrapped.value : []
        setEmployees(
          rows.map((row: any) => ({
            id: String(row.employee_id ?? row.id ?? ''),
            label: String(row.full_name ?? row.name ?? row.employee_name ?? 'Unnamed employee'),
          })),
        )
      }
    }

    if (!accountsResult.ok) {
      setLoadError((current) => (current ? `${current}; Failed to load expense accounts: ${accountsResult.error}` : `Failed to load expense accounts: ${accountsResult.error}`))
      setExpenseAccounts([])
    } else {
      setExpenseAccounts(
        accountsResult.data
          .filter((account) => String(account.type ?? '').toLowerCase() === 'expense' && account.is_postable === true)
          .map((account) => ({
            id: String(account.account_id ?? account.id ?? ''),
            label: `${account.code ?? ''} — ${account.name ?? ''}`,
          })),
      )
    }

    if (settlementAccountsResult.error) {
      setLoadError((current) => (current ? `${current}; Failed to load settlement accounts: ${settlementAccountsResult.error.message}` : `Failed to load settlement accounts: ${settlementAccountsResult.error.message}`))
      setSettlementAccounts([])
    } else {
      const unwrapped = unwrapRpcResponse(settlementAccountsResult.data)
      if (!unwrapped.ok) {
        setLoadError((current) => (current ? `${current}; Failed to load settlement accounts: ${unwrapped.error}` : `Failed to load settlement accounts: ${unwrapped.error}`))
        setSettlementAccounts([])
      } else {
        const rows = Array.isArray(unwrapped.value) ? unwrapped.value : []
        setSettlementAccounts(
          rows.map((account: any) => ({
            id: String(account.account_id ?? account.id ?? ''),
            label: `${String(account.name ?? 'Unnamed account')} (${String(account.payment_method_type ?? 'Unknown')})`,
          })),
        )
      }
    }

    if (disbursementsResult.error) {
      setLoadError((current) => (current ? `${current}; Failed to load petty cash disbursements: ${disbursementsResult.error.message}` : `Failed to load petty cash disbursements: ${disbursementsResult.error.message}`))
      setDisbursements([])
    } else {
      const unwrapped = unwrapRpcResponse(disbursementsResult.data)
      if (!unwrapped.ok) {
        setLoadError((current) => (current ? `${current}; Failed to load petty cash disbursements: ${unwrapped.error}` : `Failed to load petty cash disbursements: ${unwrapped.error}`))
        setDisbursements([])
      } else {
        const rows = Array.isArray(unwrapped.value) ? unwrapped.value : []
        setDisbursements(rows as PettyCashDisbursementRecord[])
      }
    }

    setLoading(false)
  }

  const selectedEmployeeAdvances = useMemo(() => {
    const employeeId = form.employee_id
    if (!employeeId) return []

    const advances = disbursements.filter(
      (row) => String(row.disbursement_type ?? '').toLowerCase() === 'advance' && String(row.employee_id ?? '') === employeeId,
    )

    const clearings = disbursements.filter(
      (row) => String(row.disbursement_type ?? '').toLowerCase() === 'advance_clearing',
    )

    return advances
      .map((advance) => {
        const advanceId = getId(advance)
        const amount = Number(advance.amount ?? 0) || 0
        const cleared = clearings
          .filter((clear) => String(clear.linked_advance_id ?? clear.linked_advance ?? '') === advanceId)
          .reduce((sum, row) => sum + (Number(row.amount ?? 0) || 0), 0)
        return {
          id: advanceId,
          employee_id: String(advance.employee_id ?? ''),
          amount,
          outstanding: Math.max(0, amount - cleared),
          label: getLabel(advance),
        }
      })
      .filter((item) => item.outstanding > 0)
      .sort((a, b) => b.outstanding - a.outstanding)
  }, [disbursements, form.employee_id])

  function resetFormForType(type: PettyCashFormState['disbursement_type']) {
    setForm((current) => ({
      ...current,
      disbursement_type: type,
      amount: '',
      employee_id: '',
      coa_account: '',
      settlement_account_id: '',
      linked_advance_id: '',
    }))
    setFormError(null)
    setStatusMessage(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setFormError(null)
    setStatusMessage(null)

    const amountValue = Number(form.amount)
    if (!form.amount || amountValue <= 0) {
      setFormError('Enter a positive amount.')
      setSubmitting(false)
      return
    }

    if (form.disbursement_type === 'advance' || form.disbursement_type === 'advance_clearing') {
      if (!form.employee_id) {
        setFormError('Employee is required for advance and advance-clearing disbursements.')
        setSubmitting(false)
        return
      }
    }

    if (form.disbursement_type === 'direct' || form.disbursement_type === 'advance_clearing') {
      if (!form.coa_account) {
        setFormError('GL account is required for direct and clearing disbursements.')
        setSubmitting(false)
        return
      }
    }

    if (form.disbursement_type === 'direct' || form.disbursement_type === 'advance') {
      if (!form.settlement_account_id) {
        setFormError('Settlement account is required for direct and advance disbursements.')
        setSubmitting(false)
        return
      }
    }

    if (form.disbursement_type === 'advance_clearing') {
      if (!form.linked_advance_id) {
        setFormError('Select the advance to clear.')
        setSubmitting(false)
        return
      }
    }

    const payload: Record<string, unknown> = {
      disbursement_type: form.disbursement_type,
      amount: amountValue,
    }

    if (form.disbursement_type !== 'direct') {
      payload.employee_id = form.employee_id
    }

    if (form.disbursement_type !== 'advance') {
      payload.coa_account = form.coa_account
    }

    if (form.disbursement_type !== 'advance_clearing') {
      payload.settlement_account_id = form.settlement_account_id
    }

    if (form.disbursement_type === 'advance_clearing') {
      payload.linked_advance_id = form.linked_advance_id
    }

    const result = await pettyCashDisbursementCreate(payload)
    if (result.ok) {
      setStatusMessage(`Disbursement created successfully — ${formatMoneyGhs(amountValue)}`)
      setForm(emptyForm())
      setDisbursements((current) => [...current, result.data as PettyCashDisbursementRecord])
      await loadInitialData()
    } else {
      setFormError(result.error)
    }

    setSubmitting(false)
  }

  if (loading) {
    return (
      <article className="admin-dashboard">
        <header className="admin-dashboard__header">
          <div>
            <p className="admin-dashboard__eyebrow">Banking & Cash</p>
            <h1>Petty Cash Disbursement</h1>
          </div>
        </header>
        <div className="exec-dash__state-card">
          <h2 className="exec-dash__state-title">Loading</h2>
          <p className="exec-dash__state-message">Fetching employees, accounts and settlement options...</p>
        </div>
      </article>
    )
  }

  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Banking & Cash</p>
          <h1>Petty Cash Disbursement</h1>
          <p>Create a direct petty-cash payment, employee advance, or advance clearing transaction.</p>
        </div>
      </header>

      <section className="users-card">
        <div className="users-card__header">
          <div>
            <h2>Disbursement details</h2>
            <p>Select the disbursement type and provide only the fields required by that mode.</p>
          </div>
          <div className="users-card__actions">
            <button type="button" className="button button--secondary" onClick={() => void loadInitialData()}>
              Refresh
            </button>
          </div>
        </div>

        <div className="exec-dash__panel">
          {loadError && (
            <div className="exec-dash__state-card exec-dash__state-card--error exec-dash__state-card--inline">
              <h2 className="exec-dash__state-title">Load issue</h2>
              <p className="exec-dash__state-message">{loadError}</p>
            </div>
          )}

          {formError && (
            <div className="exec-dash__state-card exec-dash__state-card--error exec-dash__state-card--inline">
              <h2 className="exec-dash__state-title">Validation error</h2>
              <p className="exec-dash__state-message">{formError}</p>
            </div>
          )}

          {statusMessage && (
            <div className="exec-dash__state-card exec-dash__state-card--success exec-dash__state-card--inline">
              <h2 className="exec-dash__state-title">Success</h2>
              <p className="exec-dash__state-message">{statusMessage}</p>
            </div>
          )}

          <form className="form-grid" onSubmit={(event) => void handleSubmit(event)}>
            <fieldset className="form-field form-field--full" disabled={submitting}>
              <legend className="form-field__label">Disbursement type *</legend>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {['direct', 'advance', 'advance_clearing'].map((type) => (
                  <label key={type} className="form-field--inline">
                    <input
                      type="radio"
                      name="disbursement_type"
                      value={type}
                      checked={form.disbursement_type === type}
                      onChange={() => resetFormForType(type as PettyCashFormState['disbursement_type'])}
                    />
                    <span>{type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="form-field">
              <span className="form-field__label">Amount *</span>
              <input
                type="number"
                value={form.amount}
                min="0"
                step="0.01"
                placeholder="0.00"
                disabled={submitting}
                onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                required
              />
            </label>

            {(form.disbursement_type === 'advance' || form.disbursement_type === 'advance_clearing') && (
              <label className="form-field">
                <span className="form-field__label">Employee *</span>
                <select
                  value={form.employee_id}
                  disabled={submitting}
                  onChange={(event) => setForm((current) => ({ ...current, employee_id: event.target.value, linked_advance_id: '' }))}
                  required
                >
                  <option value="">Select an employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {(form.disbursement_type === 'direct' || form.disbursement_type === 'advance_clearing') && (
              <label className="form-field">
                <span className="form-field__label">Expense GL account *</span>
                <select
                  value={form.coa_account}
                  disabled={submitting}
                  onChange={(event) => setForm((current) => ({ ...current, coa_account: event.target.value }))}
                  required
                >
                  <option value="">Select a GL account</option>
                  {expenseAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {(form.disbursement_type === 'direct' || form.disbursement_type === 'advance') && (
              <label className="form-field">
                <span className="form-field__label">Settlement account *</span>
                <select
                  value={form.settlement_account_id}
                  disabled={submitting}
                  onChange={(event) => setForm((current) => ({ ...current, settlement_account_id: event.target.value }))}
                  required
                >
                  <option value="">Select settlement account</option>
                  {settlementAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {form.disbursement_type === 'advance_clearing' && (
              <label className="form-field form-field--full">
                <span className="form-field__label">Advance to clear *</span>
                <select
                  value={form.linked_advance_id}
                  disabled={submitting || selectedEmployeeAdvances.length === 0}
                  onChange={(event) => setForm((current) => ({ ...current, linked_advance_id: event.target.value }))}
                  required
                >
                  <option value="">Select an outstanding advance</option>
                  {selectedEmployeeAdvances.map((advance) => (
                    <option key={advance.id} value={advance.id}>
                      {advance.label} · Outstanding {formatMoneyGhs(advance.outstanding)}
                    </option>
                  ))}
                </select>
                {form.employee_id && selectedEmployeeAdvances.length === 0 && (
                  <p className="form-field__hint">No outstanding advances found for the selected employee.</p>
                )}
                {!form.employee_id && (
                  <p className="form-field__hint">Pick an employee to load outstanding advances.</p>
                )}
              </label>
            )}

            <div className="form-field form-field--full" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="button button--secondary" onClick={() => setForm(emptyForm())} disabled={submitting}>
                Reset
              </button>
              <button type="submit" className="button button--primary" disabled={submitting}>
                {submitting ? 'Saving…' : 'Create disbursement'}
              </button>
            </div>
          </form>

          {form.disbursement_type === 'advance_clearing' && selectedEmployeeAdvances.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <h3>Outstanding advances</h3>
              <ul className="exec-dash__tax-list">
                {selectedEmployeeAdvances.map((advance) => (
                  <li key={advance.id} className="exec-dash__tax-item">
                    <span>{advance.label}</span>
                    <strong>{formatMoneyGhs(advance.outstanding)}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!employees.length && !loadError && (
            <EmptyState
              icon="👥"
              title="No employees available"
              description="Petty cash advances require employee records. Check that the employee table is populated."
            />
          )}
        </div>
      </section>
    </article>
  )
}
