import { useEffect, useState } from 'react'
import { formatMoneyGhs } from '../../lib/formatMoney'
import { paymentReceivedCreate } from '../../lib/rpc/accountant'
import { supabase } from '../../lib/supabase'
import '../../styles/executive-dashboard.css'

interface CustomerPaymentFormState {
  customer_id: string
  invoice_id: string
  amount: number | ''
  payment_date: string
}

const emptyForm = (): CustomerPaymentFormState => {
  const today = new Date().toISOString().split('T')[0]
  return {
    customer_id: '',
    invoice_id: '',
    amount: '',
    payment_date: today,
  }
}

export function CustomerPaymentsPage() {
  const [form, setForm] = useState<CustomerPaymentFormState>(emptyForm())
  const [customers, setCustomers] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ payment_id?: string; amount?: number } | null>(null)

  useEffect(() => {
    void loadInitialData()
  }, [])

  useEffect(() => {
    void loadInvoicesForCustomer()
  }, [form.customer_id])

  async function loadInitialData() {
    setLoading(true)
    setError(null)

    // Load customers
    const { data: customersData, error: customersError } = await supabase
      .schema('api')
      .rpc('get_records', { p_resource: 'customers', p_page: 1, p_limit: 100 })

    if (customersError) {
      setError(`Failed to load customers: ${customersError.message}`)
    } else {
      setCustomers(Array.isArray(customersData) ? customersData : customersData?.rows || customersData?.data || [])
    }

    setLoading(false)
  }

  async function loadInvoicesForCustomer() {
    if (!form.customer_id) {
      setInvoices([])
      return
    }

    const { data: invoicesData, error: invoicesError } = await supabase
      .schema('api')
      .rpc('get_records', { p_resource: 'invoices', p_page: 1, p_limit: 100 })

    if (invoicesError) {
      setError(`Failed to load invoices: ${invoicesError.message}`)
    } else {
      const allInvoices = Array.isArray(invoicesData) ? invoicesData : invoicesData?.rows || invoicesData?.data || []
      // Filter for customer
      const filtered = allInvoices.filter((inv) => (inv.customer_id || inv.customer_id) === form.customer_id)
      setInvoices(filtered)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)

    // Validate required fields
    if (!form.customer_id) {
      setError('Customer is required')
      setSubmitting(false)
      return
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setError('Amount must be greater than 0')
      setSubmitting(false)
      return
    }

    const payload: Record<string, unknown> = {
      customer_id: form.customer_id,
      amount: Number(form.amount),
      payment_date: form.payment_date,
    }

    // invoice_id is optional - if provided, posts against invoice; if omitted, posts as advance
    if (form.invoice_id) {
      payload.invoice_id = form.invoice_id
    }

    const result = await paymentReceivedCreate(payload)
    if (result.ok) {
      setSuccess({
        payment_id: result.data.payment_id,
        amount: result.data.amount,
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
            <h1>Record Customer Payment</h1>
          </div>
        </header>
        <div className="exec-dash__state-card">
          <h2 className="exec-dash__state-title">Loading</h2>
          <p className="exec-dash__state-message">Fetching customers...</p>
        </div>
      </article>
    )
  }

  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Invoicing & Expenses</p>
          <h1>Record Customer Payment</h1>
          <p>Post a customer payment against an invoice or as an advance payment.</p>
        </div>
      </header>

      <section className="users-card">
        <div className="users-card__header">
          <div>
            <h2>Payment Details</h2>
            <p>Invoice is optional. Omitting it posts the payment as a customer advance.</p>
          </div>
        </div>

        <div className="exec-dash__row">
          <div className="exec-dash__panel">
            {error && <div className="exec-dash__state-card exec-dash__state-card--error" style={{ marginBottom: '1rem' }}>
              <h2 className="exec-dash__state-title">Error</h2>
              <p className="exec-dash__state-message">{error}</p>
            </div>}

            {success && <div className="exec-dash__state-card" style={{ marginBottom: '1rem', borderLeft: '4px solid #22c55e' }}>
              <h2 className="exec-dash__state-title">Payment Recorded</h2>
              <p className="exec-dash__state-message">
                Payment ID: <strong>{success.payment_id}</strong>
                <br />
                Amount: <strong>{formatMoneyGhs(success.amount || 0)}</strong>
              </p>
            </div>}

            <form onSubmit={(event) => void handleSubmit(event)}>
              <label style={{ marginBottom: '1rem', display: 'block' }}>
                Customer *
                <select
                  value={form.customer_id}
                  onChange={(event) => setForm((current) => ({ ...current, customer_id: event.target.value, invoice_id: '' }))}
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

              {form.customer_id && (
                <label style={{ marginBottom: '1rem', display: 'block' }}>
                  Invoice (optional — leave blank to post as advance)
                  <select
                    value={form.invoice_id}
                    onChange={(event) => setForm((current) => ({ ...current, invoice_id: event.target.value }))}
                    style={{ display: 'block', width: '100%', marginTop: '0.25rem', padding: '0.5rem' }}
                  >
                    <option value="">No invoice (post as advance)</option>
                    {invoices.map((invoice) => (
                      <option key={invoice.invoice_id || invoice.id} value={invoice.invoice_id || invoice.id}>
                        {invoice.invoice_number} – {formatMoneyGhs(Number(invoice.amount_due || 0) || 0)}
                      </option>
                    ))}
                  </select>
                </label>
              )}

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

              <label style={{ marginBottom: '1.5rem', display: 'block' }}>
                Payment Date *
                <input
                  type="date"
                  value={form.payment_date}
                  onChange={(event) => setForm((current) => ({ ...current, payment_date: event.target.value }))}
                  required
                  style={{ display: 'block', width: '100%', marginTop: '0.25rem', padding: '0.5rem' }}
                />
              </label>

              <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', marginBottom: '1rem', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>Amount to receive:</strong>
                  <span>{formatMoneyGhs(Number(form.amount) || 0)}</span>
                </div>
              </div>

              <button
                type="submit"
                className="button button--primary"
                disabled={submitting}
                style={{ width: '100%' }}
              >
                {submitting ? 'Recording Payment...' : 'Record Payment'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </article>
  )
}
