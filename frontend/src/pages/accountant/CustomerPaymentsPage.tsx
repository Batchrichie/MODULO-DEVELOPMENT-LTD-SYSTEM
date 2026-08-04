import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { EmptyState } from '../../components/EmptyState'
import { FormErrorBanner } from '../../components/FormErrorBanner'
import { Modal } from '../../components/Modal'
import { formatMoneyGhs } from '../../lib/formatMoney'
import { getRecords, paymentReceivedCreate, type CustomerPayment, type Invoice } from '../../lib/rpc/accountant'
import { supabase } from '../../lib/supabase'
import { unwrapRpcResponse } from '../../lib/common'
import '../../styles/executive-dashboard.css'

interface CustomerPaymentFormState {
  customer_id: string
  invoice_id: string
  amount: string
  settlement_account_id: string
}

const emptyForm = (): CustomerPaymentFormState => ({
  customer_id: '',
  invoice_id: '',
  amount: '',
  settlement_account_id: '',
})

interface SettlementAccountRecord {
  account_id?: string
  id?: string
  name?: string | null
  payment_method_type?: string | null
}

interface InvoiceRecord extends Invoice {
  customer_id?: string | null
  amount?: number | null
  status?: string | null
}

interface CustomerPaymentRecord extends CustomerPayment {
  customer_id?: string | null
  invoice_id?: string | null
  payment_date?: string | null
}

interface OutstandingInvoiceOption {
  id: string
  label: string
  total: number
  paid: number
  outstanding: number
}

function toNumber(value: unknown): number {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric : 0
}

function getInvoiceId(record: InvoiceRecord): string {
  return String(record.invoice_id ?? record.id ?? '')
}

function getInvoiceSubtotal(record: InvoiceRecord): number {
  const taxTotal = toNumber(record.vat) + toNumber(record.nhil) + toNumber(record.getfund)
  if (record.amount !== undefined && record.amount !== null) {
    return toNumber(record.amount)
  }

  return Math.max(0, toNumber(record.amount_due) - taxTotal)
}

function getInvoiceLabel(record: InvoiceRecord): string {
  const invoiceId = String(record.invoice_number ?? getInvoiceId(record))
  const createdAt = String(record.created_at ?? 'No date')
  return `${invoiceId} · ${createdAt}`
}

function capAmountInput(value: string, maximum?: number): string {
  if (!value) return ''
  if (maximum === undefined) return value

  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return value
  if (numeric <= maximum) return value

  return maximum.toFixed(2)
}

export function CustomerPaymentsPage() {
  const [form, setForm] = useState<CustomerPaymentFormState>(emptyForm())
  const [customers, setCustomers] = useState<any[]>([])
  const [settlementAccounts, setSettlementAccounts] = useState<SettlementAccountRecord[]>([])
  const [customerInvoices, setCustomerInvoices] = useState<InvoiceRecord[]>([])
  const [customerPayments, setCustomerPayments] = useState<CustomerPaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingLinkedInvoices, setLoadingLinkedInvoices] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [_error, setError] = useState<string | null>(null)
  const [linkedInvoiceError, setLinkedInvoiceError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    void loadInitialData()
  }, [])

  useEffect(() => {
    if (!form.customer_id) {
      setCustomerInvoices([])
      setCustomerPayments([])
      setLinkedInvoiceError(null)
      return
    }

    void loadCustomerInvoiceData(form.customer_id)
  }, [form.customer_id])

  const outstandingInvoices = useMemo<OutstandingInvoiceOption[]>(() => {
    return customerInvoices
      .map((invoice) => {
        const invoiceId = getInvoiceId(invoice)
        const total = getInvoiceSubtotal(invoice) + toNumber(invoice.vat) + toNumber(invoice.nhil) + toNumber(invoice.getfund)
        const paid = customerPayments
          .filter((payment) => String(payment.invoice_id ?? '') === invoiceId)
          .reduce((sum, payment) => sum + toNumber(payment.amount), 0)

        return {
          id: invoiceId,
          label: getInvoiceLabel(invoice),
          total,
          paid,
          outstanding: Math.max(0, total - paid),
        }
      })
      .filter((invoice) => invoice.outstanding > 0)
      .sort((left, right) => right.outstanding - left.outstanding)
  }, [customerInvoices, customerPayments])

  const selectedInvoice = useMemo(
    () => outstandingInvoices.find((invoice) => invoice.id === form.invoice_id) ?? null,
    [form.invoice_id, outstandingInvoices],
  )

  useEffect(() => {
    if (!form.invoice_id || selectedInvoice) return

    setForm((current) => ({ ...current, invoice_id: '' }))
  }, [form.invoice_id, selectedInvoice])

  useEffect(() => {
    if (!selectedInvoice) return

    const amountValue = Number(form.amount)
    if (Number.isFinite(amountValue) && amountValue > selectedInvoice.outstanding) {
      setForm((current) => ({ ...current, amount: selectedInvoice.outstanding.toFixed(2) }))
    }
  }, [form.amount, selectedInvoice])

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

  async function loadCustomerInvoiceData(customerId: string) {
    setLoadingLinkedInvoices(true)
    setLinkedInvoiceError(null)

    const [invoicesResult, paymentsResult] = await Promise.all([
      getRecords<InvoiceRecord[]>('invoices', 1, 1000),
      getRecords<CustomerPaymentRecord[]>('customer_payments', 1, 1000),
    ])

    if (!invoicesResult.ok) {
      setLinkedInvoiceError(`Failed to load customer invoices: ${invoicesResult.error}`)
      setCustomerInvoices([])
    } else {
      setCustomerInvoices(
        invoicesResult.data.filter((invoice) => String(invoice.customer_id ?? '') === customerId),
      )
    }

    if (!paymentsResult.ok) {
      setLinkedInvoiceError((current) =>
        current ? `${current}; Failed to load prior customer payments: ${paymentsResult.error}` : `Failed to load prior customer payments: ${paymentsResult.error}`,
      )
      setCustomerPayments([])
    } else {
      setCustomerPayments(paymentsResult.data)
    }

    setLoadingLinkedInvoices(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setFormError(null)

    if (!form.customer_id && !form.invoice_id) {
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

    if (form.invoice_id) {
      if (!selectedInvoice) {
        setFormError('Select an outstanding invoice before submitting')
        setSubmitting(false)
        return
      }

      if (Number(form.amount) > selectedInvoice.outstanding) {
        setFormError(`Amount cannot exceed the selected invoice outstanding balance of ${formatMoneyGhs(selectedInvoice.outstanding)}`)
        setSubmitting(false)
        return
      }
    }

    const payload: Record<string, unknown> = {
      settlement_account_id: form.settlement_account_id,
      amount: Number(form.amount),
    }

    if (form.invoice_id) {
      payload.invoice_id = form.invoice_id
    } else {
      payload.customer_id = form.customer_id
    }

    const result = await paymentReceivedCreate(payload)
    if (result.ok) {
      const previousCustomerId = form.customer_id
      setForm(emptyForm())
      setShowModal(false)
      setStatusMessage(`Payment ${result.data.payment_id ?? ''} recorded — ${formatMoneyGhs(result.data.amount ?? 0)}`)
      if (previousCustomerId) {
        await loadCustomerInvoiceData(previousCustomerId)
      }
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
            <p>Payment posts to Client Advances. Link it to a specific invoice when you are settling an outstanding receivable.</p>
          </div>
        </div>

        <div className="exec-dash__row">
          <div className="exec-dash__panel">
            <FormErrorBanner message={formError} />

            {statusMessage && <div className="exec-dash__state-card exec-dash__state-card--success exec-dash__state-card--inline"><h2 className="exec-dash__state-title">Success</h2><p className="exec-dash__state-message">{statusMessage}</p></div>}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Customer Payments</h3>
              <div>
                <button type="button" className="button button--secondary" onClick={() => void loadInitialData()}>Refresh</button>{' '}
                <button type="button" className="button button--primary" onClick={() => { setForm(emptyForm()); setFormError(null); setLinkedInvoiceError(null); setShowModal(true) }}>Record Payment</button>
              </div>
            </div>
            <EmptyState
              icon="💳"
              title="Recent payments hidden"
              description="Recent payments list is not shown in this view."
            />

            <Modal
              open={showModal}
              onClose={() => setShowModal(false)}
              title="Record Customer Payment"
              subtitle="Post a customer advance or settle a specific outstanding invoice."
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
                <FormErrorBanner message={formError} />
                <FormErrorBanner message={linkedInvoiceError} label="Load issue" />
                <div className="form-grid">
                  <label className="form-field">
                    <span className="form-field__label">Customer *</span>
                    <select
                      value={form.customer_id}
                      onChange={(event) => setForm((current) => ({ ...current, customer_id: event.target.value, invoice_id: '' }))}
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
                    <span className="form-field__label">Outstanding invoice (optional)</span>
                    <select
                      value={form.invoice_id}
                      disabled={!form.customer_id || loadingLinkedInvoices || outstandingInvoices.length === 0}
                      onChange={(event) => {
                        const nextInvoiceId = event.target.value
                        const nextInvoice = outstandingInvoices.find((invoice) => invoice.id === nextInvoiceId)
                        setForm((current) => ({
                          ...current,
                          invoice_id: nextInvoiceId,
                          amount: nextInvoice ? capAmountInput(current.amount, nextInvoice.outstanding) : current.amount,
                        }))
                      }}
                    >
                      <option value="">
                        {!form.customer_id
                          ? 'Select a customer first'
                          : loadingLinkedInvoices
                          ? 'Loading outstanding invoices...'
                          : outstandingInvoices.length === 0
                          ? 'No outstanding invoices for this customer'
                          : 'Leave blank to post as a customer advance'}
                      </option>
                      {outstandingInvoices.map((invoice) => (
                        <option key={invoice.id} value={invoice.id}>
                          {invoice.label} · Outstanding {formatMoneyGhs(invoice.outstanding)}
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
                      onChange={(event) => setForm((current) => ({ ...current, amount: capAmountInput(event.target.value, selectedInvoice?.outstanding) }))}
                      step="0.01"
                      min="0"
                      max={selectedInvoice ? selectedInvoice.outstanding.toFixed(2) : undefined}
                      required
                    />
                    {selectedInvoice && (
                      <p className="form-field__hint">
                        Remaining outstanding balance: {formatMoneyGhs(selectedInvoice.outstanding)}
                      </p>
                    )}
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
                  <div className="summary-box__row">
                    <strong>Amount to receive:</strong>
                    <span>{formatMoneyGhs(Number(form.amount) || 0)}</span>
                  </div>
                  {selectedInvoice && (
                    <>
                      <div className="summary-box__row">
                        <strong>Invoice outstanding:</strong>
                        <span>{formatMoneyGhs(selectedInvoice.outstanding)}</span>
                      </div>
                      <div className="summary-box__row summary-box__row--total">
                        <strong>Outstanding after receipt:</strong>
                        <span>{formatMoneyGhs(Math.max(0, selectedInvoice.outstanding - (Number(form.amount) || 0)))}</span>
                      </div>
                    </>
                  )}
                  {!selectedInvoice && <div className="summary-box__note">Leave the invoice picker blank to post the payment as a customer advance.</div>}
                </div>
              </form>
            </Modal>
          </div>
        </div>
      </section>
    </article>
  )
}
