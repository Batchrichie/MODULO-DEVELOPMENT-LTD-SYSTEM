import { useEffect, useMemo, useRef, useState } from 'react'
import { formatMoneyGhs } from '../../lib/formatMoney'
import {
  createAccount,
  deactivateAccount,
  fetchAccounts,
  fetchCoaReference,
  updateAccount,
  type CoaReferenceData,
} from '../../lib/rpc/accountant'
import '../../styles/executive-dashboard.css'

const PAYMENT_METHOD_NONE_SENTINEL = '__none__'

const PAYMENT_METHOD_DISPLAY: Record<string, string> = {
  Cash: 'Cash',
  Bank: 'Bank',
  MoMo: 'Mobile Money',
}

interface CoaFormState {
  code: string
  name: string
  type: string
  reporting_group: string
  payment_method_type: string
  account_number: string
  provider_name: string
}

function emptyForm(defaultType: string): CoaFormState {
  return {
    code: '',
    name: '',
    type: defaultType,
    reporting_group: '',
    payment_method_type: PAYMENT_METHOD_NONE_SENTINEL,
    account_number: '',
    provider_name: '',
  }
}

function MetricCard({ label, value, tone, icon }: { label: string; value: string; tone: string; icon: string }) {
  return (
    <div className="stat-card">
      <div className={`stat-card__icon stat-card__icon--${tone}`}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d={statPath(icon)} />
        </svg>
      </div>
      <div className="stat-card__content">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>Live view</small>
      </div>
    </div>
  )
}

function statPath(icon: string) {
  const paths: Record<string, string> = {
    accounts: 'M4 6h16v12H4zM8 6v12m8-12v12',
    active: 'M5 12h14M12 5l7 7-7 7',
    balance: 'M5 7h14v10H5zM8 11h8',
    mode: 'M4 8h16M4 16h10',
  }

  return paths[icon] ?? paths.accounts
}

export function AccountantCoaPage() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<CoaFormState>(emptyForm('Asset'))
  const [submitting, setSubmitting] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showModal, _setShowModal] = useState(false)
  const triggerBtnRef = useRef<HTMLButtonElement | null>(null)
  const modalOpenedAtRef = useRef<number>(0)
  const [popoverStyle, setPopoverStyle] = useState<{ left: number; top: number; maxWidth: number }>({ left: 24, top: 140, maxWidth: 960 })
  const [refLoading, setRefLoading] = useState(true)
  const [, setRefError] = useState<string | null>(null)
  const [coaRef, setCoaRef] = useState<CoaReferenceData>({
    reporting_groups: [],
    account_types: ['Asset', 'Contra-Asset', 'Liability', 'Equity', 'Income', 'Expense'],
    payment_methods: ['Cash', 'Bank', 'MoMo'],
  })
  function setShowModal(next: boolean) {
    if (next) {
      modalOpenedAtRef.current = performance.now()
      requestAnimationFrame(() => {
        const rect = triggerBtnRef.current?.getBoundingClientRect()
        const width = Math.min(960, window.innerWidth - 32)
        const rightEdge = rect ? rect.left - 8 : window.innerWidth - 8
        const left = Math.max(8, Math.min(window.innerWidth - width - 8, rightEdge - width))
        const top = rect ? Math.max(8, Math.min(window.innerHeight - 640, rect.top)) : 140
        setPopoverStyle({ left, top, maxWidth: width })
      })
    }
    _setShowModal(next)
  }
  const [formError, setFormError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    void loadAccounts()
    void loadCoaReference()
  }, [])

  async function loadCoaReference() {
    setRefLoading(true)
    setRefError(null)
    const result = await fetchCoaReference()
    if (result.ok) {
      setCoaRef(result.data)
      if (!form.type && result.data.account_types.length > 0) {
        setForm((current) => ({ ...current, type: result.data.account_types[0] ?? 'Asset' }))
      }
    } else {
      setRefError(result.error)
    }
    setRefLoading(false)
  }

  async function loadAccounts() {
    setLoading(true)
    setError(null)
    const result = await fetchAccounts()
    if (result.ok) {
      setAccounts(result.data)
    } else {
      setError(result.error)
      setAccounts([])
    }
    setLoading(false)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    setFormError(null)

    const payload = {
      ...(form.code ? { code: form.code } : {}),
      name: form.name,
      type: form.type,
      reporting_group: form.reporting_group,
      ...(form.payment_method_type && form.payment_method_type !== PAYMENT_METHOD_NONE_SENTINEL ? { payment_method_type: form.payment_method_type } : {}),
      ...(form.account_number ? { account_number: form.account_number } : {}),
      ...(form.provider_name ? { provider_name: form.provider_name } : {}),
    }

    const result = activeId ? await updateAccount(activeId, payload) : await createAccount(payload)
    if (result.ok) {
      setForm(emptyForm(coaRef.account_types[0] ?? 'Asset'))
      setActiveId(null)
      await loadAccounts()
      setShowModal(false)
      setStatusMessage(activeId ? 'Account updated' : 'Account created')
    } else {
      setFormError(result.error)
    }

    setSubmitting(false)
  }

  async function handleDeactivate(id: string) {
    const result = await deactivateAccount(id)
    if (result.ok) {
      await loadAccounts()
    } else {
      setError(result.error)
    }
  }

  const selectedRange = useMemo(() => {
    if (!form.reporting_group) return null
    return coaRef.reporting_groups.find((r) => r.reporting_group === form.reporting_group) ?? null
  }, [form.reporting_group, coaRef.reporting_groups])

  const suggestedCodePlaceholder = useMemo(() => {
    if (selectedRange) return `e.g. ${selectedRange.range_start} (${selectedRange.range_start}-${selectedRange.range_end})`
    return 'e.g. 1130'
  }, [selectedRange])

  const totalBalance = useMemo(() => accounts.reduce((sum, account) => sum + (Number(account.balance ?? 0) || 0), 0), [accounts])

  const content = () => {
    if (loading) {
      return <div className="exec-dash__state-card"><h2 className="exec-dash__state-title">Loading chart of accounts</h2><p className="exec-dash__state-message">The account list is being fetched.</p></div>
    }

    if (error) {
      return <div className="exec-dash__state-card exec-dash__state-card--error"><h2 className="exec-dash__state-title">Unable to load chart of accounts</h2><p className="exec-dash__state-message">{error}</p><p className="exec-dash__state-hint">The backend may not expose the expected RPC payload yet.</p></div>
    }

    if (!accounts.length) {
      return <div className="exec-dash__state-card exec-dash__state-card--empty"><h2 className="exec-dash__state-title">No accounts found</h2><p className="exec-dash__state-message">No accounts are available yet.</p></div>
    }

    return (
      <div className="exec-dash__panel">
        <div className="exec-dash__panel-title">Account registry</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Code</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Type</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Reporting Group</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.account_id ?? account.id ?? account.name}>
                  <td style={{ padding: '0.5rem' }}>{account.code ?? '—'}</td>
                  <td style={{ padding: '0.5rem' }}>{account.name ?? '—'}</td>
                  <td style={{ padding: '0.5rem' }}>{account.type ?? '—'}</td>
                  <td style={{ padding: '0.5rem' }}>{account.reporting_group ?? '—'}</td>
                  <td style={{ padding: '0.5rem' }}>{account.is_postable === false ? 'Inactive' : 'Active'}</td>
                  <td style={{ padding: '0.5rem' }}>
                    <button type="button" className="button button--secondary" onClick={() => { setActiveId(account.account_id ?? account.id ?? null); setForm({ code: account.code ?? '', name: account.name ?? '', type: account.type ?? (coaRef.account_types[0] ?? 'Asset'), reporting_group: account.reporting_group ?? '', payment_method_type: account.payment_method_type ?? PAYMENT_METHOD_NONE_SENTINEL, account_number: account.account_number ?? '', provider_name: account.provider_name ?? '' }); setFormError(null); setShowModal(true); }}>Edit</button>{' '}
                    <button type="button" className="button button--secondary" onClick={() => void handleDeactivate(account.account_id ?? account.id ?? '')}>Deactivate</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Accounting Workspace</p>
          <h1>Chart of Accounts</h1>
          <p>Keep the core ledger structure clear, balanced, and easy to maintain.</p>
        </div>
      </header>

      <section className="admin-dashboard__stats" aria-label="Accounting metrics">
        <MetricCard label="Accounts" value={String(accounts.length)} tone="blue" icon="accounts" />
        <MetricCard label="Active" value={String(accounts.filter((account) => account.is_postable !== false).length)} tone="green" icon="active" />
        <MetricCard label="Total Balance" value={formatMoneyGhs(totalBalance)} tone="purple" icon="balance" />
        <MetricCard label="Mode" value={activeId ? 'Edit' : 'Create'} tone="orange" icon="mode" />
      </section>

      <section className="users-card">
        <div className="users-card__header">
          <div>
            <h2>Account Registry</h2>
            <p>Create, review, and update the accounts that drive the books.</p>
          </div>
          <div className="users-card__actions">
            <button type="button" className="button button--secondary" onClick={() => void loadAccounts()}>Refresh</button>
            <button ref={triggerBtnRef} type="button" className="button button--primary" onClick={() => { setActiveId(null); setForm(emptyForm(coaRef.account_types[0] ?? 'Asset')); setFormError(null); setShowModal(true); setStatusMessage(null) }}>New account</button>
          </div>
        </div>
        <div className="exec-dash__row">
          <div className="exec-dash__panel">
            {formError && <div className="exec-dash__state-card exec-dash__state-card--error exec-dash__state-card--inline"><h2 className="exec-dash__state-title">Error</h2><p className="exec-dash__state-message">{formError}</p></div>}
            {statusMessage && <div className="exec-dash__state-card exec-dash__state-card--success exec-dash__state-card--inline"><h2 className="exec-dash__state-title">Success</h2><p className="exec-dash__state-message">{statusMessage}</p></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600 }}>{/* Placeholder left panel actions */}</div>
              <div />
            </div>
          </div>
          {content()}
        </div>
          {showModal && (
            <div className="modal-overlay" style={{ display: 'block', alignItems: 'unset', justifyContent: 'unset', padding: 0, background: 'transparent' }} onClick={(e) => { if (e.target !== e.currentTarget) return; if (performance.now() - modalOpenedAtRef.current < 300) return; setShowModal(false) }} role="dialog" aria-modal="true">
              <div className="modal" style={{ position: 'absolute', left: popoverStyle.left, top: popoverStyle.top, maxWidth: popoverStyle.maxWidth, margin: 0, transform: 'none' }}>
                <div className="modal__header">
                  <div className="modal__header-text">
                    <h2 className="modal__title">{activeId ? 'Update Account' : 'New account'}</h2>
                    <p className="modal__subtitle">Create a postable ledger account.</p>
                  </div>
                  <button type="button" aria-label="Close dialog" className="modal__close" onClick={() => setShowModal(false)}>×</button>
                </div>
                <form onSubmit={(event) => void handleSubmit(event)}>
                  <div className="modal__body">
                    {formError && <div className="exec-dash__state-card exec-dash__state-card--error exec-dash__state-card--inline"><h2 className="exec-dash__state-title">Error</h2><p className="exec-dash__state-message">{formError}</p></div>}
                    <div className="form-grid">
                      <label className="form-field">
                        <span className="form-field__label">Account code</span>
                        <input
                          value={form.code}
                          placeholder={suggestedCodePlaceholder}
                          onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                          style={{ display: 'block', width: '100%', marginTop: '0.25rem', minHeight: '2.75rem' }}
                        />
                      </label>
                      <label className="form-field">
                        <span className="form-field__label">Account type</span>
                        <select
                          value={form.type}
                          onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                          required
                          style={{ display: 'block', width: '100%', marginTop: '0.25rem', minHeight: '2.75rem' }}
                        >
                          {coaRef.account_types.map((typeOption) => (
                            <option key={typeOption} value={typeOption}>{typeOption}</option>
                          ))}
                        </select>
                      </label>
                      <label className="form-field" style={{ gridColumn: '1 / -1' }}>
                        <span className="form-field__label">Account name</span>
                        <input
                          value={form.name}
                          placeholder="e.g. Petty Cash"
                          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                          required
                          style={{ display: 'block', width: '100%', marginTop: '0.25rem', minHeight: '2.75rem' }}
                        />
                      </label>
                      <label className="form-field">
                        <span className="form-field__label">Reporting group</span>
                        <select
                          value={form.reporting_group}
                          onChange={(event) => setForm((current) => ({ ...current, reporting_group: event.target.value }))}
                          required
                          style={{ display: 'block', width: '100%', marginTop: '0.25rem', minHeight: '2.75rem' }}
                        >
                          <option value="">
                            {refLoading && coaRef.reporting_groups.length === 0
                              ? 'Loading reference data…'
                              : 'Select a reporting group…'}
                          </option>
                          {coaRef.reporting_groups.map((row) => (
                            <option key={row.reporting_group} value={row.reporting_group}>
                              {row.reporting_group} ({row.range_start}-{row.range_end})
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="form-field">
                        <span className="form-field__label">Payment method (optional)</span>
                        <select
                          value={form.payment_method_type}
                          onChange={(event) => setForm((current) => ({ ...current, payment_method_type: event.target.value }))}
                          style={{ display: 'block', width: '100%', marginTop: '0.25rem', minHeight: '2.75rem' }}
                        >
                          <option value={PAYMENT_METHOD_NONE_SENTINEL}>Not a payment account</option>
                          {coaRef.payment_methods.map((pm) => (
                            <option key={pm} value={pm}>
                              {PAYMENT_METHOD_DISPLAY[pm] ?? pm}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="form-field" style={{ gridColumn: '1 / -1' }}>
                        <span className="form-field__label">Provider / account number (optional)</span>
                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                          <input
                            value={form.provider_name}
                            placeholder="e.g. GCB"
                            onChange={(event) => setForm((current) => ({ ...current, provider_name: event.target.value }))}
                            style={{ flex: 1, minHeight: '2.75rem' }}
                          />
                          <input
                            value={form.account_number}
                            placeholder="e.g. 0123456789"
                            onChange={(event) => setForm((current) => ({ ...current, account_number: event.target.value }))}
                            style={{ flex: 1, minHeight: '2.75rem' }}
                          />
                        </div>
                      </label>
                    </div>
                  </div>
                  <div className="modal__footer">
                    <button type="button" className="button button--secondary" onClick={() => { setShowModal(false); setActiveId(null); setForm(emptyForm(coaRef.account_types[0] ?? 'Asset')) }}>Cancel</button>{' '}
                    <button type="submit" className="button button--primary" disabled={submitting}>{submitting ? 'Saving…' : activeId ? 'Save changes' : 'Save account'}</button>
                  </div>
                </form>
              </div>
              </div>
            )}
        </section>
    </article>
  )
}
