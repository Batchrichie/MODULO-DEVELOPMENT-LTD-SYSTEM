import { useEffect, useMemo, useState } from 'react'
import { formatMoneyGhs } from '../../lib/formatMoney'
import { createAccount, deactivateAccount, fetchAccounts, updateAccount } from '../../lib/rpc/accountant'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { EmptyState } from '../../components/EmptyState'
import { SearchField } from '../../components/SearchField'
import { deriveStatusBadgeFromState, StatusBadge } from '../../components/StatusBadge'
import '../../styles/executive-dashboard.css'

interface CoaFormState {
  name: string
  type: string
  reporting_group: string
  payment_method_type: string
  account_number: string
  provider_name: string
  account_code?: string
}

const emptyForm = (): CoaFormState => ({
  name: '',
  type: 'Asset',
  reporting_group: '',
  payment_method_type: '',
  account_number: '',
  provider_name: '',
  account_code: '',
})

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
  const [form, setForm] = useState<CoaFormState>(emptyForm())
  const [submitting, setSubmitting] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('__all__')
  const [viewingAccount, setViewingAccount] = useState<any>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    void loadAccounts()
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

    const payload = {
      name: form.name,
      type: form.type,
      reporting_group: form.reporting_group,
      ...(form.payment_method_type ? { payment_method_type: form.payment_method_type } : {}),
      ...(form.account_number ? { account_number: form.account_number } : {}),
      ...(form.provider_name ? { provider_name: form.provider_name } : {}),
    }

    const result = activeId ? await updateAccount(activeId, payload) : await createAccount(payload)
    if (result.ok) {
      setForm(emptyForm())
      setActiveId(null)
      setShowModal(false)
      await loadAccounts()
    } else {
      setError(result.error)
    }

    setSubmitting(false)
  }

  async function handleDeactivateConfirm(_reason?: string) {
    if (!deactivateTarget) return
    const result = await deactivateAccount(deactivateTarget.id)
    setDeactivateTarget(null)
    if (result.ok) {
      await loadAccounts()
    } else {
      setError(result.error)
    }
  }

  const totalBalance = useMemo(() => accounts.reduce((sum, account) => sum + (Number(account.balance ?? 0) || 0), 0), [accounts])

  const accountTypes = useMemo(() => {
    const set = new Set<string>()
    accounts.forEach((account) => { if (account.type) set.add(String(account.type)) })
    return Array.from(set).sort()
  }, [accounts])

  const filteredAccounts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return accounts.filter((account) => {
      if (filterType !== '__all__' && (account.type ?? '') !== filterType) return false
      if (!q) return true
      return (
        (account.code ?? '').toLowerCase().includes(q) ||
        (account.name ?? '').toLowerCase().includes(q) ||
        (account.type ?? '').toLowerCase().includes(q) ||
        (account.reporting_group ?? '').toLowerCase().includes(q)
      )
    })
  }, [accounts, searchQuery, filterType])

  const content = () => {
    if (loading) {
      return <div className="exec-dash__state-card"><h2 className="exec-dash__state-title">Loading chart of accounts</h2><p className="exec-dash__state-message">The account list is being fetched.</p></div>
    }

    if (error) {
      return <div className="exec-dash__state-card exec-dash__state-card--error"><h2 className="exec-dash__state-title">Unable to load chart of accounts</h2><p className="exec-dash__state-message">{error}</p><p className="exec-dash__state-hint">The backend may not expose the expected RPC payload yet.</p></div>
    }

    if (!accounts.length) {
      return (
        <EmptyState
          icon="📒"
          title="No accounts found"
          description="No accounts are available yet. Click New account to set up your Chart of Accounts."
          action={<button type="button" className="button button--primary" onClick={() => { setActiveId(null); setForm(emptyForm()); setShowModal(true) }}>New account</button>}
        />
      )
    }

    return (
      <div className="exec-dash__panel">
        <div className="registry-toolbar">
          <div className="registry-toolbar__search-row">
            <SearchField value={searchQuery} onChange={setSearchQuery} placeholder="Search by code, name, or type…" />
            <label className="form-field" style={{ margin: 0, minWidth: '12rem' }}>
              <select
                value={filterType}
                onChange={(event) => setFilterType(event.target.value)}
              >
                <option value="__all__">All account types</option>
                {accountTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="registry-toolbar__actions">
            <button
              type="button"
              className="button button--secondary"
              disabled
              title="Export CSV — pending backend report RPC"
            >
              Export
            </button>
            <button type="button" className="button button--secondary" onClick={() => void loadAccounts()}>Refresh</button>
            <button type="button" className="button button--primary" onClick={() => { setActiveId(null); setForm(emptyForm()); setShowModal(true) }}>New account</button>
          </div>
        </div>

        {!filteredAccounts.length ? (
          <EmptyState
            icon="🔎"
            title="No matching accounts"
            description={`No accounts match the current search/filter (${searchQuery || '—'} / ${filterType === '__all__' ? 'All types' : filterType}). Try adjusting the query.`}
          />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Reporting Group</th>
                  <th>Status</th>
                  <th>Balance</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAccounts.map((account) => {
                  const statusLabel = account.is_postable === false ? 'Inactive' : 'Active'
                  const statusBadge = deriveStatusBadgeFromState(statusLabel)
                  return (
                    <tr key={account.account_id ?? account.id ?? account.name} className={account.is_postable === false ? 'data-table__row--muted' : ''}>
                      <td>{account.code ?? '—'}</td>
                      <td>
                        <strong style={{ display: 'block' }}>{account.name ?? '—'}</strong>
                        {account.payment_method_type && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {account.provider_name ? `${account.provider_name} · ` : ''}
                            {account.payment_method_type}
                            {account.account_number ? ` · ${account.account_number}` : ''}
                          </span>
                        )}
                      </td>
                      <td>{account.type ?? '—'}</td>
                      <td>{account.reporting_group ?? '—'}</td>
                      <td className="data-table__cell--status">
                        <StatusBadge label={statusBadge.label} tone={statusBadge.tone} />
                      </td>
                      <td className="data-table__num">{account.balance != null ? formatMoneyGhs(Number(account.balance) || 0) : '—'}</td>
                      <td>
                        <div className="data-table__actions">
                          <button type="button" className="button button--secondary" onClick={() => setViewingAccount(account)}>View</button>
                          <button
                            type="button"
                            className="button button--secondary"
                            onClick={() => {
                              setActiveId(account.account_id ?? account.id ?? null)
                              setForm({
                                name: account.name ?? '',
                                type: account.type ?? 'Asset',
                                reporting_group: account.reporting_group ?? '',
                                payment_method_type: account.payment_method_type ?? '',
                                account_number: account.account_number ?? '',
                                provider_name: account.provider_name ?? '',
                                account_code: account.code ?? '',
                              })
                              setShowModal(true)
                            }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="button button--secondary"
                            onClick={() => setDeactivateTarget({
                              id: account.account_id ?? account.id ?? '',
                              name: account.name ?? '(unnamed)',
                            })}
                            disabled={account.is_postable === false}
                          >
                            Deactivate
                          </button>
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
          <p className="admin-dashboard__eyebrow">Accounting Workspace</p>
          <h1>Chart of Accounts</h1>
          <p>Keep the core ledger structure clear, balanced, and easy to maintain.</p>
        </div>
      </header>

      <section className="admin-dashboard__stats" aria-label="Accounting metrics">
        <MetricCard label="Accounts" value={String(accounts.length)} tone="blue" icon="accounts" />
        <MetricCard label="Active" value={String(accounts.filter((account) => account.is_postable !== false).length)} tone="green" icon="active" />
        <MetricCard label="Total Balance" value={formatMoneyGhs(totalBalance)} tone="purple" icon="balance" />
        <MetricCard label="Mode" value={showModal ? (activeId ? 'Edit' : 'Create') : 'Browse'} tone="orange" icon="mode" />
      </section>

      <section className="users-card">
        <div className="users-card__header">
          <div>
            <h2>Account Registry</h2>
            <p>Create, review, and update the accounts that drive the books. Includes Mobile Money (MTN MoMo, Vodafone Cash, AirtelTigo Money) as CoA records.</p>
          </div>
        </div>

        <div className="exec-dash__row">
          {content()}
        </div>
      </section>

      {showModal && (
        <div
          className="modal-overlay"
          onClick={(event) => {
            if (event.target !== event.currentTarget) return
            setShowModal(false)
            setActiveId(null)
            setForm(emptyForm())
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="coa-modal-title"
        >
          <div className="modal">
            <div className="modal__header">
              <div className="modal__header-text">
                <h2 id="coa-modal-title" className="modal__title">{activeId ? 'Update account' : 'New account'}</h2>
                <p className="modal__subtitle">{activeId ? 'Update an existing postable ledger account.' : 'Create a postable ledger account.'}</p>
              </div>
              <button
                type="button"
                aria-label="Close dialog"
                className="modal__close"
                onClick={() => { setShowModal(false); setActiveId(null); setForm(emptyForm()) }}
              >
                ×
              </button>
            </div>
            <form onSubmit={(event) => void handleSubmit(event)}>
              <div className="modal__body">
                {error && <div className="exec-dash__state-card exec-dash__state-card--error exec-dash__state-card--inline"><h2 className="exec-dash__state-title">Error</h2><p className="exec-dash__state-message">{error}</p></div>}
                <div className="form-grid">
                  <label className="form-field">
                    <span className="form-field__label">Account code</span>
                    <input
                      value={form.account_code ?? ''}
                      placeholder="e.g. 1130"
                      onChange={(event) => setForm((current) => ({ ...current, account_code: event.target.value }))}
                      readOnly
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-field__label">Account type</span>
                    <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}>
                      <option value="Asset">Asset</option>
                      <option value="Contra-Asset">Contra-Asset</option>
                      <option value="Liability">Liability</option>
                      <option value="Equity">Equity</option>
                      <option value="Income">Income</option>
                      <option value="Expense">Expense</option>
                    </select>
                  </label>
                  <label className="form-field form-field--full">
                    <span className="form-field__label">Account name</span>
                    <input
                      value={form.name}
                      placeholder="e.g. Petty Cash"
                      onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                      required
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-field__label">Reporting group</span>
                    <input
                      value={form.reporting_group}
                      placeholder="Current Assets"
                      onChange={(event) => setForm((current) => ({ ...current, reporting_group: event.target.value }))}
                      required
                    />
                  </label>
                  <label className="form-field">
                    <span className="form-field__label">Payment method (optional)</span>
                    <select
                      value={form.payment_method_type ? form.payment_method_type : '__none__'}
                      onChange={(event) => setForm((current) => ({ ...current, payment_method_type: event.target.value === '__none__' ? '' : event.target.value }))}
                    >
                      <option value="__none__">Not a payment account</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank">Bank</option>
                      <option value="MTN Mobile Money">MTN Mobile Money</option>
                      <option value="Vodafone Cash">Vodafone Cash</option>
                      <option value="AirtelTigo Money">AirtelTigo Money</option>
                      <option value="Card">Card</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </label>
                  <label className="form-field form-field--full">
                    <span className="form-field__label">Provider / account number (optional)</span>
                    <input
                      value={`${form.provider_name ?? ''}${form.provider_name && form.account_number ? ' · ' : ''}${form.account_number ?? ''}`}
                      placeholder="e.g. GCB · 0123456789"
                      onChange={(event) => {
                        const raw = event.target.value
                        const parts = raw.split('·').map((s) => s.trim())
                        setForm((current) => ({ ...current, provider_name: parts[0] ?? '', account_number: parts[1] ?? '' }))
                      }}
                    />
                  </label>
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="button button--secondary" onClick={() => { setShowModal(false); setActiveId(null); setForm(emptyForm()) }}>Cancel</button>
                <button type="submit" className="button button--primary" disabled={submitting}>{submitting ? 'Saving…' : activeId ? 'Save changes' : 'Save account'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingAccount && (
        <div
          className="modal-overlay"
          onClick={(event) => {
            if (event.target !== event.currentTarget) return
            setViewingAccount(null)
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="coa-view-title"
        >
          <div className="modal">
            <div className="modal__header">
              <div className="modal__header-text">
                <h2 id="coa-view-title" className="modal__title">Account details</h2>
                <p className="modal__subtitle">Read-only view — use Edit to make changes.</p>
              </div>
              <button type="button" aria-label="Close dialog" className="modal__close" onClick={() => setViewingAccount(null)}>×</button>
            </div>
            <div className="modal__body">
              <div className="form-grid">
                <label className="form-field"><span className="form-field__label">Account code</span><input value={viewingAccount.code ?? ''} readOnly /></label>
                <label className="form-field"><span className="form-field__label">Account type</span><input value={viewingAccount.type ?? ''} readOnly /></label>
                <label className="form-field form-field--full"><span className="form-field__label">Account name</span><input value={viewingAccount.name ?? ''} readOnly /></label>
                <label className="form-field"><span className="form-field__label">Reporting group</span><input value={viewingAccount.reporting_group ?? ''} readOnly /></label>
                <label className="form-field"><span className="form-field__label">Status</span>
                  <div style={{ padding: '0.875rem 1rem' }}>
                    <StatusBadge label={viewingAccount.is_postable === false ? 'Inactive' : 'Active'} tone={viewingAccount.is_postable === false ? 'error' : 'success'} />
                  </div>
                </label>
                {viewingAccount.payment_method_type && (
                  <label className="form-field form-field--full">
                    <span className="form-field__label">Payment details</span>
                    <input value={`${viewingAccount.payment_method_type}${viewingAccount.provider_name ? ` · ${viewingAccount.provider_name}` : ''}${viewingAccount.account_number ? ` · ${viewingAccount.account_number}` : ''}`} readOnly />
                  </label>
                )}
                <label className="form-field"><span className="form-field__label">Current balance</span><input value={viewingAccount.balance != null ? formatMoneyGhs(Number(viewingAccount.balance) || 0) : '—'} readOnly /></label>
              </div>
            </div>
            <div className="modal__footer">
              <button type="button" className="button button--secondary" onClick={() => setViewingAccount(null)}>Close</button>
              <button
                type="button"
                className="button button--primary"
                onClick={() => {
                  const a = viewingAccount
                  setActiveId(a.account_id ?? a.id ?? null)
                  setForm({
                    name: a.name ?? '',
                    type: a.type ?? 'Asset',
                    reporting_group: a.reporting_group ?? '',
                    payment_method_type: a.payment_method_type ?? '',
                    account_number: a.account_number ?? '',
                    provider_name: a.provider_name ?? '',
                    account_code: a.code ?? '',
                  })
                  setViewingAccount(null)
                  setShowModal(true)
                }}
              >
                Edit account
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={(reason) => void handleDeactivateConfirm(reason)}
        tone="danger"
        iconGlyph="⚠"
        title="Deactivate this account?"
        description={`Deactivating “${deactivateTarget?.name ?? ''}” marks the ledger account as inactive. It will no longer appear as a postable option but remains available for historical reporting.`}
        requireReason
        reasonLabel="Reason for deactivation (required)"
        reasonPlaceholder="e.g. Bank account closed, payment method no longer in use…"
        confirmLabel="Deactivate account"
        cancelLabel="Keep account"
        confirmingLabel="Deactivating…"
      />
    </article>
  )
}
