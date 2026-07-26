import { useEffect, useState } from 'react'
import { Modal } from '../../components/Modal'
import { formatMoneyGhs } from '../../lib/formatMoney'
import { invoiceCreate, fetchTaxRates, normalizeTaxRates, type TaxRates } from '../../lib/rpc/accountant'
import { supabase } from '../../lib/supabase'
import { unwrapRpcResponse } from '../../lib/common'
import '../../styles/executive-dashboard.css'

interface LineItem {
  description: string
  amount: number | ''
}

interface InvoiceFormState {
  customer_id: string
  project_id: string
  line_items: LineItem[]
  apply_vat: boolean
  apply_nhil: boolean
  apply_getfund: boolean
}

const emptyForm = (): InvoiceFormState => ({
  customer_id: '',
  project_id: '',
  line_items: [{ description: '', amount: '' }],
  apply_vat: false,
  apply_nhil: false,
  apply_getfund: false,
})

export function InvoicingPage() {
  const [form, setForm] = useState<InvoiceFormState>(emptyForm())
  const [customers, setCustomers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [taxRates, setTaxRates] = useState<TaxRates>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [_error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  const [_success, setSuccess] = useState<{
    invoice_id?: string
    journal_id?: string
    amount_due?: number
    vat?: number
    nhil?: number
    getfund?: number
    functional_amount?: number
  } | null>(null)

  useEffect(() => {
    void loadInitialData()
  }, [])

  async function loadInitialData() {
    setLoading(true)
    setError(null)

    const customersPromise = supabase.schema('api').rpc('get_records', { p_resource: 'customers', p_page: 1, p_limit: 100 })
    const projectsPromise = supabase.schema('api').rpc('get_records', { p_resource: 'projects', p_page: 1, p_limit: 100 })
    const taxPromise = fetchTaxRates()

    const [customersResult, projectsResult, taxResult] = await Promise.all([customersPromise, projectsPromise, taxPromise])

    if ('error' in customersResult && customersResult.error) {
      setError(`Failed to load customers: ${customersResult.error.message}`)
    } else {
      const unwrapped = unwrapRpcResponse(customersResult.data)
      if (!unwrapped.ok) {
        setError(`Failed to load customers: ${unwrapped.error}`)
        setCustomers([])
      } else {
        setCustomers(Array.isArray(unwrapped.value) ? unwrapped.value : [])
      }
    }

    if ('error' in projectsResult && projectsResult.error) {
      setError((current) => current ? `${current}; Failed to load projects: ${projectsResult.error.message}` : `Failed to load projects: ${projectsResult.error.message}`)
    } else {
      const unwrapped = unwrapRpcResponse(projectsResult.data)
      if (!unwrapped.ok) {
        setError((current) => current ? `${current}; Failed to load projects: ${unwrapped.error}` : `Failed to load projects: ${unwrapped.error}`)
        setProjects([])
      } else {
        setProjects(Array.isArray(unwrapped.value) ? unwrapped.value : [])
      }
    }

    if (!taxResult.ok) {
      setError((current) => current ? `${current}; Failed to load tax rates: ${taxResult.error}` : `Failed to load tax rates: ${taxResult.error}`)
    } else {
      setTaxRates(normalizeTaxRates(taxResult.data))
    }

    // recent invoices list removed (not part of this ticket)

    setLoading(false)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setFormError(null)
    setSuccess(null)

    if (!form.customer_id) {
      setFormError('Customer is required')
      setSubmitting(false)
      return
    }

    if (!form.project_id) {
      setFormError('Project is required')
      setSubmitting(false)
      return
    }

    if (!form.line_items.some((item) => item.description && item.amount)) {
      setFormError('At least one line item with description and amount is required')
      setSubmitting(false)
      return
    }

    const payload = {
      customer_id: form.customer_id,
      project_id: form.project_id,
      line_items: form.line_items
        .filter((item) => item.description && item.amount)
        .map((item) => ({
          description: item.description,
          amount: Number(item.amount),
        })),
      apply_vat: form.apply_vat,
      apply_nhil: form.apply_nhil,
      apply_getfund: form.apply_getfund,
    }

    const result = await invoiceCreate(payload)
    if (result.ok) {
      setSuccess({
        invoice_id: result.data.invoice_id ?? undefined,
        journal_id: result.data.journal_id ?? undefined,
        amount_due: result.data.amount_due ?? undefined,
        vat: result.data.vat ?? undefined,
        nhil: result.data.nhil ?? undefined,
        getfund: result.data.getfund ?? undefined,
        functional_amount: result.data.functional_amount ?? undefined,
      })
      setForm(emptyForm())
      setShowModal(false)
      setStatusMessage(`Invoice ${result.data.invoice_id ?? ''} created — ${formatMoneyGhs(result.data.amount_due ?? 0)}`)
    } else {
      setFormError(result.error)
    }

    setSubmitting(false)
  }

  function handleLineItemChange(index: number, field: keyof LineItem, value: string | number) {
    const newItems = [...form.line_items]
    newItems[index] = { ...newItems[index], [field]: value }
    setForm((current) => ({ ...current, line_items: newItems }))
  }

  function addLineItem() {
    setForm((current) => ({
      ...current,
      line_items: [...current.line_items, { description: '', amount: '' }],
    }))
  }

  function removeLineItem(index: number) {
    if (form.line_items.length > 1) {
      const newItems = form.line_items.filter((_, i) => i !== index)
      setForm((current) => ({ ...current, line_items: newItems }))
    }
  }

  const subtotal = form.line_items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  const vatRate = taxRates.VAT ?? 0
  const nhilRate = taxRates.NHIL ?? 0
  const getfundRate = taxRates.GETFund ?? 0
  const taxAmount = (form.apply_vat ? subtotal * vatRate : 0) + (form.apply_nhil ? subtotal * nhilRate : 0) + (form.apply_getfund ? subtotal * getfundRate : 0)
  const totalWithTaxes = subtotal + taxAmount

  const vatLabel = `Apply VAT (${(vatRate * 100).toFixed(2)}%)`
  const nhilLabel = `Apply NHIL (${(nhilRate * 100).toFixed(2)}%)`
  const getfundLabel = `Apply GETFund (${(getfundRate * 100).toFixed(2)}%)`

  if (loading) {
    return (
      <article className="admin-dashboard">
        <header className="admin-dashboard__header">
          <div>
            <p className="admin-dashboard__eyebrow">Invoicing & Expenses</p>
            <h1>Create Invoice</h1>
          </div>
        </header>
        <div className="exec-dash__state-card">
          <h2 className="exec-dash__state-title">Loading</h2>
          <p className="exec-dash__state-message">Fetching customers, projects, and tax rates...</p>
        </div>
      </article>
    )
  }

  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Invoicing & Expenses</p>
          <h1>Create Invoice</h1>
          <p>Post a customer invoice and trigger automatic journal entries.</p>
        </div>
      </header>

      <section className="users-card">
        <div className="users-card__header">
          <div>
            <h2>Invoice Details</h2>
            <p>Invoice number is auto-generated. Provide customer, project, and line items.</p>
          </div>
        </div>

        <div className="exec-dash__row">
          <div className="exec-dash__panel">
            {formError && <div className="exec-dash__state-card exec-dash__state-card--error exec-dash__state-card--inline"><h2 className="exec-dash__state-title">Error</h2><p className="exec-dash__state-message">{formError}</p></div>}

            {statusMessage && <div className="exec-dash__state-card exec-dash__state-card--success exec-dash__state-card--inline"><h2 className="exec-dash__state-title">Success</h2><p className="exec-dash__state-message">{statusMessage}</p></div>}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Invoices</h3>
              <div>
                <button type="button" className="button button--secondary" onClick={() => void loadInitialData()}>Refresh</button>{' '}
                <button type="button" className="button button--primary" onClick={() => { setForm(emptyForm()); setFormError(null); setShowModal(true) }}>New Invoice</button>
              </div>
            </div>
            <div className="exec-dash__state-card exec-dash__state-card--empty"><h2 className="exec-dash__state-title">Recent invoices hidden</h2><p className="exec-dash__state-message">Recent invoices list removed from this view.</p></div>

            <Modal
              open={showModal}
              onClose={() => setShowModal(false)}
              title="Create Invoice"
              subtitle="Provide customer, project, and line items."
              maxWidth={760}
              footer={(
                <>
                  <div className="summary-box" style={{ marginRight: '1rem' }}>
                    <div className="summary-box__row">
                      <strong>Subtotal:</strong>
                      <span>{formatMoneyGhs(subtotal)}</span>
                    </div>
                    <div className="summary-box__row">
                      <strong>Tax preview:</strong>
                      <span>{formatMoneyGhs(taxAmount)}</span>
                    </div>
                    <div className="summary-box__row summary-box__row--total">
                      <strong>Total (with taxes):</strong>
                      <span>{formatMoneyGhs(totalWithTaxes)}</span>
                    </div>
                  </div>
                  <div>
                    <button type="button" className="button button--secondary" onClick={() => setShowModal(false)}>Cancel</button>{' '}
                    <button type="submit" className="button button--primary" disabled={submitting} form="invoice-form">
                      {submitting ? 'Creating Invoice...' : 'Create Invoice'}
                    </button>
                  </div>
                </>
              )}
            >
              <form id="invoice-form" onSubmit={(event) => void handleSubmit(event)}>
                {formError && <div className="exec-dash__state-card exec-dash__state-card--error exec-dash__state-card--inline"><h2 className="exec-dash__state-title">Error</h2><p className="exec-dash__state-message">{formError}</p></div>}
                <div className="form-grid">
                  <label className="form-field">
                    <span className="form-field__label">Customer *</span>
                    <select
                      value={form.customer_id}
                      onChange={(event) => setForm((current) => ({ ...current, customer_id: event.target.value }))}
                      required
                    >
                      <option value="">Select a customer</option>
                      {customers.map((customer) => (
                        <option key={customer.customer_id || customer.id} value={customer.customer_id || customer.id}>
                          {customer.name || customer.customer_name || '—'}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-field">
                    <span className="form-field__label">Project *</span>
                    <select
                      value={form.project_id}
                      onChange={(event) => setForm((current) => ({ ...current, project_id: event.target.value }))}
                      required
                    >
                      <option value="">Select a project</option>
                      {projects.map((project) => (
                        <option key={project.project_id || project.id} value={project.project_id || project.id}>
                          {project.name || project.project_name || '—'}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <fieldset className="form-fieldset">
                  <legend className="form-fieldset__legend">Line Items *</legend>
                  {form.line_items.map((item, index) => (
                    <div key={index} className="invoice-line-items__row">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={(event) => handleLineItemChange(index, 'description', event.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Amount"
                        value={item.amount}
                        onChange={(event) => handleLineItemChange(index, 'amount', event.target.value)}
                        step="0.01"
                        min="0"
                      />
                      <button
                        type="button"
                        className="button button--secondary"
                        onClick={() => removeLineItem(index)}
                        disabled={form.line_items.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="button button--secondary invoice-line-items__add-btn"
                    onClick={addLineItem}
                  >
                    + Add Line Item
                  </button>
                </fieldset>

                <fieldset className="form-fieldset">
                  <legend className="form-fieldset__legend">Tax Toggles</legend>
                  <label className="form-fieldset__checkbox">
                    <input
                      type="checkbox"
                      checked={form.apply_vat}
                      onChange={(event) => setForm((current) => ({ ...current, apply_vat: event.target.checked }))}
                    />
                    {vatLabel}
                  </label>
                  <label className="form-fieldset__checkbox">
                    <input
                      type="checkbox"
                      checked={form.apply_nhil}
                      onChange={(event) => setForm((current) => ({ ...current, apply_nhil: event.target.checked }))}
                    />
                    {nhilLabel}
                  </label>
                  <label className="form-fieldset__checkbox">
                    <input
                      type="checkbox"
                      checked={form.apply_getfund}
                      onChange={(event) => setForm((current) => ({ ...current, apply_getfund: event.target.checked }))}
                    />
                    {getfundLabel}
                  </label>
                </fieldset>
              </form>
            </Modal>
          </div>
        </div>
      </section>
    </article>
  )
}


