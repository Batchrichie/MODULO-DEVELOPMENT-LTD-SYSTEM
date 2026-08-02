import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { createRecord, getRecords, updateRecord } from '../../lib/rpc/accountant'
import { Modal } from '../../components/Modal'
import { EmptyState } from '../../components/EmptyState'
import { SearchField } from '../../components/SearchField'
import '../../styles/executive-dashboard.css'

/** FE-8. `customers.contact_info` is a freeform jsonb column server-side (no
 * enforced sub-keys — see api.create_record/update_record) — email/phone/address
 * is this form's own convention, not a schema constraint. */
interface CustomerFormState {
  name: string
  email: string
  phone: string
  address: string
}

const emptyForm = (): CustomerFormState => ({ name: '', email: '', phone: '', address: '' })

interface ContactInfo {
  email?: string | null
  phone?: string | null
  address?: string | null
}

interface CustomerRecord {
  customer_id?: string
  id?: string
  name?: string | null
  contact_info?: ContactInfo | null
  created_at?: string | null
}

function formToContactInfo(form: CustomerFormState): ContactInfo | null {
  const info: ContactInfo = {}
  if (form.email) info.email = form.email
  if (form.phone) info.phone = form.phone
  if (form.address) info.address = form.address
  return Object.keys(info).length ? info : null
}

export function CustomerRecordsPage() {
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [form, setForm] = useState<CustomerFormState>(emptyForm())
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewingCustomer, setViewingCustomer] = useState<CustomerRecord | null>(null)

  useEffect(() => {
    void loadCustomers()
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

  async function loadCustomers() {
    setLoading(true)
    setError(null)

    const result = await getRecords<CustomerRecord[]>('customers', 1, 100)
    if (result.ok) {
      setCustomers(result.data)
    } else {
      setError(result.error)
      setCustomers([])
    }

    setLoading(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setFormError(null)

    if (!form.name.trim()) {
      setFormError('Name is required')
      setSubmitting(false)
      return
    }

    const payload: Record<string, unknown> = {
      name: form.name,
      contact_info: formToContactInfo(form),
    }

    const result = activeId
      ? await updateRecord('customers', activeId, payload)
      : await createRecord('customers', payload)

    if (result.ok) {
      setForm(emptyForm())
      setActiveId(null)
      setShowModal(false)
      await loadCustomers()
    } else {
      setFormError(result.error)
    }

    setSubmitting(false)
  }

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return customers

    return customers.filter((customer) => {
      const info = customer.contact_info ?? {}
      return (
        (customer.name ?? '').toLowerCase().includes(q) ||
        (info.email ?? '').toLowerCase().includes(q) ||
        (info.phone ?? '').toLowerCase().includes(q)
      )
    })
  }, [customers, searchQuery])

  function openEdit(customer: CustomerRecord) {
    const info = customer.contact_info ?? {}
    setActiveId(customer.customer_id ?? customer.id ?? null)
    setForm({
      name: customer.name ?? '',
      email: info.email ?? '',
      phone: info.phone ?? '',
      address: info.address ?? '',
    })
    setShowModal(true)
  }

  const content = () => {
    if (loading) {
      return (
        <div className="exec-dash__state-card"><h2 className="exec-dash__state-title">Loading customer records</h2><p className="exec-dash__state-message">The customer list is being fetched.</p></div>
      )
    }

    if (error) {
      return (
        <div className="exec-dash__state-card exec-dash__state-card--error"><h2 className="exec-dash__state-title">Unable to load customers</h2><p className="exec-dash__state-message">{error}</p></div>
      )
    }

    if (!customers.length) {
      return (
        <EmptyState
          icon="🧾"
          title="No customers found"
          description="No customer records are available yet. Click New customer to add your first client."
          action={<button type="button" className="button button--primary" onClick={() => { setActiveId(null); setForm(emptyForm()); setShowModal(true) }}>New customer</button>}
        />
      )
    }

    return (
      <div className="exec-dash__panel">
        <div className="registry-toolbar">
          <div className="registry-toolbar__search-row">
            <SearchField value={searchQuery} onChange={setSearchQuery} placeholder="Search by name, email, or phone…" />
          </div>
          <div className="registry-toolbar__actions">
            <button type="button" className="button button--secondary" onClick={() => void loadCustomers()}>Refresh</button>
            <button type="button" className="button button--primary" onClick={() => { setActiveId(null); setForm(emptyForm()); setShowModal(true) }}>New customer</button>
          </div>
        </div>

        {!filteredCustomers.length ? (
          <EmptyState
            icon="🔎"
            title="No matching customers"
            description={`No customers match "${searchQuery}". Try adjusting the search.`}
          />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => {
                  const info = customer.contact_info ?? {}
                  const key = customer.customer_id ?? customer.id ?? customer.name ?? Math.random()
                  return (
                    <tr key={key}>
                      <td><strong style={{ display: 'block' }}>{customer.name ?? '—'}</strong></td>
                      <td>{info.email ?? '—'}</td>
                      <td>{info.phone ?? '—'}</td>
                      <td>
                        <div className="data-table__actions">
                          <button type="button" className="button button--secondary" onClick={() => setViewingCustomer(customer)}>View</button>
                          <button type="button" className="button button--secondary" onClick={() => openEdit(customer)}>Edit</button>
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
          <p className="admin-dashboard__eyebrow">Contacts</p>
          <h1>Customer Records</h1>
          <p>Maintain the customer master list used across Invoicing and Project setup.</p>
        </div>
      </header>

      <section className="admin-dashboard__stats" aria-label="Customer metrics">
        <div className="stat-card"><div className="stat-card__icon stat-card__icon--blue"><span>Σ</span></div><div className="stat-card__content"><span>Total customers</span><strong>{String(customers.length)}</strong><small>Live list</small></div></div>
        <div className="stat-card"><div className="stat-card__icon stat-card__icon--purple"><span>⊘</span></div><div className="stat-card__content"><span>Missing contact info</span><strong>{String(customers.filter((c) => !c.contact_info || (!c.contact_info.email && !c.contact_info.phone)).length)}</strong><small>No email or phone on file</small></div></div>
      </section>

      <section className="users-card">
        <div className="users-card__header">
          <div>
            <h2>Customer Registry</h2>
            <p>View and manage customer contact information.</p>
          </div>
        </div>

        <div className="exec-dash__row">
          {content()}
        </div>
      </section>

      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setActiveId(null); setForm(emptyForm()) }}
        title={activeId ? 'Update customer' : 'New customer'}
        subtitle={activeId ? 'Update an existing customer record.' : 'Add a new customer to the master list.'}
        maxWidth={760}
        footer={(
          <>
            <button type="button" className="button button--secondary" onClick={() => { setShowModal(false); setActiveId(null); setForm(emptyForm()) }}>Cancel</button>
            <button type="submit" className="button button--primary" disabled={submitting} form="customer-form">
              {submitting ? 'Saving…' : activeId ? 'Save changes' : 'Create customer'}
            </button>
          </>
        )}
      >
        <form id="customer-form" onSubmit={(event) => void handleSubmit(event)}>
          {formError && <div className="exec-dash__state-card exec-dash__state-card--error exec-dash__state-card--inline"><h2 className="exec-dash__state-title">Error</h2><p className="exec-dash__state-message">{formError}</p></div>}
          <div className="form-grid">
            <label className="form-field form-field--full">
              <span className="form-field__label">Name *</span>
              <input
                value={form.name}
                placeholder="e.g. Golden Ridge Estates Ltd"
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </label>
            <label className="form-field">
              <span className="form-field__label">Email</span>
              <input
                type="email"
                value={form.email}
                placeholder="accounts@example.com"
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
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
            <label className="form-field form-field--full">
              <span className="form-field__label">Address</span>
              <input
                value={form.address}
                placeholder="e.g. 12 Independence Ave, Accra"
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              />
            </label>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!viewingCustomer}
        onClose={() => setViewingCustomer(null)}
        title="Customer details"
        subtitle="Read-only view — use Edit to make changes."
        maxWidth={760}
        footer={(
          <>
            <button type="button" className="button button--secondary" onClick={() => setViewingCustomer(null)}>Close</button>
            <button
              type="button"
              className="button button--primary"
              onClick={() => {
                if (!viewingCustomer) return
                openEdit(viewingCustomer)
                setViewingCustomer(null)
              }}
            >
              Edit customer
            </button>
          </>
        )}
      >
        <div className="form-grid">
          <label className="form-field form-field--full"><span className="form-field__label">Name</span><input value={viewingCustomer?.name ?? ''} readOnly /></label>
          <label className="form-field"><span className="form-field__label">Email</span><input value={viewingCustomer?.contact_info?.email ?? '—'} readOnly /></label>
          <label className="form-field"><span className="form-field__label">Phone</span><input value={viewingCustomer?.contact_info?.phone ?? '—'} readOnly /></label>
          <label className="form-field form-field--full"><span className="form-field__label">Address</span><input value={viewingCustomer?.contact_info?.address ?? '—'} readOnly /></label>
        </div>
      </Modal>
    </article>
  )
}
