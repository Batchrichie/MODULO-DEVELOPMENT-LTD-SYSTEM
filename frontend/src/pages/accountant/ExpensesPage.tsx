import { useEffect, useState } from 'react'
import { formatMoneyGhs } from '../../lib/formatMoney'
import { expenseCreate, fetchAccounts } from '../../lib/rpc/accountant'
import { supabase } from '../../lib/supabase'
import '../../styles/executive-dashboard.css'

/**
 * Helper to unwrap RPC envelope and extract real errors from business-logic failures.
 */
function unwrapRpcResponse<T>(data: unknown): { ok: boolean; value: T | null; error: string | null } {
  const envelope = data as { success?: boolean; data: T; error?: { code: string; message: string } | null } | null
  if (!envelope) {
    return { ok: false, value: null, error: 'No response from server' }
  }
  if (envelope.success === false) {
    return { ok: false, value: null, error: envelope.error?.message ?? 'Unknown error' }
  }
  return { ok: true, value: envelope.data, error: null }
}

interface ExpenseFormState {
  supplier_id: string
  amount: string
  project_id: string
  coa_account: string
  expense_date: string
}

const emptyForm = (): ExpenseFormState => {
  const today = new Date().toISOString().split('T')[0]
  return {
    supplier_id: '',
    amount: '',
    project_id: '',
    coa_account: '',
    expense_date: today,
  }
}

export function ExpensesPage() {
  const [form, setForm] = useState<ExpenseFormState>(emptyForm())
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ expense_id?: string; amount?: number; budget_flag?: boolean } | null>(null)

  useEffect(() => {
    void loadInitialData()
  }, [])

  async function loadInitialData() {
    setLoading(true)
    setError(null)

    // Load suppliers
    const { data: suppliersData, error: suppliersError } = await supabase
      .schema('api')
      .rpc('get_records', { p_resource: 'suppliers', p_page: 1, p_limit: 100 })

    if (suppliersError) {
      setError(`Failed to load suppliers: ${suppliersError.message}`)
    } else {
      const unwrapped = unwrapRpcResponse(suppliersData)
      if (!unwrapped.ok) {
        setError(`Failed to load suppliers: ${unwrapped.error}`)
        setSuppliers([])
      } else {
        setSuppliers(Array.isArray(unwrapped.value) ? unwrapped.value : [])
      }
    }

    // Load projects
    const { data: projectsData, error: projectsError } = await supabase
      .schema('api')
      .rpc('get_records', { p_resource: 'projects', p_page: 1, p_limit: 100 })

    if (projectsError) {
      console.warn(`Failed to load projects: ${projectsError.message}`)
    } else {
      const unwrapped = unwrapRpcResponse(projectsData)
      if (!unwrapped.ok) {
        console.warn(`Failed to load projects: ${unwrapped.error}`)
      } else {
        setProjects(Array.isArray(unwrapped.value) ? unwrapped.value : [])
      }
    }

    // Load and filter accounts (Expense or Asset, postable only)
    const accountsResult = await fetchAccounts()
    if (accountsResult.ok) {
      const filtered = accountsResult.data.filter(
        (acc: any) =>
          (acc.type === 'Expense' || acc.type === 'Asset') &&
          acc.is_postable === true
      )
      setAccounts(filtered)
    } else {
      console.warn(`Failed to load accounts: ${accountsResult.error}`)
    }

    setLoading(false)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    // Validate required fields
    if (!form.supplier_id) {
      setError('Supplier is required')
      setSubmitting(false)
      return
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setError('Amount must be greater than 0')
      setSubmitting(false)
      return
    }

    if (!form.coa_account) {
      setError('GL Account is required')
      setSubmitting(false)
      return
    }

    const payload: Record<string, unknown> = {
      supplier_id: form.supplier_id,
      amount: Number(form.amount),
      coa_account: form.coa_account,
      expense_date: form.expense_date,
    }

    // project_id is optional - overhead expenses are valid (don't force project selection)
    if (form.project_id) {
      payload.project_id = form.project_id
    }

    const result = await expenseCreate(payload)
    if (result.ok) {
      setSuccess({
        expense_id: result.data.expense_id,
        amount: result.data.amount ?? 0,
        budget_flag: result.data.budget_flag,
      })
      setForm(emptyForm())
    } else {
      setError(result.error)
    }

    setSubmitting(false)
  }

  if (loading) {
    return (
      <article className="admin-dashboard">
        <header className="admin-dashboard__header">
          <div>
            <p className="admin-dashboard__eyebrow">Invoicing & Expenses</p>
            <h1>Create Expense</h1>
          </div>
        </header>
        <div className="exec-dash__state-card">
          <h2 className="exec-dash__state-title">Loading</h2>
          <p className="exec-dash__state-message">Fetching suppliers, projects, and accounts...</p>
        </div>
      </article>
    )
  }

  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Invoicing & Expenses</p>
          <h1>Create Expense</h1>
          <p>Record an expense (supplier invoice). Project is optional for overhead expenses.</p>
        </div>
      </header>

      <section className="users-card">
        <div className="users-card__header">
          <div>
            <h2>Expense Details</h2>
            <p>Post an expense and trigger automatic journal entries.</p>
          </div>
        </div>

        <div className="exec-dash__row">
          <div className="exec-dash__panel">
            {error && <div className="exec-dash__state-card exec-dash__state-card--error exec-dash__state-card--inline">
              <h2 className="exec-dash__state-title">Error</h2>
              <p className="exec-dash__state-message">{error}</p>
            </div>}

            {success && (
              <>
                {success.budget_flag && (
                  <div className="exec-dash__state-card exec-dash__state-card--warning exec-dash__state-card--inline">
                    <strong>⚠️ Budget Warning</strong>
                    <p>This expense exceeds the project budget. Review budget status before proceeding.</p>
                  </div>
                )}
                <div className="exec-dash__state-card exec-dash__state-card--success exec-dash__state-card--inline">
                  <h2 className="exec-dash__state-title">Expense Created</h2>
                  <p className="exec-dash__state-message">
                    Expense ID: <strong>{success.expense_id}</strong>
                    <br />
                    Amount: <strong>{formatMoneyGhs(success.amount || 0)}</strong>
                  </p>
                </div>
              </>
            )}

            <form onSubmit={(event) => void handleSubmit(event)}>
              <div className="form-grid">
                <label className="form-field">
                  <span className="form-field__label">Supplier *</span>
                  <select
                    value={form.supplier_id}
                    onChange={(event) => setForm((current) => ({ ...current, supplier_id: event.target.value }))}
                    required
                  >
                    <option value="">Select a supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.supplier_id || supplier.id} value={supplier.supplier_id || supplier.id}>
                        {supplier.name || supplier.supplier_name || '—'}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span className="form-field__label">Amount *</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                    step="0.01"
                    min="0"
                    required
                  />
                </label>

                <label className="form-field">
                  <span className="form-field__label">GL Account (Expense/Asset) *</span>
                  <select
                    value={form.coa_account}
                    onChange={(event) => setForm((current) => ({ ...current, coa_account: event.target.value }))}
                    required
                  >
                    <option value="">Select an account</option>
                    {accounts.map((account) => (
                      <option key={account.account_id || account.id} value={account.account_id || account.id}>
                        {account.code} — {account.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span className="form-field__label">Expense Date *</span>
                  <input
                    type="date"
                    value={form.expense_date}
                    onChange={(event) => setForm((current) => ({ ...current, expense_date: event.target.value }))}
                    required
                  />
                </label>

                <label className="form-field form-field--full">
                  <span className="form-field__label">Project (optional — leave blank for overhead)</span>
                  <select
                    value={form.project_id}
                    onChange={(event) => setForm((current) => ({ ...current, project_id: event.target.value }))}
                  >
                    <option value="">Overhead (no project)</option>
                    {projects.map((project) => (
                      <option key={project.project_id || project.id} value={project.project_id || project.id}>
                        {project.name || project.project_name || '—'}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="summary-box">
                <div className="summary-box__row summary-box__row--total">
                  <strong>Total expense:</strong>
                  <span>{formatMoneyGhs(Number(form.amount) || 0)}</span>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={submitting}
                >
                  {submitting ? 'Creating Expense...' : 'Create Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </article>
  )
}
