import { useEffect, useState } from 'react'
import { formatMoneyGhs } from '../../lib/formatMoney'
import { paymentMadeCreate } from '../../lib/rpc/accountant'
import { supabase } from '../../lib/supabase'
import '../../styles/executive-dashboard.css'

interface SupplierPaymentFormState {
  supplier_id: string
  amount: number | ''
  payment_date: string
  description: string
}

const emptyForm = (): SupplierPaymentFormState => {
  const today = new Date().toISOString().split('T')[0]
  return {
    supplier_id: '',
    amount: '',
    payment_date: today,
    description: '',
  }
}

export function SupplierPaymentsPage() {
  const [form, setForm] = useState<SupplierPaymentFormState>(emptyForm())
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ payment_id?: string; amount?: number } | null>(null)

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
      setSuppliers(Array.isArray(suppliersData) ? suppliersData : suppliersData?.rows || suppliersData?.data || [])
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

    const payload: Record<string, unknown> = {
      supplier_id: form.supplier_id,
      amount: Number(form.amount),
      payment_date: form.payment_date,
    }

    if (form.description) {
      payload.description = form.description
    }

    const result = await paymentMadeCreate(payload)
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
            <h1>Record Supplier Payment</h1>
          </div>
        </header>
        <div className="exec-dash__state-card">
          <h2 className="exec-dash__state-title">Loading</h2>
          <p className="exec-dash__state-message">Fetching suppliers...</p>
        </div>
      </article>
    )
  }

  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Invoicing & Expenses</p>
          <h1>Record Supplier Payment</h1>
          <p>Post a payment to a supplier and trigger automatic journal entries.</p>
        </div>
      </header>

      <section className="users-card">
        <div className="users-card__header">
          <div>
            <h2>Supplier Payment Details</h2>
            <p>Record a payment to a supplier for expenses or services.</p>
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
                Supplier *
                <select
                  value={form.supplier_id}
                  onChange={(event) => setForm((current) => ({ ...current, supplier_id: event.target.value }))}
                  required
                  style={{ display: 'block', width: '100%', marginTop: '0.25rem', padding: '0.5rem' }}
                >
                  <option value="">Select a supplier</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.supplier_id || supplier.id} value={supplier.supplier_id || supplier.id}>
                      {supplier.name || supplier.supplier_name || '—'}
                    </option>
                  ))}
                </select>
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
                Payment Date *
                <input
                  type="date"
                  value={form.payment_date}
                  onChange={(event) => setForm((current) => ({ ...current, payment_date: event.target.value }))}
                  required
                  style={{ display: 'block', width: '100%', marginTop: '0.25rem', padding: '0.5rem' }}
                />
              </label>

              <label style={{ marginBottom: '1.5rem', display: 'block' }}>
                Description (optional)
                <input
                  type="text"
                  placeholder="e.g., Invoice INV-2026-0088, reference for payment"
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  style={{ display: 'block', width: '100%', marginTop: '0.25rem', padding: '0.5rem' }}
                />
              </label>

              <div style={{ padding: '1rem', backgroundColor: '#f5f5f5', marginBottom: '1rem', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>Amount to pay:</strong>
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
