import { useEffect, useState } from 'react'
import { formatMoneyGhs } from '../../lib/formatMoney'
import { expenseCreate } from '../../lib/rpc/accountant'
import { supabase } from '../../lib/supabase'
import '../../styles/executive-dashboard.css'

interface ExpenseFormState {
  description: string
  amount: number | ''
  project_id: string
  expense_date: string
}

const emptyForm = (): ExpenseFormState => {
  const today = new Date().toISOString().split('T')[0]
  return {
    description: '',
    amount: '',
    project_id: '',
    expense_date: today,
  }
}

export function ExpensesPage() {
  const [form, setForm] = useState<ExpenseFormState>(emptyForm())
  const [projects, setProjects] = useState<any[]>([])
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

    // Load projects
    const { data: projectsData, error: projectsError } = await supabase
      .schema('api')
      .rpc('get_records', { p_resource: 'projects', p_page: 1, p_limit: 100 })

    if (projectsError) {
      setError(`Failed to load projects: ${projectsError.message}`)
    } else {
      setProjects(Array.isArray(projectsData) ? projectsData : projectsData?.rows || projectsData?.data || [])
    }

    setLoading(false)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    // Validate required fields
    if (!form.description) {
      setError('Description is required')
      setSubmitting(false)
      return
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setError('Amount must be greater than 0')
      setSubmitting(false)
      return
    }

    const payload: Record<string, unknown> = {
      description: form.description,
      amount: Number(form.amount),
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
        amount: result.data.amount,
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
          <p className="exec-dash__state-message">Fetching projects...</p>
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
            {error && <div className="exec-dash__state-card exec-dash__state-card--error" style={{ marginBottom: '1rem' }}>
              <h2 className="exec-dash__state-title">Error</h2>
              <p className="exec-dash__state-message">{error}</p>
            </div>}

            {success && (
              <>
                {success.budget_flag && (
                  <div style={{
                    marginBottom: '1rem',
                    padding: '1rem',
                    backgroundColor: '#fef3c7',
                    border: '1px solid #fcd34d',
                    borderRadius: '4px',
                    color: '#92400e'
                  }}>
                    <strong>⚠️ Budget Warning</strong>
                    <p>This expense exceeds the project budget. Review budget status before proceeding.</p>
                  </div>
                )}
                <div className="exec-dash__state-card" style={{ marginBottom: '1rem', borderLeft: '4px solid #22c55e' }}>
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
              <label style={{ marginBottom: '1rem', display: 'block' }}>
                Description *
                <input
                  type="text"
                  placeholder="e.g., Building materials, fuel, contractor payment"
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  required
                  style={{ display: 'block', width: '100%', marginTop: '0.25rem', padding: '0.5rem' }}
                />
              </label>

              <label style={{ marginBottom: '1rem', display: 'block' }}>
                Amount *
                <input
                  type="number"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                  step="0.01"
                  min="0"
                  required
                  style={{ display: 'block', width: '100%', marginTop: '0.25rem', padding: '0.5rem' }}
                />
              </label>

              <label style={{ marginBottom: '1rem', display: 'block' }}>
                Project (optional — leave blank for overhead)
                <select
                  value={form.project_id}
                  onChange={(event) => setForm((current) => ({ ...current, project_id: event.target.value }))}
                  style={{ display: 'block', width: '100%', marginTop: '0.25rem', padding: '0.5rem' }}
                >
                  <option value="">Overhead (no project)</option>
                  {projects.map((project) => (
                    <option key={project.project_id || project.id} value={project.project_id || project.id}>
                      {project.name || project.project_name || '—'}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ marginBottom: '1.5rem', display: 'block' }}>
                Expense Date *
                <input
                  type="date"
                  value={form.expense_date}
                  onChange={(event) => setForm((current) => ({ ...current, expense_date: event.target.value }))}
                  required
                  style={{ display: 'block', width: '100%', marginTop: '0.25rem', padding: '0.5rem' }}
                />
              </label>

              <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', marginBottom: '1rem', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>Total expense:</strong>
                  <span>{formatMoneyGhs(Number(form.amount) || 0)}</span>
                </div>
              </div>

              <button
                type="submit"
                className="button button--primary"
                disabled={submitting}
                style={{ width: '100%' }}
              >
                {submitting ? 'Creating Expense...' : 'Create Expense'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </article>
  )
}
