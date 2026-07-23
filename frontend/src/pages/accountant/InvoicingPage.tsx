import { useEffect, useState } from 'react'
import { formatMoneyGhs } from '../../lib/formatMoney'
import { invoiceCreate, fetchTaxRates, type TaxRates } from '../../lib/rpc/accountant'
import { supabase } from '../../lib/supabase'
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

function mapRates(rows: Array<{ tax_type?: string | null; rate?: number | null }>): TaxRates {
  return rows.reduce((acc, row) => {
    if (row.tax_type && typeof row.rate === 'number') {
      acc[row.tax_type] = row.rate
    }
    return acc
  }, {} as TaxRates)
}

export function InvoicingPage() {
  const [form, setForm] = useState<InvoiceFormState>(emptyForm())
  const [customers, setCustomers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [taxRates, setTaxRates] = useState<TaxRates>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{
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
      const customersData = Array.isArray(customersResult.data)
        ? customersResult.data
        : customersResult.data?.rows || customersResult.data?.data || []
      setCustomers(customersData)
    }

    if ('error' in projectsResult && projectsResult.error) {
      setError((current) => current ? `${current}; Failed to load projects: ${projectsResult.error.message}` : `Failed to load projects: ${projectsResult.error.message}`)
    } else {
      const projectsData = Array.isArray(projectsResult.data)
        ? projectsResult.data
        : projectsResult.data?.rows || projectsResult.data?.data || []
      setProjects(projectsData)
    }

    if (!taxResult.ok) {
      setError((current) => current ? `${current}; Failed to load tax rates: ${taxResult.error}` : `Failed to load tax rates: ${taxResult.error}`)
    } else {
      setTaxRates(mapRates(taxResult.data))
    }

    setLoading(false)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    if (!form.customer_id) {
      setError('Customer is required')
      setSubmitting(false)
      return
    }

    if (!form.project_id) {
      setError('Project is required')
      setSubmitting(false)
      return
    }

    if (!form.line_items.some((item) => item.description && item.amount)) {
      setError('At least one line item with description and amount is required')
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
    } else {
      setError(result.error)
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
            {error && <div className="exec-dash__state-card exec-dash__state-card--error" style={{ marginBottom: '1rem' }}>
              <h2 className="exec-dash__state-title">Error</h2>
              <p className="exec-dash__state-message">{error}</p>
            </div>}

            {success && <div className="exec-dash__state-card" style={{ marginBottom: '1rem', borderLeft: '4px solid #22c55e' }}>
              <h2 className="exec-dash__state-title">Invoice Created</h2>
              <p className="exec-dash__state-message">
                Invoice: <strong>{success.invoice_id}</strong>
                <br />
                Journal ID (audit trail): <strong>{success.journal_id}</strong>
                <br />
                Amount Due: <strong>{formatMoneyGhs(success.amount_due || 0)}</strong>
                {success.vat != null && (
                  <><br />VAT: <strong>{formatMoneyGhs(success.vat)}</strong></>
                )}
                {success.nhil != null && (
                  <><br />NHIL: <strong>{formatMoneyGhs(success.nhil)}</strong></>
                )}
                {success.getfund != null && (
                  <><br />GETFund: <strong>{formatMoneyGhs(success.getfund)}</strong></>
                )}
                {success.functional_amount != null && (
                  <><br />Functional amount: <strong>{formatMoneyGhs(success.functional_amount)}</strong></>
                )}
              </p>
            </div>}

            <form onSubmit={(event) => void handleSubmit(event)}>
              <label style={{ marginBottom: '1rem', display: 'block' }}>
                Customer *
                <select
                  value={form.customer_id}
                  onChange={(event) => setForm((current) => ({ ...current, customer_id: event.target.value }))}
                  required
                  style={{ display: 'block', width: '100%', marginTop: '0.25rem', padding: '0.5rem' }}
                >
                  <option value="">Select a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.customer_id || customer.id} value={customer.customer_id || customer.id}>
                      {customer.name || customer.customer_name || '—'}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ marginBottom: '1rem', display: 'block' }}>
                Project *
                <select
                  value={form.project_id}
                  onChange={(event) => setForm((current) => ({ ...current, project_id: event.target.value }))}
                  required
                  style={{ display: 'block', width: '100%', marginTop: '0.25rem', padding: '0.5rem' }}
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.project_id || project.id} value={project.project_id || project.id}>
                      {project.name || project.project_name || '—'}
                    </option>
                  ))}
                </select>
              </label>

              <fieldset style={{ marginBottom: '1rem', border: '1px solid #ccc', padding: '1rem' }}>
                <legend>Line Items *</legend>
                {form.line_items.map((item, index) => (
                  <div key={index} style={{ marginBottom: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 150px 50px', gap: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(event) => handleLineItemChange(index, 'description', event.target.value)}
                      style={{ padding: '0.5rem' }}
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={item.amount}
                      onChange={(event) => handleLineItemChange(index, 'amount', event.target.value)}
                      step="0.01"
                      min="0"
                      style={{ padding: '0.5rem' }}
                    />
                    <button
                      type="button"
                      className="button button--secondary"
                      onClick={() => removeLineItem(index)}
                      disabled={form.line_items.length === 1}
                      style={{ padding: '0.5rem', cursor: form.line_items.length === 1 ? 'not-allowed' : 'pointer' }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="button button--secondary"
                  onClick={addLineItem}
                  style={{ marginTop: '0.5rem' }}
                >
                  + Add Line Item
                </button>
              </fieldset>

              <fieldset style={{ marginBottom: '1rem', border: '1px solid #ccc', padding: '1rem' }}>
                <legend>Tax Toggles</legend>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={form.apply_vat}
                    onChange={(event) => setForm((current) => ({ ...current, apply_vat: event.target.checked }))}
                  />
                  {` ${vatLabel}`}
                </label>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={form.apply_nhil}
                    onChange={(event) => setForm((current) => ({ ...current, apply_nhil: event.target.checked }))}
                  />
                  {` ${nhilLabel}`}
                </label>
                <label style={{ display: 'block', marginBottom: '0' }}>
                  <input
                    type="checkbox"
                    checked={form.apply_getfund}
                    onChange={(event) => setForm((current) => ({ ...current, apply_getfund: event.target.checked }))}
                  />
                  {` ${getfundLabel}`}
                </label>
              </fieldset>

              <div style={{ padding: '1rem', backgroundColor: 'var(--color-bg-muted)', marginBottom: '1rem', borderRadius: '4px', color: 'var(--color-text)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>Subtotal:</strong>
                  <span>{formatMoneyGhs(subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>Tax preview:</strong>
                  <span>{formatMoneyGhs(taxAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2em', fontWeight: 'bold' }}>
                  <strong>Total (with taxes):</strong>
                  <span>{formatMoneyGhs(totalWithTaxes)}</span>
                </div>
              </div>

              <button
                type="submit"
                className="button button--primary"
                disabled={submitting}
                style={{ width: '100%' }}
              >
                {submitting ? 'Creating Invoice...' : 'Create Invoice'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </article>
  )
}
