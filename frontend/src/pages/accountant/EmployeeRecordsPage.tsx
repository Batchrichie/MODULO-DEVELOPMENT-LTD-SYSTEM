import { useEffect, useMemo, useState } from 'react'
import { createRecord, getRecords, updateRecord } from '../../lib/rpc/accountant'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Modal } from '../../components/Modal'
import { EmptyState } from '../../components/EmptyState'
import { SearchField } from '../../components/SearchField'
import { deriveStatusBadgeFromState, StatusBadge } from '../../components/StatusBadge'
import '../../styles/executive-dashboard.css'

interface EmployeeFormState {
  full_name: string
  email: string
  phone: string
  employment_status: 'Active' | 'Terminated'
  staff_category: 'Project' | 'Admin' | ''
}

const emptyForm = (): EmployeeFormState => ({
  full_name: '',
  email: '',
  phone: '',
  employment_status: 'Active',
  staff_category: '',
})

interface EmployeeRecord {
  employee_id?: string
  id?: string
  full_name?: string | null
  email?: string | null
  phone?: string | null
  employment_status?: string | null
  staff_category?: string | null
}

export function EmployeeRecordsPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [form, setForm] = useState<EmployeeFormState>(emptyForm())
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('__all__')
  const [viewingEmployee, setViewingEmployee] = useState<EmployeeRecord | null>(null)
  const [terminateTarget, setTerminateTarget] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    void loadEmployees()
  }, [])

  useEffect(() => {
    if (!showModal) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowModal(false)
        setActiveId(null)
        setForm(emptyForm())
      }
    }
    document.addEventListener('keydown', onKey)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = originalOverflow
    }
  }, [showModal])

  async function loadEmployees() {
    setLoading(true)
    setError(null)
    const result = await getRecords<EmployeeRecord[]>('employees', 1, 100)
    if (result.ok) {
      setEmployees(result.data)
    } else {
      setError(result.error)
      setEmployees([])
    }
    setLoading(false)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setFormError(null)

    const payload: Record<string, unknown> = {
      full_name: form.full_name,
      email: form.email,
      phone: form.phone,
      employment_status: form.employment_status,
      ...(form.staff_category ? { staff_category: form.staff_category } : {}),
    }

    const result = activeId
      ? await updateRecord('employees', activeId, payload)
      : await createRecord('employees', payload)

    if (result.ok) {
      setForm(emptyForm())
      setActiveId(null)
      setShowModal(false)
      await loadEmployees()
    } else {
      setFormError(result.error)
    }

    setSubmitting(false)
  }

  async function handleTerminateConfirm(_reason?: string) {
    if (!terminateTarget) return
    const result = await updateRecord('employees', terminateTarget.id, { employment_status: 'Terminated' })
    setTerminateTarget(null)
    if (result.ok) {
      await loadEmployees()
    } else {
      setError(result.error)
    }
  }

  const activeCount = useMemo(() => employees.filter((employee) => employee.employment_status === 'Active').length, [employees])

  const categories = useMemo(() => {
    const set = new Set<string>()
    employees.forEach((e) => { if (e.staff_category) set.add(String(e.staff_category)) })
    return Array.from(set).sort()
  }, [employees])

  const filteredEmployees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return employees.filter((employee) => {
      if (filterCategory !== '__all__' && (employee.staff_category ?? '') !== filterCategory) return false
      if (!q) return true
      return (
        (employee.full_name ?? '').toLowerCase().includes(q) ||
        (employee.email ?? '').toLowerCase().includes(q) ||
        (employee.phone ?? '').toLowerCase().includes(q) ||
        (employee.employment_status ?? '').toLowerCase().includes(q)
      )
    })
  }, [employees, searchQuery, filterCategory])

  const content = () => {
    if (loading) {
      return <div className="exec-dash__state-card"><h2 className="exec-dash__state-title">Loading employee records</h2><p className="exec-dash__state-message">The employee roster is being fetched.</p></div>
    }

    if (error) {
      return <div className="exec-dash__state-card exec-dash__state-card--error"><h2 className="exec-dash__state-title">Unable to load employees</h2><p className="exec-dash__state-message">{error}</p></div>
    }

    if (!employees.length) {
      return (
        <EmptyState
          icon="👥"
          title="No employees found"
          description="No employee records are available yet. Click New employee to add your first staff member."
          action={<button type="button" className="button button--primary" onClick={() => { setActiveId(null); setForm(emptyForm()); setShowModal(true) }}>New employee</button>}
        />
      )
    }

    return (
      <div className="exec-dash__panel">
        <div className="registry-toolbar">
          <div className="registry-toolbar__search-row">
            <SearchField value={searchQuery} onChange={setSearchQuery} placeholder="Search by name, email, or phone…" />
            <label className="form-field" style={{ margin: 0, width: '100%', minWidth: 0 }}>
              <select
                value={filterCategory}
                onChange={(event) => setFilterCategory(event.target.value)}
              >
                <option value="__all__">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="registry-toolbar__actions">
            <button
              type="button"
              className="button button--secondary"
              disabled
              title="Export CSV — pending report RPC"
            >
              Export
            </button>
            <button type="button" className="button button--secondary" onClick={() => void loadEmployees()}>Refresh</button>
            <button type="button" className="button button--primary" onClick={() => { setActiveId(null); setForm(emptyForm()); setShowModal(true) }}>New employee</button>
          </div>
        </div>

        {!filteredEmployees.length ? (
          <EmptyState
            icon="🔎"
            title="No matching employees"
            description={`No employees match the current search/filter (${searchQuery || '—'} / ${filterCategory === '__all__' ? 'All categories' : filterCategory}). Try adjusting the query.`}
          />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Category</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => {
                  const statusBadge = deriveStatusBadgeFromState(employee.employment_status ?? 'Unknown')
                  const catBadge = employee.staff_category
                    ? { label: employee.staff_category, tone: 'info' as const }
                    : { label: 'Unclassified', tone: 'muted' as const }
                  return (
                    <tr key={employee.employee_id ?? employee.id ?? employee.email ?? employee.full_name} className={employee.employment_status === 'Terminated' ? 'data-table__row--muted' : ''}>
                      <td>
                        <strong style={{ display: 'block' }}>{employee.full_name ?? '—'}</strong>
                      </td>
                      <td>{employee.email ?? '—'}</td>
                      <td>{employee.phone ?? '—'}</td>
                      <td className="data-table__cell--status">
                        <StatusBadge label={statusBadge.label} tone={statusBadge.tone} />
                      </td>
                      <td className="data-table__cell--status">
                        <StatusBadge label={catBadge.label} tone={catBadge.tone} />
                      </td>
                      <td>
                        <div className="data-table__actions">
                          <button type="button" className="button button--secondary" onClick={() => setViewingEmployee(employee)}>View</button>
                          <button
                            type="button"
                            className="button button--secondary"
                            onClick={() => {
                              setActiveId(employee.employee_id ?? employee.id ?? null)
                              setForm({
                                full_name: employee.full_name ?? '',
                                email: employee.email ?? '',
                                phone: employee.phone ?? '',
                                employment_status: (employee.employment_status as 'Active' | 'Terminated') ?? 'Active',
                                staff_category: (employee.staff_category as 'Project' | 'Admin' | '') ?? '',
                              })
                              setShowModal(true)
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="button button--secondary"
                            onClick={() => setTerminateTarget({
                              id: employee.employee_id ?? employee.id ?? '',
                              name: employee.full_name ?? '(unnamed)',
                            })}
                            disabled={employee.employment_status === 'Terminated'}
                          >
                            Terminate
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )
  }

  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Payroll &amp; HR</p>
          <h1>Employee Records</h1>
          <p>Maintain employee master data for payroll eligibility and staffing classification.</p>
        </div>
      </header>

      <section className="admin-dashboard__stats" aria-label="Employee metrics">
        <div className="stat-card"><div className="stat-card__icon stat-card__icon--blue"><span>Σ</span></div><div className="stat-card__content"><span>Total employees</span><strong>{String(employees.length)}</strong><small>Live roster</small></div></div>
        <div className="stat-card"><div className="stat-card__icon stat-card__icon--green"><span>✓</span></div><div className="stat-card__content"><span>Active employees</span><strong>{String(activeCount)}</strong><small>Payroll eligible</small></div></div>
        <div className="stat-card"><div className="stat-card__icon stat-card__icon--purple"><span>⊘</span></div><div className="stat-card__content"><span>Unclassified</span><strong>{String(employees.filter((e) => !e.staff_category).length)}</strong><small>Needs category</small></div></div>
      </section>

      <section className="users-card">
        <div className="users-card__header">
          <div>
            <h2>Employee Registry</h2>
            <p>Records use the generic resource pattern and expose `employment_status` and `staff_category` for payroll processing.</p>
          </div>
        </div>

        <div className="exec-dash__row">
          {content()}
        </div>
      </section>

      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setActiveId(null); setForm(emptyForm()) }}
        title={activeId ? 'Update employee' : 'New employee'}
        subtitle={activeId ? 'Update an existing employee record.' : 'Onboard a new employee into the payroll roster.'}
        maxWidth={760}
        footer={(
          <>
            <button type="button" className="button button--secondary" onClick={() => { setShowModal(false); setActiveId(null); setForm(emptyForm()) }}>Cancel</button>
            <button type="submit" className="button button--primary" disabled={submitting} form="employee-form">
              {submitting ? 'Saving…' : activeId ? 'Save changes' : 'Create employee'}
            </button>
          </>
        )}
      >
        <form id="employee-form" onSubmit={(event) => void handleSubmit(event)}>
          {formError && <div className="exec-dash__state-card exec-dash__state-card--error exec-dash__state-card--inline"><h2 className="exec-dash__state-title">Error</h2><p className="exec-dash__state-message">{formError}</p></div>}
          <div className="form-grid">
            <label className="form-field form-field--full">
              <span className="form-field__label">Full name</span>
              <input
                value={form.full_name}
                placeholder="e.g. Ama Serwaa"
                onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
                required
              />
            </label>
            <label className="form-field">
              <span className="form-field__label">Email</span>
              <input
                type="email"
                value={form.email}
                placeholder="ama@example.com"
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
            </label>
            <label className="form-field">
              <span className="form-field__label">Phone</span>
              <input
                value={form.phone}
                placeholder="e.g. +233 24 000 0000"
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              />
            </label>
            <label className="form-field">
              <span className="form-field__label">Employment status</span>
              <select value={form.employment_status} onChange={(event) => setForm((current) => ({ ...current, employment_status: event.target.value as 'Active' | 'Terminated' }))} required>
                <option value="Active">Active</option>
                <option value="Terminated">Terminated</option>
              </select>
            </label>
            <label className="form-field">
              <span className="form-field__label">Staff category</span>
              <select value={form.staff_category} onChange={(event) => setForm((current) => ({ ...current, staff_category: event.target.value as 'Project' | 'Admin' | '' }))}>
                <option value="">Select category</option>
                <option value="Project">Project</option>
                <option value="Admin">Admin</option>
              </select>
            </label>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!viewingEmployee}
        onClose={() => setViewingEmployee(null)}
        title="Employee details"
        subtitle="Read-only view — use Edit to make changes."
        maxWidth={760}
        footer={(
          <>
            <button type="button" className="button button--secondary" onClick={() => setViewingEmployee(null)}>Close</button>
            <button
              type="button"
              className="button button--primary"
              onClick={() => {
                const e = viewingEmployee
                if (!e) return
                setActiveId(e.employee_id ?? e.id ?? null)
                setForm({
                  full_name: e.full_name ?? '',
                  email: e.email ?? '',
                  phone: e.phone ?? '',
                  employment_status: (e.employment_status as 'Active' | 'Terminated') ?? 'Active',
                  staff_category: (e.staff_category as 'Project' | 'Admin' | '') ?? '',
                })
                setViewingEmployee(null)
                setShowModal(true)
              }}
            >
              Edit employee
            </button>
          </>
        )}
      >
        <div className="form-grid">
          <label className="form-field form-field--full"><span className="form-field__label">Full name</span><input value={viewingEmployee?.full_name ?? ''} readOnly /></label>
          <label className="form-field"><span className="form-field__label">Email</span><input value={viewingEmployee?.email ?? ''} readOnly /></label>
          <label className="form-field"><span className="form-field__label">Phone</span><input value={viewingEmployee?.phone ?? ''} readOnly /></label>
          <label className="form-field"><span className="form-field__label">Employment status</span>
            <div style={{ padding: '0.875rem 1rem' }}>
              <StatusBadge
                label={viewingEmployee?.employment_status ?? 'Unknown'}
                tone={deriveStatusBadgeFromState(viewingEmployee?.employment_status ?? 'Unknown').tone}
              />
            </div>
          </label>
          <label className="form-field"><span className="form-field__label">Staff category</span>
            <div style={{ padding: '0.875rem 1rem' }}>
              <StatusBadge
                label={viewingEmployee?.staff_category ?? 'Unclassified'}
                tone={viewingEmployee?.staff_category ? 'info' : 'muted'}
              />
            </div>
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!terminateTarget}
        onClose={() => setTerminateTarget(null)}
        onConfirm={(reason) => void handleTerminateConfirm(reason)}
        tone="danger"
        iconGlyph="⚠"
        title="Terminate this employee?"
        description={`Terminating “${terminateTarget?.name ?? ''}” marks their employment status as Terminated. They will no longer appear in active payroll runs but remain available for historical reporting.`}
        requireReason
        reasonLabel="Reason for termination (required)"
        reasonPlaceholder="e.g. Resignation, end of contract, redundancy…"
        confirmLabel="Terminate employment"
        cancelLabel="Keep employed"
        confirmingLabel="Processing…"
      />
    </article>
  )
}
