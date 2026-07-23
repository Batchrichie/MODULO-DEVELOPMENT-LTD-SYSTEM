import { useEffect, useMemo, useState } from 'react'
import { formatMoneyGhs } from '../../lib/formatMoney'
import { createAccount, deactivateAccount, fetchAccounts, updateAccount } from '../../lib/rpc/accountant'
import '../../styles/executive-dashboard.css'

interface CoaFormState {
  name: string
  type: string
  reporting_group: string
  payment_method_type: string
  account_number: string
  provider_name: string
}

const emptyForm = (): CoaFormState => ({
  name: '',
  type: 'Asset',
  reporting_group: '',
  payment_method_type: '',
  account_number: '',
  provider_name: '',
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

  useEffect(() => {
    void loadAccounts()
  }, [])

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
      await loadAccounts()
    } else {
      setError(result.error)
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
                    <button type="button" className="button button--secondary" onClick={() => { setActiveId(account.account_id ?? account.id ?? null); setForm({ name: account.name ?? '', type: account.type ?? 'Asset', reporting_group: account.reporting_group ?? '', payment_method_type: account.payment_method_type ?? '', account_number: account.account_number ?? '', provider_name: account.provider_name ?? '' }); }}>Edit</button>{' '}
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
            <button type="button" className="button button--primary" onClick={() => { setActiveId(null); setForm(emptyForm()) }}>New account</button>
          </div>
        </div>

        <div className="exec-dash__row">
          <div className="exec-dash__panel">
            <div className="exec-dash__panel-title">{activeId ? 'Update Account' : 'Create Account'}</div>
            <form onSubmit={(event) => void handleSubmit(event)}>
              <p className="exec-dash__mock-note">Account code is assigned by the server and is not entered here.</p>
              <label>
                Name
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required style={{ display: 'block', width: '100%', marginTop: '0.25rem', marginBottom: '0.75rem' }} />
              </label>
              <label>
                Type
                <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))} style={{ display: 'block', width: '100%', marginTop: '0.25rem', marginBottom: '0.75rem' }}>
                  <option value="Asset">Asset</option>
                  <option value="Contra-Asset">Contra-Asset</option>
                  <option value="Liability">Liability</option>
                  <option value="Equity">Equity</option>
                  <option value="Income">Income</option>
                  <option value="Expense">Expense</option>
                </select>
              </label>
              <label>
                Reporting Group
                <input value={form.reporting_group} onChange={(event) => setForm((current) => ({ ...current, reporting_group: event.target.value }))} required style={{ display: 'block', width: '100%', marginTop: '0.25rem', marginBottom: '0.75rem' }} />
              </label>
              <label>
                Payment Method Type
                <input value={form.payment_method_type} onChange={(event) => setForm((current) => ({ ...current, payment_method_type: event.target.value }))} style={{ display: 'block', width: '100%', marginTop: '0.25rem', marginBottom: '0.75rem' }} />
              </label>
              <label>
                Account Number
                <input value={form.account_number} onChange={(event) => setForm((current) => ({ ...current, account_number: event.target.value }))} style={{ display: 'block', width: '100%', marginTop: '0.25rem', marginBottom: '0.75rem' }} />
              </label>
              <label>
                Provider Name
                <input value={form.provider_name} onChange={(event) => setForm((current) => ({ ...current, provider_name: event.target.value }))} style={{ display: 'block', width: '100%', marginTop: '0.25rem', marginBottom: '0.75rem' }} />
              </label>
              <button type="submit" className="button button--primary" disabled={submitting}>{submitting ? 'Saving…' : activeId ? 'Save Changes' : 'Create Account'}</button>
              {activeId && <button type="button" className="button button--secondary" onClick={() => { setActiveId(null); setForm(emptyForm()) }} style={{ marginLeft: '0.5rem' }}>Cancel</button>}
            </form>
          </div>
          {content()}
        </div>
      </section>
    </article>
  )
}
