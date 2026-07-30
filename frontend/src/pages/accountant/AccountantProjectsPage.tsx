import { useEffect, useState } from 'react'
import { EmptyState } from '../../components/EmptyState'
import { Modal } from '../../components/Modal'
import { formatMoneyGhs } from '../../lib/formatMoney'
import { createRecord, fetchAccounts, getRecords } from '../../lib/rpc/accountant'
import '../../styles/executive-dashboard.css'

interface ProjectSummary {
  project_id?: string
  id?: string
  name?: string | null
  customer_id?: string | null
  contract_value?: number | null
  expected_completion?: string | null
  status?: string | null
}

interface Customer {
  customer_id?: string
  id?: string
  name?: string | null
}

interface Employee {
  employee_id?: string
  id?: string
  full_name?: string | null
  role?: string | null
}

interface AccountSelect {
  account_id?: string
  id?: string
  name?: string | null
  reporting_group?: string | null
  type?: string | null
  is_postable?: boolean | null
}

interface ProjectFormState {
  name: string
  client_id: string
  contract_value: string
  project_manager_id: string
  expected_completion: string
  revenue_account_id: string
  labour: string
  materials: string
  fuel: string
  transport: string
  subcontractors: string
  miscellaneous: string
}

const emptyForm = (): ProjectFormState => ({
  name: '',
  client_id: '',
  contract_value: '',
  project_manager_id: '',
  expected_completion: '',
  revenue_account_id: '',
  labour: '0',
  materials: '0',
  fuel: '0',
  transport: '0',
  subcontractors: '0',
  miscellaneous: '0',
})

export function AccountantProjectsPage() {
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [accounts, setAccounts] = useState<AccountSelect[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<ProjectFormState>(emptyForm())

  useEffect(() => {
    void loadPageData()
  }, [])

  async function loadPageData() {
    setLoading(true)
    setError(null)
    setFormError(null)
    setSuccessMessage(null)

    const [projectsResult, customersResult, employeesResult, accountsResult] = await Promise.all([
      getRecords<ProjectSummary[]>('projects', 1, 100),
      getRecords<Customer[]>('customers', 1, 100),
      getRecords<Employee[]>('employees', 1, 100),
      fetchAccounts(),
    ])

    if (!projectsResult.ok) {
      setError(projectsResult.error)
      setProjects([])
    } else {
      setProjects(projectsResult.data)
    }

    if (!customersResult.ok) {
      setError((prev) => prev ? `${prev}; ${customersResult.error}` : customersResult.error)
      setCustomers([])
    } else {
      setCustomers(customersResult.data)
    }

    let employeeRows: Employee[] = []
    if (!employeesResult.ok) {
      setError((prev) => prev ? `${prev}; ${employeesResult.error}` : employeesResult.error)
    } else {
      employeeRows = employeesResult.data
      const projectManagers = employeeRows.filter((employee) => employee.role === 'ProjectManager')
      setEmployees(projectManagers.length ? projectManagers : employeeRows)
    }

    if (!accountsResult.ok) {
      setError((prev) => prev ? `${prev}; ${accountsResult.error}` : accountsResult.error)
      setAccounts([])
    } else {
      setAccounts(accountsResult.data.filter((acc) => acc.type === 'Income' && acc.is_postable !== false))
    }

    setLoading(false)
  }

  async function refreshProjects() {
    const result = await getRecords<ProjectSummary[]>('projects', 1, 100)
    if (result.ok) {
      setProjects(result.data)
    } else {
      setError(result.error)
    }
  }

  function updateField(field: keyof ProjectFormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setSuccessMessage(null)

    if (!form.name.trim()) {
      setFormError('Project name is required')
      return
    }
    if (!form.client_id) {
      setFormError('Client is required')
      return
    }
    const contractValue = Number(form.contract_value)
    if (Number.isNaN(contractValue) || contractValue <= 0) {
      setFormError('Contract value must be a number greater than 0')
      return
    }
    if (!form.revenue_account_id) {
      setFormError('Revenue account is required')
      return
    }

    setSubmitting(true)

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      client_id: form.client_id,
      contract_value: contractValue,
      revenue_account_id: form.revenue_account_id,
      budget: {
        labour: Number(form.labour) || 0,
        materials: Number(form.materials) || 0,
        fuel: Number(form.fuel) || 0,
        transport: Number(form.transport) || 0,
        subcontractors: Number(form.subcontractors) || 0,
        miscellaneous: Number(form.miscellaneous) || 0,
      },
    }

    if (form.project_manager_id) {
      payload.project_manager_id = form.project_manager_id
    }
    if (form.expected_completion) {
      payload.expected_completion = form.expected_completion
    }

    const result = await createRecord('projects', payload)
    if (result.ok) {
      setSuccessMessage(`Project ${form.name.trim()} created successfully.`)
      setForm(emptyForm())
      setShowModal(false)
      await refreshProjects()
    } else {
      setFormError(result.error)
    }

    setSubmitting(false)
  }

  const accountOptions = accounts.map((account) => ({
    value: account.account_id ?? account.id ?? '',
    label: `${account.reporting_group ?? 'Other'} — ${account.name ?? 'Unnamed account'}`,
  }))

  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Project Management</p>
          <h1>Projects</h1>
          <p>Create and manage projects for the business.</p>
        </div>
      </header>

      <section className="users-card">
        <div className="users-card__header">
          <div>
            <h2>Active projects</h2>
            <p>Projects created in the system. Use the button below to add a new project.</p>
          </div>
          <div className="users-card__actions">
            <button type="button" className="button button--secondary" onClick={() => void refreshProjects()}>Refresh</button>
            <button type="button" className="button button--primary" onClick={() => { setForm(emptyForm()); setFormError(null); setSuccessMessage(null); setShowModal(true) }}>New Project</button>
          </div>
        </div>

        {loading ? (
          <div className="exec-dash__state-card"><h2 className="exec-dash__state-title">Loading projects</h2><p className="exec-dash__state-message">Fetching projects, customers, employees, and accounts...</p></div>
        ) : error ? (
          <div className="exec-dash__state-card exec-dash__state-card--error"><h2 className="exec-dash__state-title">Unable to load</h2><p className="exec-dash__state-message">{error}</p></div>
        ) : !projects.length ? (
          <EmptyState
            icon="📁"
            title="No projects found"
            description="Create a project to begin tracking revenue and budget."
          />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Contract value</th>
                  <th>Expected completion</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.project_id ?? project.id}>
                    <td>{project.name ?? '—'}</td>
                    <td>{project.customer_id ?? '—'}</td>
                    <td>{typeof project.contract_value === 'number' ? formatMoneyGhs(project.contract_value) : '—'}</td>
                    <td>{project.expected_completion ?? '—'}</td>
                    <td>{project.status ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="New Project"
        subtitle="Create a new project record for revenue and budget tracking."
        maxWidth={860}
        footer={(
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="summary-box" style={{ minWidth: 200 }}>
              <div className="summary-box__row summary-box__row--total">
                <strong>Contract value</strong>
                <span>{formatMoneyGhs(Number(form.contract_value) || 0)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button type="button" className="button button--secondary" onClick={() => setShowModal(false)} disabled={submitting}>Cancel</button>
              <button type="submit" form="new-project-form" className="button button--primary" disabled={submitting}>{submitting ? 'Creating…' : 'Create project'}</button>
            </div>
          </div>
        )}
      >
        <form id="new-project-form" onSubmit={handleSubmit}>
          {formError && <div className="exec-dash__state-card exec-dash__state-card--error exec-dash__state-card--inline"><h2 className="exec-dash__state-title">Error</h2><p className="exec-dash__state-message">{formError}</p></div>}
          {successMessage && <div className="exec-dash__state-card exec-dash__state-card--success exec-dash__state-card--inline"><h2 className="exec-dash__state-title">Success</h2><p className="exec-dash__state-message">{successMessage}</p></div>}

          <div className="form-grid">
            <div className="form-field form-field--full">
              <label className="form-field__label" htmlFor="project-name">Project name</label>
              <input
                id="project-name"
                className="form-field__input"
                type="text"
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-field__label" htmlFor="client-id">Client</label>
              <select
                id="client-id"
                className="form-field__input"
                value={form.client_id}
                onChange={(event) => updateField('client_id', event.target.value)}
                required
              >
                <option value="">Select a client</option>
                {customers.map((customer) => (
                  <option key={customer.customer_id ?? customer.id} value={customer.customer_id ?? customer.id ?? ''}>
                    {customer.name ?? 'Unnamed customer'}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-field__label" htmlFor="contract-value">Contract value</label>
              <input
                id="contract-value"
                className="form-field__input"
                type="number"
                min="0"
                step="0.01"
                value={form.contract_value}
                onChange={(event) => updateField('contract_value', event.target.value)}
                required
              />
            </div>

            <div className="form-field">
              <label className="form-field__label" htmlFor="project-manager-id">Project Manager</label>
              <select
                id="project-manager-id"
                className="form-field__input"
                value={form.project_manager_id}
                onChange={(event) => updateField('project_manager_id', event.target.value)}
              >
                <option value="">Select a project manager (optional)</option>
                {employees.map((employee) => (
                  <option key={employee.employee_id ?? employee.id} value={employee.employee_id ?? employee.id ?? ''}>
                    {employee.full_name ?? 'Unnamed employee'}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label className="form-field__label" htmlFor="expected-completion">Expected completion</label>
              <input
                id="expected-completion"
                className="form-field__input"
                type="date"
                value={form.expected_completion}
                onChange={(event) => updateField('expected_completion', event.target.value)}
              />
            </div>

            <div className="form-field form-field--full">
              <label className="form-field__label" htmlFor="revenue-account-id">Revenue account</label>
              <select
                id="revenue-account-id"
                className="form-field__input"
                value={form.revenue_account_id}
                onChange={(event) => updateField('revenue_account_id', event.target.value)}
                required
              >
                <option value="">Select a revenue account</option>
                {accountOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <fieldset className="form-fieldset form-field--full">
              <legend className="form-fieldset__legend">Budget breakdown</legend>
              <div className="form-grid">
                {[
                  { name: 'labour', label: 'Labour' },
                  { name: 'materials', label: 'Materials' },
                  { name: 'fuel', label: 'Fuel' },
                  { name: 'transport', label: 'Transport' },
                  { name: 'subcontractors', label: 'Subcontractors' },
                  { name: 'miscellaneous', label: 'Miscellaneous' },
                ].map((field) => (
                  <div className="form-field" key={field.name}>
                    <label className="form-field__label" htmlFor={field.name}>{field.label}</label>
                    <input
                      id={field.name}
                      className="form-field__input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={(form as any)[field.name]}
                      onChange={(event) => updateField(field.name as keyof ProjectFormState, event.target.value)}
                    />
                  </div>
                ))}
              </div>
            </fieldset>
          </div>
        </form>
      </Modal>
    </article>
  )
}
