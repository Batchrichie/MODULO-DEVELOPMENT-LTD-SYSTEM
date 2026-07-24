import { useEffect, useMemo, useState } from 'react'
import { formatMoneyGhs } from '../../lib/formatMoney'
import { supabase } from '../../lib/supabase'
import '../../styles/executive-dashboard.css'

/**
 * Helper to unwrap RPC envelope and extract real errors from business-logic failures.
 */
function unwrapRpcResponse<T>(data: unknown): { ok: boolean; value: T | null; error: string | null } {
  const envelope = data as { success?: boolean; data: T; error?: { code: string; message: string } | null } | null
  if (!envelope) {
    return { ok: false, value: null, error: 'No response from server' }
  }
  if (envelope.success === false) {
    return { ok: false, value: null, error: envelope.error?.message ?? 'Unknown error' }
  }
  return { ok: true, value: envelope.data, error: null }
}

interface AssetRecord {
  asset_id?: string
  id?: string
  name?: string | null
  category?: string | null
  cost?: number | null
  useful_life_years?: number | null
  acquisition_date?: string | null
  status?: string | null
}

interface AssetCreateForm {
  name: string
  category: string
  cost: string
  useful_life_years: string
  acquisition_date: string
  status: string
  depreciation_method: string
  coa_asset_account: string
  coa_accum_dep_account: string
  settlement_method: 'credit' | 'bank' | ''
  settlement_account_id: string
}

const emptyAssetForm = (): AssetCreateForm => ({
  name: '',
  category: '',
  cost: '',
  useful_life_years: '',
  acquisition_date: new Date().toISOString().slice(0, 10),
  status: 'Active',
  depreciation_method: '',
  coa_asset_account: '',
  coa_accum_dep_account: '',
  settlement_method: 'credit',
  settlement_account_id: '',
})

export function AssetRegisterPage() {
  const [assets, setAssets] = useState<AssetRecord[]>([])
  const [accountOptions, setAccountOptions] = useState<any[]>([])
  const [settlementAccounts, setSettlementAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDisposeModal, setShowDisposeModal] = useState(false)
  const [assetForm, setAssetForm] = useState<AssetCreateForm>(emptyAssetForm())
  const [disposeAssetId, setDisposeAssetId] = useState('')
  const [disposeAssetName, setDisposeAssetName] = useState('')
  const [disposeProceeds, setDisposeProceeds] = useState('')
  const [disposeDate, setDisposeDate] = useState(new Date().toISOString().slice(0, 10))
  const [disposeSettlementAccountId, setDisposeSettlementAccountId] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)

  useEffect(() => {
    void loadAssets()
  }, [])

  async function loadAssets() {
    setLoading(true)
    setError(null)

    const [assetsResult, accountsResult, settlementAccountsResult] = await Promise.all([
      supabase.schema('api').rpc('get_records', {
        p_resource: 'assets',
        p_page: 1,
        p_limit: 100,
      }),
      supabase.schema('api').rpc('get_records', {
        p_resource: 'accounts',
        p_page: 1,
        p_limit: 200,
      }),
      supabase.schema('api').rpc('list_payment_method_accounts'),
    ])

    if (assetsResult.error) {
      setError(assetsResult.error.message)
      setAssets([])
    } else {
      const unwrapped = unwrapRpcResponse(assetsResult.data)
      if (!unwrapped.ok) {
        setError(unwrapped.error)
        setAssets([])
      } else {
        setAssets(Array.isArray(unwrapped.value) ? unwrapped.value : [])
      }
    }

    if (accountsResult.error) {
      setError((current) => current ? `${current}; ${accountsResult.error.message}` : accountsResult.error.message)
      setAccountOptions([])
    } else {
      const unwrapped = unwrapRpcResponse(accountsResult.data)
      if (!unwrapped.ok) {
        setError((current) => current ? `${current}; ${unwrapped.error}` : unwrapped.error)
        setAccountOptions([])
      } else {
        setAccountOptions(Array.isArray(unwrapped.value) ? unwrapped.value : [])
      }
    }

    if (settlementAccountsResult.error) {
      setError((current) => current ? `${current}; ${settlementAccountsResult.error.message}` : settlementAccountsResult.error.message)
      setSettlementAccounts([])
    } else {
      const unwrapped = unwrapRpcResponse(settlementAccountsResult.data)
      if (!unwrapped.ok) {
        setError((current) => current ? `${current}; ${unwrapped.error}` : unwrapped.error)
        setSettlementAccounts([])
      } else {
        setSettlementAccounts(Array.isArray(unwrapped.value) ? unwrapped.value : [])
      }
    }

    setLoading(false)
  }

  const assetAccounts = useMemo(() => {
    return accountOptions.filter((account) => account.type === 'Asset')
  }, [accountOptions])

  const contraAssetAccounts = useMemo(() => {
    return accountOptions.filter((account) => account.type === 'Contra-Asset')
  }, [accountOptions])

  const disposalProceeds = Number(disposeProceeds || 0)
  const requiresSettlementAccount = disposalProceeds > 0

  async function handleCreateAsset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setFormError(null)
    setStatusMessage(null)

    if (!assetForm.coa_asset_account) {
      setFormError('Select an Asset-type Chart of Accounts entry for coa_asset_account.')
      setSubmitting(false)
      return
    }

    if (!assetForm.coa_accum_dep_account) {
      setFormError('Select a Contra-Asset-type Chart of Accounts entry for coa_accum_dep_account.')
      setSubmitting(false)
      return
    }

    if (assetForm.settlement_method === 'bank' && !assetForm.settlement_account_id) {
      setFormError('Choose a settlement account when the settlement method is Paid now (Bank/MoMo/Cash).')
      setSubmitting(false)
      return
    }

    const payload: Record<string, unknown> = {
      name: assetForm.name,
      cost: Number(assetForm.cost || 0),
      acquisition_date: assetForm.acquisition_date,
      status: assetForm.status,
      coa_asset_account: assetForm.coa_asset_account,
      coa_accum_dep_account: assetForm.coa_accum_dep_account,
      settlement: assetForm.settlement_method === 'bank'
        ? { method: 'bank', settlement_account_id: assetForm.settlement_account_id }
        : { method: 'credit' },
    }

    if (assetForm.category.trim()) payload.category = assetForm.category.trim()
    if (assetForm.useful_life_years.trim()) payload.useful_life_years = Number(assetForm.useful_life_years)
    if (assetForm.depreciation_method.trim()) payload.depreciation_method = assetForm.depreciation_method.trim()

    const { data, error } = await supabase.schema('api').rpc('assets_create', {
      p_payload: payload,
    })

    if (error) {
      setFormError(error.message)
    } else {
      const unwrapped = unwrapRpcResponse(data)
      if (!unwrapped.ok) {
        setFormError(unwrapped.error)
      } else {
        setStatusMessage('Asset acquired successfully.')
        setAssetForm(emptyAssetForm())
        setShowCreateModal(false)
        await loadAssets()
      }
    }

    setSubmitting(false)
  }

  async function handleDisposeAsset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setFormError(null)
    setStatusMessage(null)

    if (requiresSettlementAccount && !disposeSettlementAccountId) {
      setFormError('Choose a settlement account because disposal proceeds are greater than zero.')
      setSubmitting(false)
      return
    }

    const payload: Record<string, unknown> = {
      disposal_date: disposeDate || undefined,
    }

    if (disposalProceeds > 0) {
      payload.disposal_proceeds = disposalProceeds
      payload.settlement_account_id = disposeSettlementAccountId
    }

    const { data, error } = await supabase.schema('api').rpc('assets_dispose', {
      p_id: disposeAssetId,
      p_payload: payload,
    })

    if (error) {
      setFormError(error.message)
    } else {
      const unwrapped = unwrapRpcResponse(data)
      if (!unwrapped.ok) {
        setFormError(unwrapped.error)
      } else {
        const disposalData = unwrapped.value as Record<string, unknown> | null
        const gainLossValue = disposalData?.gain_loss ?? disposalData?.profit_loss ?? disposalData?.amount
        const gainLossText = typeof gainLossValue === 'number' ? ` — gain/loss: ${formatMoneyGhs(gainLossValue)}` : ''
        setStatusMessage(`Asset disposed successfully${gainLossText}.`)
        setDisposeAssetId('')
        setDisposeAssetName('')
        setDisposeProceeds('')
        setDisposeDate(new Date().toISOString().slice(0, 10))
        setDisposeSettlementAccountId('')
        setShowDisposeModal(false)
        await loadAssets()
      }
    }

    setSubmitting(false)
  }

  function openDisposeModal(asset: AssetRecord) {
    setDisposeAssetId(asset.asset_id ?? asset.id ?? '')
    setDisposeAssetName(asset.name ?? 'Unnamed asset')
    setDisposeProceeds('')
    setDisposeDate(new Date().toISOString().slice(0, 10))
    setDisposeSettlementAccountId('')
    setShowDisposeModal(true)
  }

  if (loading) {
    return <article className="admin-dashboard"><header className="admin-dashboard__header"><div><p className="admin-dashboard__eyebrow">Asset Management</p><h1>Asset Register</h1><p>Review acquired fixed assets and their current status.</p></div></header><section className="users-card"><div className="exec-dash__state-card"><h2 className="exec-dash__state-title">Loading asset register</h2><p className="exec-dash__state-message">Fetching the asset registry from the generic resource RPC.</p></div></section></article>
  }

  if (error) {
    return <article className="admin-dashboard"><header className="admin-dashboard__header"><div><p className="admin-dashboard__eyebrow">Asset Management</p><h1>Asset Register</h1><p>Review acquired fixed assets and their current status.</p></div></header><section className="users-card"><div className="exec-dash__state-card exec-dash__state-card--error"><h2 className="exec-dash__state-title">Unable to load asset register</h2><p className="exec-dash__state-message">{error}</p></div></section></article>
  }

  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Asset Management</p>
          <h1>Asset Register</h1>
          <p>Review acquired fixed assets and their current status.</p>
        </div>
      </header>

      <section className="users-card">
        <div className="users-card__header">
          <div>
            <h2>Registered assets</h2>
            <p>The screen reads from the generic `assets` resource and is currently a review/completion pass.</p>
          </div>
          <div className="users-card__actions">
            <button type="button" className="button button--secondary" onClick={() => void loadAssets()}>Refresh</button>
            <button type="button" className="button button--primary" onClick={() => setShowCreateModal(true)}>Acquire asset</button>
          </div>
        </div>

        {statusMessage && <div className="exec-dash__state-card" style={{ marginBottom: '1rem' }}><h2 className="exec-dash__state-title">RPC response</h2><p className="exec-dash__state-message">{statusMessage}</p></div>}

        {formError && <div className="exec-dash__state-card exec-dash__state-card--error" style={{ marginBottom: '1rem' }}><h2 className="exec-dash__state-title">Form error</h2><p className="exec-dash__state-message">{formError}</p></div>}

        {!assets.length ? (
          <div className="exec-dash__state-card exec-dash__state-card--empty"><h2 className="exec-dash__state-title">No assets found</h2><p className="exec-dash__state-message">No fixed assets are currently available through the generic assets resource.</p></div>
        ) : (
          <div style={{ overflowX: 'auto', padding: '0 21px 21px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Category</th>
                  <th style={{ textAlign: 'right', padding: '0.5rem' }}>Cost</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Useful life</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Acquired</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '0.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr key={asset.asset_id ?? asset.id ?? asset.name}>
                    <td style={{ padding: '0.5rem' }}>{asset.name ?? '—'}</td>
                    <td style={{ padding: '0.5rem' }}>{asset.category ?? '—'}</td>
                    <td style={{ textAlign: 'right', padding: '0.5rem' }}>{formatMoneyGhs(Number(asset.cost ?? 0) || 0)}</td>
                    <td style={{ padding: '0.5rem' }}>{asset.useful_life_years ?? '—'}</td>
                    <td style={{ padding: '0.5rem' }}>{asset.acquisition_date ?? '—'}</td>
                    <td style={{ padding: '0.5rem' }}>{asset.status ?? '—'}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <button type="button" className="button button--secondary" onClick={() => openDisposeModal(asset)}>Dispose</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 14, 26, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 1000 }}>
          <div style={{ width: '100%', maxWidth: 640, background: 'var(--surface)', borderRadius: 16, padding: '1rem', boxShadow: '0 20px 45px rgba(0,0,0,0.35)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>Acquire asset</h2>
              <button type="button" className="button button--secondary" onClick={() => setShowCreateModal(false)}>Close</button>
            </div>
            <form onSubmit={(event) => void handleCreateAsset(event)}>
              {formError && <div style={{ background: 'rgba(255, 64, 64, 0.1)', border: '1px solid #ff4040', color: '#ff4040', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}><strong>Error:</strong> {formError}</div>}
              <label>
                Name
                <input value={assetForm.name} onChange={(event) => setAssetForm((current) => ({ ...current, name: event.target.value }))} required style={{ display: 'block', width: '100%', marginTop: '0.25rem', marginBottom: '0.75rem' }} />
              </label>
              <label>
                Category
                <input value={assetForm.category} onChange={(event) => setAssetForm((current) => ({ ...current, category: event.target.value }))} required style={{ display: 'block', width: '100%', marginTop: '0.25rem', marginBottom: '0.75rem' }} />
              </label>
              <label>
                Cost
                <input type="number" value={assetForm.cost} onChange={(event) => setAssetForm((current) => ({ ...current, cost: event.target.value }))} required style={{ display: 'block', width: '100%', marginTop: '0.25rem', marginBottom: '0.75rem' }} />
              </label>
              <label>
                Useful life years
                <input type="number" value={assetForm.useful_life_years} onChange={(event) => setAssetForm((current) => ({ ...current, useful_life_years: event.target.value }))} required style={{ display: 'block', width: '100%', marginTop: '0.25rem', marginBottom: '0.75rem' }} />
              </label>
              <label>
                Acquisition date
                <input type="date" value={assetForm.acquisition_date} onChange={(event) => setAssetForm((current) => ({ ...current, acquisition_date: event.target.value }))} required style={{ display: 'block', width: '100%', marginTop: '0.25rem', marginBottom: '0.75rem' }} />
              </label>
              <label>
                Depreciation method
                <input value={assetForm.depreciation_method} onChange={(event) => setAssetForm((current) => ({ ...current, depreciation_method: event.target.value }))} style={{ display: 'block', width: '100%', marginTop: '0.25rem', marginBottom: '0.75rem' }} />
              </label>
              <label>
                Asset account (Asset)
                <select value={assetForm.coa_asset_account} onChange={(event) => setAssetForm((current) => ({ ...current, coa_asset_account: event.target.value }))} required style={{ display: 'block', width: '100%', marginTop: '0.25rem', marginBottom: '0.75rem' }}>
                  <option value="">Select asset account</option>
                  {assetAccounts.map((account) => (
                    <option key={account.account_id ?? account.id ?? account.name} value={account.account_id ?? account.id ?? ''}>
                      {account.name ?? 'Unnamed account'} ({account.code ?? '—'})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Accumulated depreciation account (Contra-Asset)
                <select value={assetForm.coa_accum_dep_account} onChange={(event) => setAssetForm((current) => ({ ...current, coa_accum_dep_account: event.target.value }))} required style={{ display: 'block', width: '100%', marginTop: '0.25rem', marginBottom: '0.75rem' }}>
                  <option value="">Select accumulated depreciation account</option>
                  {contraAssetAccounts.map((account) => (
                    <option key={account.account_id ?? account.id ?? account.name} value={account.account_id ?? account.id ?? ''}>
                      {account.name ?? 'Unnamed account'} ({account.code ?? '—'})
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Settlement method
                <select value={assetForm.settlement_method} onChange={(event) => setAssetForm((current) => ({ ...current, settlement_method: event.target.value as 'credit' | 'bank' | '' }))} style={{ display: 'block', width: '100%', marginTop: '0.25rem', marginBottom: '0.75rem' }}>
                  <option value="credit">On credit (Accounts Payable)</option>
                  <option value="bank">Paid now (Bank/MoMo/Cash)</option>
                </select>
              </label>
              {assetForm.settlement_method === 'bank' && (
                <label>
                  Settlement account
                  <select value={assetForm.settlement_account_id} onChange={(event) => setAssetForm((current) => ({ ...current, settlement_account_id: event.target.value }))} required style={{ display: 'block', width: '100%', marginTop: '0.25rem', marginBottom: '0.75rem' }}>
                    <option value="">Select settlement account</option>
                    {settlementAccounts.map((account) => (
                      <option key={account.account_id ?? account.id ?? account.name} value={account.account_id ?? account.id ?? ''}>
                        {account.name ?? 'Unnamed account'} ({account.payment_method_type ?? 'Unknown'})
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label>
                Status
                <select value={assetForm.status} onChange={(event) => setAssetForm((current) => ({ ...current, status: event.target.value }))} style={{ display: 'block', width: '100%', marginTop: '0.25rem', marginBottom: '0.75rem' }}>
                  <option value="Active">Active</option>
                  <option value="Disposed">Disposed</option>
                </select>
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="button button--secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="button button--primary" disabled={submitting}>{submitting ? 'Saving…' : 'Create asset'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDisposeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 14, 26, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 1000 }}>
          <div style={{ width: '100%', maxWidth: 460, background: 'var(--surface)', borderRadius: 16, padding: '1rem', boxShadow: '0 20px 45px rgba(0,0,0,0.35)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>Dispose asset</h2>
              <button type="button" className="button button--secondary" onClick={() => setShowDisposeModal(false)}>Close</button>
            </div>
            <form onSubmit={(event) => void handleDisposeAsset(event)}>
              {formError && <div style={{ background: 'rgba(255, 64, 64, 0.1)', border: '1px solid #ff4040', color: '#ff4040', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}><strong>Error:</strong> {formError}</div>}
              <p style={{ marginTop: 0, marginBottom: '0.75rem' }}><strong>Asset:</strong> {disposeAssetName}</p>
              <label>
                Disposal proceeds
                <input type="number" value={disposeProceeds} onChange={(event) => setDisposeProceeds(event.target.value)} min="0" style={{ display: 'block', width: '100%', marginTop: '0.25rem', marginBottom: '0.75rem' }} />
              </label>
              <label>
                Disposal date
                <input type="date" value={disposeDate} onChange={(event) => setDisposeDate(event.target.value)} style={{ display: 'block', width: '100%', marginTop: '0.25rem', marginBottom: '0.75rem' }} />
              </label>
              {requiresSettlementAccount && (
                <label>
                  Settlement account
                  <select value={disposeSettlementAccountId} onChange={(event) => setDisposeSettlementAccountId(event.target.value)} required style={{ display: 'block', width: '100%', marginTop: '0.25rem', marginBottom: '0.75rem' }}>
                    <option value="">Select settlement account</option>
                    {settlementAccounts.map((account) => (
                      <option key={account.account_id ?? account.id ?? account.name} value={account.account_id ?? account.id ?? ''}>
                        {account.name ?? 'Unnamed account'} ({account.payment_method_type ?? 'Unknown'})
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="button" className="button button--secondary" onClick={() => setShowDisposeModal(false)}>Cancel</button>
                <button type="submit" className="button button--primary" disabled={submitting}>{submitting ? 'Disposing…' : 'Dispose asset'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </article>
  )
}
