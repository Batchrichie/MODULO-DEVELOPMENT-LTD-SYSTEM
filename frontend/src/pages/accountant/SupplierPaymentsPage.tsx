import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { EmptyState } from '../../components/EmptyState'
import { FormErrorBanner } from '../../components/FormErrorBanner'
import { Modal } from '../../components/Modal'
import { formatMoneyGhs } from '../../lib/formatMoney'
import { getRecords, paymentMadeCreate, type Expense, type SupplierPayment } from '../../lib/rpc/accountant'
import { supabase } from '../../lib/supabase'
import { unwrapRpcResponse } from '../../lib/common'
import '../../styles/executive-dashboard.css'

interface SupplierPaymentFormState {
  supplier_id: string
  expense_id: string
  amount: string
  settlement_account_id: string
}

const emptyForm = (): SupplierPaymentFormState => ({
  supplier_id: '',
  expense_id: '',
  amount: '',
  settlement_account_id: '',
})

interface SettlementAccountRecord {
  account_id?: string
  id?: string
  name?: string | null
  payment_method_type?: string | null
}

interface ExpenseRecord extends Expense {
  supplier_id?: string | null
  vat_input?: number | null
  status?: string | null
}

interface SupplierPaymentRecord extends SupplierPayment {
  supplier_id?: string | null
  expense_id?: string | null
  payment_date?: string | null
}

interface OutstandingExpenseOption {
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

function getExpenseId(record: ExpenseRecord): string {
  return String(record.expense_id ?? record.id ?? '')
}

function getExpenseLabel(record: ExpenseRecord): string {
  const expenseId = getExpenseId(record)
  const description = String(record.description ?? 'No description')
  const createdAt = String(record.created_at ?? 'No date')
  return `${expenseId} · ${description} · ${createdAt}`
}

function capAmountInput(value: string, maximum?: number): string {
  if (!value) return ''
  if (maximum === undefined) return value

  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return value
  if (numeric <= maximum) return value

  return maximum.toFixed(2)
}

export function SupplierPaymentsPage() {
  const [form, setForm] = useState<SupplierPaymentFormState>(emptyForm())
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [settlementAccounts, setSettlementAccounts] = useState<SettlementAccountRecord[]>([])
  const [supplierExpenses, setSupplierExpenses] = useState<ExpenseRecord[]>([])
  const [supplierPayments, setSupplierPayments] = useState<SupplierPaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingLinkedExpenses, setLoadingLinkedExpenses] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [_error, setError] = useState<string | null>(null)
  const [linkedExpenseError, setLinkedExpenseError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    void loadInitialData()
  }, [])

  useEffect(() => {
    if (!form.supplier_id) {
      setSupplierExpenses([])
      setSupplierPayments([])
      setLinkedExpenseError(null)
      return
    }

    void loadSupplierExpenseData(form.supplier_id)
  }, [form.supplier_id])

  const outstandingExpenses = useMemo<OutstandingExpenseOption[]>(() => {
    return supplierExpenses
      .map((expense) => {
        const expenseId = getExpenseId(expense)
        const total = toNumber(expense.amount) + toNumber(expense.vat_input)
        const paid = supplierPayments
          .filter((payment) => String(payment.expense_id ?? '') === expenseId)
          .reduce((sum, payment) => sum + toNumber(payment.amount), 0)

        return {
          id: expenseId,
          label: getExpenseLabel(expense),
          total,
          paid,
          outstanding: Math.max(0, total - paid),
        }
      })
      .filter((expense) => expense.outstanding > 0)
      .sort((left, right) => right.outstanding - left.outstanding)
  }, [supplierExpenses, supplierPayments])

  const selectedExpense = useMemo(
    () => outstandingExpenses.find((expense) => expense.id === form.expense_id) ?? null,
    [form.expense_id, outstandingExpenses],
  )

  useEffect(() => {
    if (!form.expense_id || selectedExpense) return

    setForm((current) => ({ ...current, expense_id: '' }))
  }, [form.expense_id, selectedExpense])

  useEffect(() => {
    if (!selectedExpense) return

    const amountValue = Number(form.amount)
    if (Number.isFinite(amountValue) && amountValue > selectedExpense.outstanding) {
      setForm((current) => ({ ...current, amount: selectedExpense.outstanding.toFixed(2) }))
    }
  }, [form.amount, selectedExpense])

  async function loadInitialData() {
    setLoading(true)
    setError(null)
    setFormError(null)
    setStatusMessage(null)

    const [suppliersResult, settlementAccountsResult] = await Promise.all([
      supabase.schema('api').rpc('get_records', { p_resource: 'suppliers', p_page: 1, p_limit: 100 }),
      supabase.schema('api').rpc('list_payment_method_accounts'),
    ])

    if (suppliersResult.error) {
      setError(`Failed to load suppliers: ${suppliersResult.error.message}`)
    } else {
      const unwrapped = unwrapRpcResponse(suppliersResult.data)
      if (!unwrapped.ok) {
        setError(`Failed to load suppliers: ${unwrapped.error}`)
        setSuppliers([])
      } else {
        setSuppliers(Array.isArray(unwrapped.value) ? unwrapped.value : [])
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

  async function loadSupplierExpenseData(supplierId: string) {
    setLoadingLinkedExpenses(true)
    setLinkedExpenseError(null)

    const [expensesResult, paymentsResult] = await Promise.all([
      getRecords<ExpenseRecord[]>('expenses', 1, 1000),
      getRecords<SupplierPaymentRecord[]>('supplier_payments', 1, 1000),
    ])

    if (!expensesResult.ok) {
      setLinkedExpenseError(`Failed to load supplier expenses: ${expensesResult.error}`)
      setSupplierExpenses([])
    } else {
      setSupplierExpenses(
        expensesResult.data.filter((expense) => String(expense.supplier_id ?? '') === supplierId),
      )
    }

    if (!paymentsResult.ok) {
      setLinkedExpenseError((current) =>
        current ? `${current}; Failed to load prior supplier payments: ${paymentsResult.error}` : `Failed to load prior supplier payments: ${paymentsResult.error}`,
      )
      setSupplierPayments([])
    } else {
      setSupplierPayments(paymentsResult.data)
    }

    setLoadingLinkedExpenses(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setFormError(null)

    if (!form.supplier_id && !form.expense_id) {
      setFormError('Supplier is required')
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

    if (form.expense_id) {
      if (!selectedExpense) {
        setFormError('Select an outstanding expense before submitting')
        setSubmitting(false)
        return
      }

      if (Number(form.amount) > selectedExpense.outstanding) {
        setFormError(`Amount cannot exceed the selected expense outstanding balance of ${formatMoneyGhs(selectedExpense.outstanding)}`)
        setSubmitting(false)
        return
      }
    }

    const payload: Record<string, unknown> = {
      settlement_account_id: form.settlement_account_id,
      amount: Number(form.amount),
    }

    if (form.expense_id) {
      payload.expense_id = form.expense_id
    } else {
      payload.supplier_id = form.supplier_id
    }

    const result = await paymentMadeCreate(payload)
    if (result.ok) {
      const previousSupplierId = form.supplier_id
      setForm(emptyForm())
      setShowModal(false)
      setStatusMessage(`Payment ${result.data.payment_id ?? ''} recorded — ${formatMoneyGhs(result.data.amount ?? 0)}`)
      if (previousSupplierId) {
        await loadSupplierExpenseData(previousSupplierId)
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
            <h1>Record Supplier Payment</h1>
          </div>
        </header>
        <div className="exec-dash__state-card">
          <h2 className="exec-dash__state-title">Loading</h2>
          <p className="exec-dash__state-message">Fetching suppliers and payment options...</p>
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
            <p>Payment posts to Advances to Suppliers. Link it to a specific expense when you need to settle an outstanding supplier invoice.</p>
          </div>
        </div>

        <div className="exec-dash__row">
          <div className="exec-dash__panel">
            <FormErrorBanner message={formError} />

            {statusMessage && <div className="exec-dash__state-card exec-dash__state-card--success exec-dash__state-card--inline"><h2 className="exec-dash__state-title">Success</h2><p className="exec-dash__state-message">{statusMessage}</p></div>}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Supplier Payments</h3>
              <div>
                <button type="button" className="button button--secondary" onClick={() => void loadInitialData()}>Refresh</button>{' '}
                <button type="button" className="button button--primary" onClick={() => { setForm(emptyForm()); setFormError(null); setLinkedExpenseError(null); setShowModal(true) }}>Record Payment</button>
              </div>
            </div>
            <EmptyState
              icon="💰"
              title="Recent payments hidden"
              description="Recent payments list is not shown in this view."
            />

            <Modal
              open={showModal}
              onClose={() => setShowModal(false)}
              title="Record Supplier Payment"
              subtitle="Post a supplier advance or settle a specific outstanding expense."
              maxWidth={760}
              footer={(
                <>
                  <button type="button" className="button button--secondary" onClick={() => setShowModal(false)}>Cancel</button>{' '}
                  <button type="submit" className="button button--primary" disabled={submitting} form="supplier-payment-form">
                    {submitting ? 'Recording Payment...' : 'Record Payment'}
                  </button>
                </>
              )}
            >
              <form id="supplier-payment-form" onSubmit={(event) => void handleSubmit(event)}>
                <FormErrorBanner message={formError} />
                <FormErrorBanner message={linkedExpenseError} label="Load issue" />
                <div className="form-grid">
                  <label className="form-field">
                    <span className="form-field__label">Supplier *</span>
                    <select
                      value={form.supplier_id}
                      onChange={(event) => setForm((current) => ({ ...current, supplier_id: event.target.value, expense_id: '' }))}
                      required
                    >
                      <option value="">Select a supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.supplier_id || supplier.id} value={supplier.supplier_id || supplier.id}>
                          {supplier.name || supplier.supplier_name || '—'}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="form-field">
                    <span className="form-field__label">Outstanding expense (optional)</span>
                    <select
                      value={form.expense_id}
                      disabled={!form.supplier_id || loadingLinkedExpenses || outstandingExpenses.length === 0}
                      onChange={(event) => {
                        const nextExpenseId = event.target.value
                        const nextExpense = outstandingExpenses.find((expense) => expense.id === nextExpenseId)
                        setForm((current) => ({
                          ...current,
                          expense_id: nextExpenseId,
                          amount: nextExpense ? capAmountInput(current.amount, nextExpense.outstanding) : current.amount,
                        }))
                      }}
                    >
                      <option value="">
                        {!form.supplier_id
                          ? 'Select a supplier first'
                          : loadingLinkedExpenses
                          ? 'Loading outstanding expenses...'
                          : outstandingExpenses.length === 0
                          ? 'No outstanding expenses for this supplier'
                          : 'Leave blank to post as a supplier advance'}
                      </option>
                      {outstandingExpenses.map((expense) => (
                        <option key={expense.id} value={expense.id}>
                          {expense.label} · Outstanding {formatMoneyGhs(expense.outstanding)}
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
                      onChange={(event) => setForm((current) => ({ ...current, amount: capAmountInput(event.target.value, selectedExpense?.outstanding) }))}
                      step="0.01"
                      min="0"
                      max={selectedExpense ? selectedExpense.outstanding.toFixed(2) : undefined}
                      required
                    />
                    {selectedExpense && (
                      <p className="form-field__hint">
                        Remaining outstanding balance: {formatMoneyGhs(selectedExpense.outstanding)}
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
                    <strong>Amount to pay:</strong>
                    <span>{formatMoneyGhs(Number(form.amount) || 0)}</span>
                  </div>
                  {selectedExpense && (
                    <>
                      <div className="summary-box__row">
                        <strong>Expense outstanding:</strong>
                        <span>{formatMoneyGhs(selectedExpense.outstanding)}</span>
                      </div>
                      <div className="summary-box__row summary-box__row--total">
                        <strong>Outstanding after payment:</strong>
                        <span>{formatMoneyGhs(Math.max(0, selectedExpense.outstanding - (Number(form.amount) || 0)))}</span>
                      </div>
                    </>
                  )}
                  {!selectedExpense && (
                    <div className="summary-box__note">Leave the expense picker blank to post the payment as a supplier advance.</div>
                  )}
                </div>
              </form>
            </Modal>
          </div>
        </div>
      </section>
    </article>
  )
}
