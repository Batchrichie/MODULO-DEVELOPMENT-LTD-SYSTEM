import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { createRecord, getRecords, updateRecord } from '../../lib/rpc/accountant'
import { Modal } from '../../components/Modal'
import { EmptyState } from '../../components/EmptyState'
import { SearchField } from '../../components/SearchField'
import '../../styles/executive-dashboard.css'

interface SupplierFormState {
  name: string
  email: string
  phone: string
  address: string
}

const emptyForm = (): SupplierFormState => ({ name: '', email: '', phone: '', address: '' })

interface ContactInfo {
  email?: string | null
  phone?: string | null
  address?: string | null
}

interface SupplierRecord {
  supplier_id?: string
  id?: string
  name?: string | null
  contact_info?: ContactInfo | null
  created_at?: string | null
}

function formToContactInfo(form: SupplierFormState): ContactInfo | null {
  const info: ContactInfo = {}
  if (form.email) info.email = form.email
  if (form.phone) info.phone = form.phone
  if (form.address) info.address = form.address
  return Object.keys(info).length ? info : null
}

export function SupplierRecordsPage() {
  const [suppliers, setSuppliers] = useState<SupplierRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [form, setForm] = useState<SupplierFormState>(emptyForm())
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewingSupplier, setViewingSupplier] = useState<SupplierRecord | null>(null)

  useEffect(() => {
    void loadSuppliers()
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

  async function loadSuppliers() {
    setLoading(true)
    setError(null)

    const result = await getRecords<SupplierRecord[]>('suppliers', 1, 100)
    if (result.ok) {
      setSuppliers(result.data)
    } else {
      setError(result.error)
      setSuppliers([])
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
      ? await updateRecord('suppliers', activeId, payload)
      : await createRecord('suppliers', payload)

    if (result.ok) {
      setForm(emptyForm())
      setActiveId(null)
      setShowModal(false)
      await loadSuppliers()
    } else {
      setFormError(result.error)
    }

    setSubmitting(false)
  }

  const filteredSuppliers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return suppliers

    return suppliers.filter((supplier) => {
      const info = supplier.contact_info ?? {}
      return (
        (supplier.name ?? '').toLowerCase().includes(q) ||
        (info.email ?? '').toLowerCase().includes(q) ||
        (info.phone ?? '').toLowerCase().includes(q)
      )
    })
  }, [suppliers, searchQuery])

  function openEdit(supplier: SupplierRecord) {
    const info = supplier.contact_info ?? {}
    setActiveId(supplier.supplier_id ?? supplier.id ?? null)
    setForm({
      name: supplier.name ?? '',
      email: info.email ?? '',
      phone: info.phone ?? '',
      address: info.address ?? '',
    })
    setShowModal(true)
  }

  const content = () => {
    if (loading) {
      return (
        <div className="exec-dash__state-card"><h2 className="exec-dash__state-title">Loading supplier records</h2><p className="exec-dash__state-message">The supplier list is being fetched.</p></div>
      )
    }

    if (error) {
      return (
        <div className="exec-dash__state-card exec-dash__state-card--error"><h2 className="exec-dash__state-title">Unable to load suppliers</h2><p className="exec-dash__state-message">{error}</p></div>
      )
    }

    if (!suppliers.length) {
      return (
        <EmptyState
          icon="📦"
          title="No suppliers found"
          description="No supplier records are available yet. Click New supplier to add the first vendor."
          action={<button type="button" className="button button--primary" onClick={() => { setActiveId(null); setForm(emptyForm()); setShowModal(true) }}>New supplier</button>}
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
            <button type="button" className="button button--secondary" onClick={() => void loadSuppliers()}>Refresh</button>
            <button type="button" className="button button--primary" onClick={() => { setActiveId(null); setForm(emptyForm()); setShowModal(true) }}>New supplier</button>
          </div>
        </div>

        {!filteredSuppliers.length ? (
          <EmptyState
            icon="🔎"
            title="No matching suppliers"
            description={`No suppliers match "${searchQuery}". Try adjusting the search.`}
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
                {filteredSuppliers.map((supplier) => {
                  const info = supplier.contact_info ?? {}
                  const key = supplier.supplier_id ?? supplier.id ?? supplier.name ?? Math.random()
                  return (
                    <tr key={key}>
                      <td><strong style={{ display: 'block' }}>{supplier.name ?? '—'}</strong></td>
                      <td>{info.email ?? '—'}</td>
                      <td>{info.phone ?? '—'}</td>
                      <td>
                        <div className="data-table__actions">
                          <button type="button" className="button button--secondary" onClick={() => setViewingSupplier(supplier)}>View</button>
                          <button type="button" className="button button--secondary" onClick={() => openEdit(supplier)}>Edit</button>
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
          <h1>Supplier Records</h1>
          <p>Maintain the supplier master list used across purchases and vendor payments.</p>
        </div>
      </header>

      <section className="admin-dashboard__stats" aria-label="Supplier metrics">
        <div className="stat-card"><div className="stat-card__icon stat-card__icon--blue"><span>Σ</span></div><div className="stat-card__content"><span>Total suppliers</span><strong>{String(suppliers.length)}</strong><small>Live list</small></div></div>
        <div className="stat-card"><div className="stat-card__icon stat-card__icon--purple"><span>⊘</span></div><div className="stat-card__content"><span>Missing contact info</span><strong>{String(suppliers.filter((s) => !s.contact_info || (!s.contact_info.email && !s.contact_info.phone)).length)}</strong><small>No email or phone on file</small></div></div>
      </section>

      <section className="users-card">
        <div className="users-card__header">
          <div>
            <h2>Supplier Registry</h2>
            <p>View and manage supplier contact information.</p>
          </div>
        </div>

        <div className="exec-dash__row">
          {content()}
        </div>
      </section>

      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setActiveId(null); setForm(emptyForm()) }}
        title={activeId ? 'Update supplier' : 'New supplier'}
        subtitle={activeId ? 'Update an existing supplier record.' : 'Add a new supplier to the master list.'}
        maxWidth={760}
        footer={(
          <>
            <button type="button" className="button button--secondary" onClick={() => { setShowModal(false); setActiveId(null); setForm(emptyForm()) }}>Cancel</button>
            <button type="submit" className="button button--primary" disabled={submitting} form="supplier-form">
              {submitting ? 'Saving…' : activeId ? 'Save changes' : 'Create supplier'}
            </button>
          </>
        )}
      >
        <form id="supplier-form" onSubmit={(event) => void handleSubmit(event)}>
          {formError && <div className="exec-dash__state-card exec-dash__state-card--error exec-dash__state-card--inline"><h2 className="exec-dash__state-title">Error</h2><p className="exec-dash__state-message">{formError}</p></div>}
          <div className="form-grid">
            <label className="form-field form-field--full">
              <span className="form-field__label">Name *</span>
              <input
                value={form.name}
                placeholder="e.g. Kwabena Supplies Ltd"
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </label>
            <label className="form-field">
              <span className="form-field__label">Email</span>
              <input
                type="email"
                value={form.email}
                placeholder="purchases@example.com"
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
                placeholder="e.g. 3 Industrial Road, Accra"
                onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
              />
            </label>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!viewingSupplier}
        onClose={() => setViewingSupplier(null)}
        title="Supplier details"
        subtitle="Read-only view — use Edit to make changes."
        maxWidth={760}
        footer={(
          <>
            <button type="button" className="button button--secondary" onClick={() => setViewingSupplier(null)}>Close</button>
            <button
              type="button"
              className="button button--primary"
              onClick={() => {
                if (!viewingSupplier) return
                openEdit(viewingSupplier)
                setViewingSupplier(null)
              }}
            >
              Edit supplier
            </button>
          </>
        )}
      >
        <div className="form-grid">
          <label className="form-field form-field--full"><span className="form-field__label">Name</span><input value={viewingSupplier?.name ?? ''} readOnly /></label>
          <label className="form-field"><span className="form-field__label">Email</span><input value={viewingSupplier?.contact_info?.email ?? '—'} readOnly /></label>
          <label className="form-field"><span className="form-field__label">Phone</span><input value={viewingSupplier?.contact_info?.phone ?? '—'} readOnly /></label>
          <label className="form-field form-field--full"><span className="form-field__label">Address</span><input value={viewingSupplier?.contact_info?.address ?? '—'} readOnly /></label>
        </div>
      </Modal>
    </article>
  )
}
