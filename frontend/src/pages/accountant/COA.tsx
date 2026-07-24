import { useEffect, useMemo, useState } from 'react'
import { formatMoneyGhs } from '../../lib/formatMoney'
import { createAccount, deactivateAccount, fetchAccounts, updateAccount } from '../../lib/rpc/accountant'

// ============================================================
// CAREMS -- Modern AccountantCoaPage (Inline Styled, No CSS File)
// ============================================================

// -- Design Tokens (Light + Dark) ----------------------------
const tokens = {
  light: {
    bgBody: '#f8fafc',
    bgSurface: '#ffffff',
    bgSurfaceRaised: '#ffffff',
    bgInset: '#f1f5f9',
    bgElevated: '#ffffff',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#64748b',
    textTertiary: '#94a3b8',
    borderSubtle: '#e2e8f0',
    borderDefault: '#cbd5e1',
    borderStrong: '#94a3b8',
    brand500: '#6366f1',
    brand600: '#4f46e5',
    brand700: '#4338ca',
    brand50: '#f0f4ff',
    success50: '#f0fdf4',
    success500: '#22c55e',
    success600: '#16a34a',
    warning50: '#fffbeb',
    warning500: '#f59e0b',
    warning600: '#d97706',
    info50: '#eff6ff',
    info500: '#3b82f6',
    info600: '#2563eb',
    error50: '#fef2f2',
    error500: '#ef4444',
    shadowSm: '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.04)',
    shadowMd: '0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px -2px rgba(0,0,0,0.04)',
  },
  dark: {
    bgBody: '#0f172a',
    bgSurface: '#1e293b',
    bgSurfaceRaised: '#1e293b',
    bgInset: '#0f172a',
    bgElevated: '#1e293b',
    textPrimary: '#f1f5f9',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    textTertiary: '#64748b',
    borderSubtle: '#334155',
    borderDefault: '#475569',
    borderStrong: '#64748b',
    brand500: '#818cf8',
    brand600: '#6366f1',
    brand700: '#4f46e5',
    brand50: 'rgba(99,102,241,0.15)',
    success50: 'rgba(34,197,94,0.15)',
    success500: '#4ade80',
    success600: '#22c55e',
    warning50: 'rgba(245,158,11,0.15)',
    warning500: '#fbbf24',
    warning600: '#f59e0b',
    info50: 'rgba(59,130,246,0.15)',
    info500: '#60a5fa',
    info600: '#3b82f6',
    error50: 'rgba(239,68,68,0.08)',
    error500: '#f87171',
    shadowSm: '0 1px 3px 0 rgba(0,0,0,0.25), 0 1px 2px -1px rgba(0,0,0,0.20)',
    shadowMd: '0 4px 6px -1px rgba(0,0,0,0.25), 0 2px 4px -2px rgba(0,0,0,0.20)',
  },
}

// -- Responsive Hook ----------------------------------------
function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return isDark
}

function useViewport() {
  const [width, setWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1200))

  useEffect(() => {
    const handler = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const isDesktop = width >= 1024
  const isTablet = width >= 768 && width < 1024
  const isPhone = width < 768

  return { width, isDesktop, isTablet, isPhone }
}

// -- Types ----------------------------------------------------
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

// -- Components -----------------------------------------------

function MetricCard({
  label,
  value,
  tone,
  icon,
  t,
}: {
  label: string
  value: string
  tone: 'blue' | 'green' | 'purple' | 'orange'
  icon: string
  t: typeof tokens.light
}) {
  const toneMap = {
    blue: { bg: t.info50, color: t.info600, accent: t.info500 },
    green: { bg: t.success50, color: t.success600, accent: t.success500 },
    purple: { bg: t.brand50, color: t.brand600, accent: t.brand500 },
    orange: { bg: t.warning50, color: t.warning600, accent: t.warning500 },
  }
  const c = toneMap[tone]

  const paths: Record<string, string> = {
    accounts: 'M4 6h16v12H4zM8 6v12m8-12v12',
    active: 'M5 12h14M12 5l7 7-7 7',
    balance: 'M5 7h14v10H5zM8 11h8',
    mode: 'M4 8h16M4 16h10',
  }

  return (
    <div
      style={{
        background: t.bgSurface,
        border: `1px solid ${t.borderSubtle}`,
        borderRadius: '1rem',
        padding: '1.25rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem',
        boxShadow: t.shadowSm,
        transition: 'transform 200ms cubic-bezier(0.4,0,0.2,1), box-shadow 200ms cubic-bezier(0.4,0,0.2,1)',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.transform = 'translateY(-2px)'
        el.style.boxShadow = t.shadowMd
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = t.shadowSm
      }}
    >
      {/* Top accent line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: c.accent, opacity: 0.7 }} />

      {/* Icon */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '0.75rem',
          background: c.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 22, height: 22, fill: 'none', stroke: c.color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
          <path d={paths[icon] ?? paths.accounts} />
        </svg>
      </div>

      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0 }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: t.textMuted, textTransform: 'capitalize' }}>{label}</span>
        <strong style={{ fontSize: '1.5rem', fontWeight: 700, color: t.textPrimary, lineHeight: 1.25, letterSpacing: '-0.02em' }}>{value}</strong>
        <small style={{ fontSize: '0.75rem', color: t.textTertiary, fontWeight: 500 }}>Live view</small>
      </div>
    </div>
  )
}

function Button({
  children,
  variant = 'secondary',
  disabled = false,
  onClick,
  style = {},
  t,
}: {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  disabled?: boolean
  onClick?: () => void
  style?: React.CSSProperties
  t: typeof tokens.light
}) {
  const [hovered, setHovered] = useState(false)

  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: '0.875rem',
    fontWeight: 600,
    lineHeight: 1,
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    border: '1px solid transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 120ms cubic-bezier(0.4,0,0.2,1)',
    whiteSpace: 'nowrap',
    position: 'relative',
    overflow: 'hidden',
    outline: 'none',
    opacity: disabled ? 0.5 : 1,
    transform: hovered && !disabled ? 'translateY(-1px)' : 'translateY(0)',
    ...style,
  }

  const primary: React.CSSProperties = {
    background: t.brand600,
    color: '#ffffff',
    borderColor: t.brand600,
    boxShadow: hovered && !disabled
      ? `0 4px 12px rgba(79,70,229,0.25), ${t.shadowSm}`
      : `0 1px 2px 0 rgba(79,70,229,0.20), ${t.shadowSm}`,
  }

  const secondary: React.CSSProperties = {
    background: t.bgSurface,
    color: t.textSecondary,
    borderColor: t.borderDefault,
    boxShadow: hovered && !disabled ? t.shadowSm : 'none',
  }

  const variantStyle = variant === 'primary' ? primary : secondary

  return (
    <button
      type={variant === 'primary' ? 'submit' : 'button'}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ ...base, ...variantStyle }}
      onFocus={(e) => { e.currentTarget.style.boxShadow = `0 0 0 3px ${t.brand500}33, ${variantStyle.boxShadow ?? 'none'}` }}
      onBlur={(e) => { e.currentTarget.style.boxShadow = variantStyle.boxShadow ?? 'none' }}
    >
      {children}
    </button>
  )
}

function FormInput({
  label,
  value,
  onChange,
  required = false,
  type = 'text',
  t,
}: {
  label: string
  value: string
  onChange: (val: string) => void
  required?: boolean
  type?: 'text' | 'select'
  t: typeof tokens.light
}) {
  const [focused, setFocused] = useState(false)

  const inputBase: React.CSSProperties = {
    display: 'block',
    width: '100%',
    marginTop: '0.5rem',
    padding: '0.5rem 0.75rem',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: '0.875rem',
    color: t.textPrimary,
    background: focused ? t.bgSurface : t.bgElevated,
    border: `1px solid ${focused ? t.brand500 : t.borderDefault}`,
    borderRadius: '0.5rem',
    outline: 'none',
    transition: 'border-color 120ms, box-shadow 120ms, background 120ms',
    boxShadow: focused ? `0 0 0 3px ${t.brand500}1f` : 'none',
  }

  return (
    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: t.textSecondary, marginBottom: '1rem' }}>
      {label}
      {type === 'select' ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            ...inputBase,
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 10px center',
            paddingRight: '2rem',
            cursor: 'pointer',
          }}
        >
          <option value="Asset">Asset</option>
          <option value="Contra-Asset">Contra-Asset</option>
          <option value="Liability">Liability</option>
          <option value="Equity">Equity</option>
          <option value="Income">Income</option>
          <option value="Expense">Expense</option>
        </select>
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={inputBase}
        />
      )}
    </label>
  )
}

function StateCard({
  title,
  message,
  hint,
  variant,
  t,
}: {
  title: string
  message: string
  hint?: string
  variant: 'loading' | 'error' | 'empty'
  t: typeof tokens.light
}) {
  const bgMap = {
    loading: t.bgSurface,
    error: t.error50,
    empty: t.bgInset,
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '4rem 1.5rem',
        gap: '0.5rem',
        minHeight: 320,
        background: bgMap[variant],
      }}
    >
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: t.textPrimary, margin: 0 }}>{title}</h2>
      <p style={{ fontSize: '0.875rem', color: t.textSecondary, margin: 0, maxWidth: 360 }}>{message}</p>
      {hint && <p style={{ fontSize: '0.75rem', color: t.textMuted, margin: '0.5rem 0 0' }}>{hint}</p>}
    </div>
  )
}

// -- Main Page ------------------------------------------------
export function AccountantCoaPage() {
  const isDark = useDarkMode()
  const { isDesktop, isPhone } = useViewport()
  const t = isDark ? tokens.dark : tokens.light

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
      return <StateCard title="Loading chart of accounts" message="The account list is being fetched." variant="loading" t={t} />
    }

    if (error) {
      return <StateCard title="Unable to load chart of accounts" message={error} hint="The backend may not expose the expected RPC payload yet." variant="error" t={t} />
    }

    if (!accounts.length) {
      return <StateCard title="No accounts found" message="No accounts are available yet." variant="empty" t={t} />
    }

    return (
      <div style={{ background: t.bgSurface, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.875rem' }}>
          <thead>
            <tr>
              {['Code', 'Name', 'Type', 'Reporting Group', 'Status', 'Actions'].map((h) => (
                <th
                  key={h}
                  style={{
                    background: t.bgInset,
                    color: t.textMuted,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '0.75rem 1rem',
                    textAlign: 'left',
                    borderBottom: `1px solid ${t.borderSubtle}`,
                    whiteSpace: 'nowrap',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr
                key={account.account_id ?? account.id ?? account.name}
                style={{ transition: 'background 120ms' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = t.bgSurfaceRaised === t.bgSurface ? t.bgInset : t.bgSurfaceRaised }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              >
                <td style={{ padding: '0.75rem 1rem', borderBottom: `1px solid ${t.borderSubtle}`, fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace", fontSize: '0.75rem', color: t.textPrimary, fontWeight: 500 }}>
                  {account.code ?? '---'}
                </td>
                <td style={{ padding: '0.75rem 1rem', borderBottom: `1px solid ${t.borderSubtle}`, color: t.textPrimary, fontWeight: 500 }}>
                  {account.name ?? '---'}
                </td>
                <td style={{ padding: '0.75rem 1rem', borderBottom: `1px solid ${t.borderSubtle}`, color: t.textSecondary }}>
                  {account.type ?? '---'}
                </td>
                <td style={{ padding: '0.75rem 1rem', borderBottom: `1px solid ${t.borderSubtle}`, color: t.textSecondary }}>
                  {account.reporting_group ?? '---'}
                </td>
                <td style={{ padding: '0.75rem 1rem', borderBottom: `1px solid ${t.borderSubtle}`, fontWeight: 600, fontSize: '0.75rem', color: account.is_postable === false ? t.error500 : t.success500 }}>
                  {account.is_postable === false ? 'Inactive' : 'Active'}
                </td>
                <td style={{ padding: '0.75rem 1rem', borderBottom: `1px solid ${t.borderSubtle}`, whiteSpace: 'nowrap' }}>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setActiveId(account.account_id ?? account.id ?? null)
                      setForm({
                        name: account.name ?? '',
                        type: account.type ?? 'Asset',
                        reporting_group: account.reporting_group ?? '',
                        payment_method_type: account.payment_method_type ?? '',
                        account_number: account.account_number ?? '',
                        provider_name: account.provider_name ?? '',
                      })
                    }}
                    t={t}
                    style={{ marginRight: '0.5rem' }}
                  >
                    Edit
                  </Button>
                  <Button variant="secondary" onClick={() => void handleDeactivate(account.account_id ?? account.id ?? '')} t={t}>
                    Deactivate
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  // -- Render ---------------------------------------------------
  return (
    <article style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: t.textPrimary, background: t.bgBody, minHeight: '100vh', lineHeight: 1.5, WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' }}>
      {/* Header */}
      <header style={{ background: t.bgSurface, borderBottom: `1px solid ${t.borderSubtle}`, padding: '2rem 1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${t.brand500}, ${t.brand500}aa, ${t.brand600})` }} />
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.12em', color: t.brand500, margin: '0 0 0.5rem' }}>Accounting Workspace</p>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, lineHeight: 1.25, color: t.textPrimary, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>Chart of Accounts</h1>
          <p style={{ fontSize: '1rem', color: t.textSecondary, margin: 0, maxWidth: 560, lineHeight: 1.625 }}>Keep the core ledger structure clear, balanced, and easy to maintain.</p>
        </div>
      </header>

      {/* Stats */}
      <section aria-label="Accounting metrics" style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4, 1fr)' : isPhone ? '1fr' : 'repeat(2, 1fr)', gap: '1rem', padding: '1.5rem', maxWidth: 1400, margin: '0 auto' }}>
        <MetricCard label="Accounts" value={String(accounts.length)} tone="blue" icon="accounts" t={t} />
        <MetricCard label="Active" value={String(accounts.filter((account) => account.is_postable !== false).length)} tone="green" icon="active" t={t} />
        <MetricCard label="Total Balance" value={formatMoneyGhs(totalBalance)} tone="purple" icon="balance" t={t} />
        <MetricCard label="Mode" value={activeId ? 'Edit' : 'Create'} tone="orange" icon="mode" t={t} />
      </section>

      {/* Main Card */}
      <section style={{ background: t.bgSurface, border: `1px solid ${t.borderSubtle}`, borderRadius: '1.25rem', margin: '0 1.5rem 2rem', maxWidth: 1400, boxShadow: t.shadowSm, overflow: 'hidden', marginLeft: 'auto', marginRight: 'auto' }}>
        {/* Card Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', padding: '1.5rem', borderBottom: `1px solid ${t.borderSubtle}`, background: `linear-gradient(180deg, ${t.bgSurface} 0%, ${t.bgSurfaceRaised} 100%)`, flexDirection: isPhone ? 'column' : 'row' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: t.textPrimary, margin: '0 0 0.25rem', lineHeight: 1.375 }}>Account Registry</h2>
            <p style={{ fontSize: '0.875rem', color: t.textSecondary, margin: 0 }}>Create, review, and update the accounts that drive the books.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, justifyContent: isPhone ? 'flex-end' : undefined }}>
            <Button variant="secondary" onClick={() => void loadAccounts()} t={t}>Refresh</Button>
            <Button variant="primary" onClick={() => { setActiveId(null); setForm(emptyForm()) }} t={t}>New account</Button>
          </div>
        </div>

        {/* Content Row: Form + Table */}
        <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '380px 1fr' : '1fr', minHeight: 0 }}>
          {/* Form Panel */}
          <div style={{ background: t.bgSurfaceRaised, borderRight: isDesktop ? `1px solid ${t.borderSubtle}` : 'none', borderBottom: isDesktop ? 'none' : `1px solid ${t.borderSubtle}`, padding: '1.5rem' }}>
            <div style={{ fontSize: '1.125rem', fontWeight: 600, color: t.textPrimary, margin: '0 0 1.25rem', paddingBottom: '0.75rem', borderBottom: `2px solid ${t.brand500}`, display: 'inline-block' }}>
              {activeId ? 'Update Account' : 'Create Account'}
            </div>

            <form onSubmit={(event) => void handleSubmit(event)}>
              <div style={{ fontSize: '0.75rem', color: t.textMuted, background: t.info50, border: `1px solid ${t.info50 === t.bgSurface ? t.borderSubtle : t.info50.replace('0.15', '0.20')}`, borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem', lineHeight: 1.375 }}>
                Account code is assigned by the server and is not entered here.
              </div>

              <FormInput label="Name" value={form.name} onChange={(v) => setForm((c) => ({ ...c, name: v }))} required t={t} />
              <FormInput label="Type" value={form.type} onChange={(v) => setForm((c) => ({ ...c, type: v }))} type="select" t={t} />
              <FormInput label="Reporting Group" value={form.reporting_group} onChange={(v) => setForm((c) => ({ ...c, reporting_group: v }))} required t={t} />
              <FormInput label="Payment Method Type" value={form.payment_method_type} onChange={(v) => setForm((c) => ({ ...c, payment_method_type: v }))} t={t} />
              <FormInput label="Account Number" value={form.account_number} onChange={(v) => setForm((c) => ({ ...c, account_number: v }))} t={t} />
              <FormInput label="Provider Name" value={form.provider_name} onChange={(v) => setForm((c) => ({ ...c, provider_name: v }))} t={t} />

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Button variant="primary" disabled={submitting} t={t}>
                  {submitting ? 'Saving...' : activeId ? 'Save Changes' : 'Create Account'}
                </Button>
                {activeId && (
                  <Button variant="secondary" onClick={() => { setActiveId(null); setForm(emptyForm()) }} t={t}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Table Panel */}
          <div style={{ background: t.bgSurface, overflowX: 'auto' }}>
            {content()}
          </div>
        </div>
      </section>
    </article>
  )
}