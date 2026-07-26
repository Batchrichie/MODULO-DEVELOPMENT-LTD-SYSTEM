import { useEffect, useState } from 'react'
import { Modal } from '../../components/Modal'
import { formatMoneyGhs } from '../../lib/formatMoney'
import { paymentReceivedCreate } from '../../lib/rpc/accountant'
import { supabase } from '../../lib/supabase'
import { unwrapRpcResponse } from '../../lib/common'
import '../../styles/executive-dashboard.css'

interface CustomerPaymentFormState {
  customer_id: string
  amount: string
  settlement_account_id: string
}

const emptyForm = (): CustomerPaymentFormState => ({
  customer_id: '',
  amount: '',
  settlement_account_id: '',
})

interface SettlementAccountRecord {
  account_id?: string
  id?: string
  name?: string | null
  payment_method_type?: string | null
}

export function CustomerPaymentsPage() {
  const [form, setForm] = useState<CustomerPaymentFormState>(emptyForm())
  const [customers, setCustomers] = useState<any[]>([])
  const [settlementAccounts, setSettlementAccounts] = useState<SettlementAccountRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [_error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [_success, setSuccess] = useState<{ payment_id?: string; amount?: number } | null>(null)

  useEffect(() => {
    void loadInitialData()
  }, [])

  async function loadInitialData() {
    setLoading(true)
    setError(null)
    setFormError(null)
    setStatusMessage(null)

    const [customersResult, settlementAccountsResult] = await Promise.all([
      supabase.schema('api').rpc('get_records', { p_resource: 'customers', p_page: 1, p_limit: 100 }),
      supabase.schema('api').rpc('list_payment_method_accounts'),
    ])

    if (customersResult.error) {
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

    if (settlementAccountsResult.error) {
      setError((current) => current ? `${current}; Failed to load settlement accounts: ${settlementAccountsResult.error.message}` : `Failed to load settlement accounts: ${settlementAccountsResult.error.message}`)
      setSettlementAccounts([])
    } else {
      const unwrapped = unwrapRpcResponse(settlementAccountsResult.data)
      if (!unwrapped.ok) {
        setError((current) => current ? `${current}; Failed to load settlement accounts: ${unwrapped.error}` : `Failed to load settlement accounts: ${unwrapped.error}`)
        setSettlementAccounts([])
      } else {
        setSettlementAccounts(Array.isArray(unwrapped.value) ? unwrapped.value : [])
      }
    }

    setLoading(false)
    // recent payments list removed (not part of this ticket)
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

    if (!form.settlement_account_id) {
      setFormError('Settlement account is required')
      setSubmitting(false)
      return
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setFormError('Amount must be greater than 0')
      setSubmitting(false)
      return
    }

    const payload: Record<string, unknown> = {
      customer_id: form.customer_id,
      settlement_account_id: form.settlement_account_id,
      amount: Number(form.amount),
    }

    const result = await paymentReceivedCreate(payload)
    if (result.ok) {
      setSuccess({
        payment_id: result.data.payment_id,
        amount: result.data.amount ?? 0,
      })
      setForm(emptyForm())
      setShowModal(false)
      setStatusMessage(`Payment ${result.data.payment_id ?? ''} recorded — ${formatMoneyGhs(result.data.amount ?? 0)}`)
    } else {
      setFormError(result.error)
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
          <p className="exec-dash__state-message">Fetching customers and payment options...</p>
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
            <p>Payment posts to Client Advances. Link to a specific invoice — coming soon.</p>
          </div>
        </div>

        <div className="exec-dash__row">
          <div className="exec-dash__panel">
            {formError && <div className="exec-dash__state-card exec-dash__state-card--error exec-dash__state-card--inline"><h2 className="exec-dash__state-title">Error</h2><p className="exec-dash__state-message">{formError}</p></div>}

            {statusMessage && <div className="exec-dash__state-card exec-dash__state-card--success exec-dash__state-card--inline"><h2 className="exec-dash__state-title">Success</h2><p className="exec-dash__state-message">{statusMessage}</p></div>}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Customer Payments</h3>
              <div>
                <button type="button" className="button button--secondary" onClick={() => void loadInitialData()}>Refresh</button>{' '}
                <button type="button" className="button button--primary" onClick={() => { setForm(emptyForm()); setFormError(null); setShowModal(true) }}>Record Payment</button>
              </div>
            </div>
            <div className="exec-dash__state-card exec-dash__state-card--empty"><h2 className="exec-dash__state-title">Recent payments hidden</h2><p className="exec-dash__state-message">Recent payments list removed from this view.</p></div>

            <Modal
              open={showModal}
              onClose={() => setShowModal(false)}
              title="Record Customer Payment"
              subtitle="Post a customer payment against an invoice or as an advance payment."
              maxWidth={760}
              footer={(
                <>
                  <button type="button" className="button button--secondary" onClick={() => setShowModal(false)}>Cancel</button>{' '}
                  <button type="submit" className="button button--primary" disabled={submitting} form="customer-payment-form">
                    {submitting ? 'Recording Payment...' : 'Record Payment'}
                  </button>
                </>
              )}
            >
              <form id="customer-payment-form" onSubmit={(event) => void handleSubmit(event)}>
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

                  <label className="form-field form-field--full">
                    <span className="form-field__label">Settlement account *</span>
                    <select
                      value={form.settlement_account_id}
                      onChange={(event) => setForm((current) => ({ ...current, settlement_account_id: event.target.value }))}
                      required
                    >
                      <option value="">Select settlement account</option>
                      {settlementAccounts.map((account) => (
                        <option key={account.account_id || account.id} value={account.account_id || account.id}>
                          {account.name || 'Unnamed account'} ({account.payment_method_type || 'Unknown'})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="summary-box">
                  <div className="summary-box__row summary-box__row--total">
                    <strong>Amount to receive:</strong>
                    <span>{formatMoneyGhs(Number(form.amount) || 0)}</span>
                  </div>
                  <div className="summary-box__note">Posted today.</div>
                </div>
              </form>
            </Modal>
          </div>
        </div>
      </section>
    </article>
  )
}
