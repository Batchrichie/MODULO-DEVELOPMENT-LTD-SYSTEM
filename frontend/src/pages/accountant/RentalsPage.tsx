import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { EmptyState } from '../../components/EmptyState'
import { Modal } from '../../components/Modal'
import { SearchField } from '../../components/SearchField'
import { deriveStatusBadgeFromState, StatusBadge } from '../../components/StatusBadge'
import { formatMoneyGhs } from '../../lib/formatMoney'
import {
  fetchTaxRates,
  getRecords,
  normalizeTaxRates,
  rentalInvoiceCreate,
  type RentalContract,
  type TaxRates,
} from '../../lib/rpc/accountant'
import '../../styles/executive-dashboard.css'

interface EquipmentRecord {
  equipment_id?: string
  id?: string
  name?: string | null
  category?: string | null
  status?: string | null
}

interface RentalInvoiceFormState {
  contract_id: string
  days: string
  rate_override: string
  apply_vat: boolean
  apply_nhil: boolean
  apply_getfund: boolean
}

const emptyForm = (): RentalInvoiceFormState => ({
  contract_id: '',
  days: '1',
  rate_override: '',
  apply_vat: false,
  apply_nhil: false,
  apply_getfund: false,
})

export function RentalsPage() {
  const [equipment, setEquipment] = useState<EquipmentRecord[]>([])
  const [contracts, setContracts] = useState<RentalContract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contractsNote, setContractsNote] = useState<string | null>(null)
  const [taxError, setTaxError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<RentalInvoiceFormState>(emptyForm())
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [taxRates, setTaxRates] = useState<TaxRates>({})

  useEffect(() => {
    void loadPageData()
  }, [])

  async function loadPageData() {
    setLoading(true)
    setError(null)
    setContractsNote(null)
    setTaxError(null)

    const [equipmentResult, contractsResult, taxResult] = await Promise.all([
      getRecords<EquipmentRecord[]>('equipment', 1, 100),
      getRecords<RentalContract[]>('rental_contracts', 1, 100),
      fetchTaxRates(),
    ])

    if (equipmentResult.ok) {
      setEquipment(equipmentResult.data)
    } else {
      setError(equipmentResult.error)
      setEquipment([])
    }

    if (contractsResult.ok) {
      setContracts(contractsResult.data)
      if (!contractsResult.data.length) {
        setContractsNote('No rental contracts are currently available from the backend list, so the selector will remain empty until a contract exists.')
      }
    } else {
      setContracts([])
      setContractsNote(`Rental contract lookup is backend-dependent in this environment: ${contractsResult.error}`)
    }

    if (taxResult.ok) {
      setTaxRates(normalizeTaxRates(taxResult.data))
    } else {
      setTaxRates({})
      setTaxError(taxResult.error)
    }

    setLoading(false)
  }

  const filteredEquipment = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return equipment
    return equipment.filter((item) =>
      (item.name ?? '').toLowerCase().includes(q) ||
      (item.category ?? '').toLowerCase().includes(q) ||
      (item.status ?? '').toLowerCase().includes(q)
    )
  }, [equipment, searchQuery])

  const selectedContract = useMemo(() => {
    if (!form.contract_id) return null
    return contracts.find((contract) => contract.contract_id === form.contract_id || contract.id === form.contract_id) ?? null
  }, [contracts, form.contract_id])

  const days = Number(form.days || 0)
  const overrideRate = form.rate_override.trim() === '' ? null : Number(form.rate_override)
  const effectiveRate = overrideRate ?? Number(selectedContract?.rate ?? 0)
  const subtotal = days * effectiveRate
  const vatRate = taxRates.VAT ?? 0
  const nhilRate = taxRates.NHIL ?? 0
  const getfundRate = taxRates.GETFund ?? 0
  const taxAmount = (form.apply_vat ? subtotal * vatRate : 0) + (form.apply_nhil ? subtotal * nhilRate : 0) + (form.apply_getfund ? subtotal * getfundRate : 0)
  const totalWithTaxes = subtotal + taxAmount

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setFormError(null)
    setStatusMessage(null)

    if (!form.contract_id) {
      setFormError('Select an existing rental contract before posting an invoice.')
      setSubmitting(false)
      return
    }

    if (!days || days <= 0) {
      setFormError('Enter a valid number of billing days.')
      setSubmitting(false)
      return
    }

    if (overrideRate !== null && overrideRate < 0) {
      setFormError('The optional rate override must be zero or greater.')
      setSubmitting(false)
      return
    }

    const result = await rentalInvoiceCreate({
      contractId: form.contract_id,
      days,
      applyVat: form.apply_vat,
      applyNhil: form.apply_nhil,
      applyGetfund: form.apply_getfund,
      rateOverride: overrideRate ?? undefined,
    })

    if (result.ok) {
      const invoiceId = result.data.invoice_number ?? result.data.invoice_id ?? '—'
      setStatusMessage(`Rental invoice ${invoiceId} posted — ${formatMoneyGhs(result.data.amount_due ?? totalWithTaxes)}`)
      setShowModal(false)
      setForm(emptyForm())
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
            <p className="admin-dashboard__eyebrow">Asset Management</p>
            <h1>Equipment Rentals</h1>
            <p>Manage equipment rental contracts and rental invoicing.</p>
          </div>
        </header>
        <section className="users-card"><div className="exec-dash__state-card"><h2 className="exec-dash__state-title">Loading rental data</h2><p className="exec-dash__state-message">Fetching equipment, rental contracts, and tax settings.</p></div></section>
      </article>
    )
  }

  if (error) {
    return (
      <article className="admin-dashboard">
        <header className="admin-dashboard__header">
          <div>
            <p className="admin-dashboard__eyebrow">Asset Management</p>
            <h1>Equipment Rentals</h1>
            <p>Manage equipment rental contracts and rental invoicing.</p>
          </div>
        </header>
        <section className="users-card"><div className="exec-dash__state-card exec-dash__state-card--error"><h2 className="exec-dash__state-title">Unable to load equipment</h2><p className="exec-dash__state-message">{error}</p></div></section>
      </article>
    )
  }

  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Asset Management</p>
          <h1>Equipment Rentals</h1>
          <p>Manage equipment rental contracts and rental invoicing.</p>
        </div>
      </header>

      <section className="users-card">
        <div className="users-card__header">
          <div>
            <h2>Rental Management</h2>
            <p>Create rental invoices for existing contracts using the accountant-only posting flow.</p>
          </div>
          <div className="users-card__actions">
            <button type="button" className="button button--primary" onClick={() => { setForm(emptyForm()); setFormError(null); setShowModal(true) }}>
              Create rental invoice
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="exec-dash__state-card exec-dash__state-card--success exec-dash__state-card--inline">
            <h2 className="exec-dash__state-title">Success</h2>
            <p className="exec-dash__state-message">{statusMessage}</p>
          </div>
        )}

        {contractsNote && (
          <div className="exec-dash__state-card exec-dash__state-card--warning exec-dash__state-card--inline">
            <h2 className="exec-dash__state-title">Contract availability note</h2>
            <p className="exec-dash__state-message">{contractsNote}</p>
          </div>
        )}

        {taxError && (
          <div className="exec-dash__state-card exec-dash__state-card--warning exec-dash__state-card--inline">
            <h2 className="exec-dash__state-title">Tax settings unavailable</h2>
            <p className="exec-dash__state-message">{taxError}</p>
          </div>
        )}

        <div className="exec-dash__row">
          <section className="exec-dash__panel">
            <div className="exec-dash__panel-title">Rental Contracts</div>
            {!contracts.length ? (
              <EmptyState
                icon="🧾"
                title="No rental contracts available"
                description="Create a rental contract first in the separate contract workflow; this ticket only wires invoice posting for existing contracts."
              />
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Contract</th>
                      <th>Rate / day</th>
                      <th>Dates</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contracts.map((contract) => (
                      <tr key={contract.contract_id ?? contract.id ?? 'contract'}>
                        <td>{contract.contract_id ?? contract.id ?? '—'}</td>
                        <td>{formatMoneyGhs(Number(contract.rate ?? 0))}</td>
                        <td>{[contract.start_date, contract.end_date].filter(Boolean).join(' → ') || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="exec-dash__panel">
            <div className="exec-dash__panel-title">Rental Invoicing</div>
            <p className="exec-dash__empty-inline">Use the button above to create a rental invoice. The modal previews the invoice total before posting and supports optional rate overrides for a single invoice.</p>
          </section>
        </div>
      </section>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Create Rental Invoice"
        subtitle="Post a rental invoice for an existing contract and preview the total before submission."
        maxWidth={760}
        footer={(
          <>
            <button type="button" className="button button--secondary" onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button type="submit" className="button button--primary" disabled={submitting} form="rental-invoice-form">
              {submitting ? 'Posting…' : 'Post Rental Invoice'}
            </button>
          </>
        )}
      >
        <form id="rental-invoice-form" onSubmit={(event) => void handleSubmit(event)}>
          {formError && (
            <div className="exec-dash__state-card exec-dash__state-card--error exec-dash__state-card--inline">
              <h2 className="exec-dash__state-title">Error</h2>
              <p className="exec-dash__state-message">{formError}</p>
            </div>
          )}

          <div className="form-grid">
            <label className="form-field">
              <span className="form-field__label">Rental contract *</span>
              <select
                value={form.contract_id}
                onChange={(event) => setForm((current) => ({ ...current, contract_id: event.target.value }))}
                disabled={!contracts.length}
                required
              >
                <option value="">{contracts.length ? 'Select a rental contract' : 'No rental contracts available'}</option>
                {contracts.map((contract) => (
                  <option key={contract.contract_id ?? contract.id ?? 'contract'} value={contract.contract_id ?? contract.id ?? ''}>
                    {contract.contract_id ?? contract.id ?? 'Contract'}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span className="form-field__label">Billing days *</span>
              <input
                type="number"
                min="1"
                step="1"
                value={form.days}
                onChange={(event) => setForm((current) => ({ ...current, days: event.target.value }))}
                required
              />
            </label>
          </div>

          <label className="form-field">
            <span className="form-field__label">Rate override (per day)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.rate_override}
              onChange={(event) => setForm((current) => ({ ...current, rate_override: event.target.value }))}
              placeholder="Leave blank to use the contract rate"
            />
          </label>

          {selectedContract && (
            <div className="summary-box">
              <div className="summary-box__row">
                <span>Contract rate</span>
                <strong>{formatMoneyGhs(Number(selectedContract.rate ?? 0))}/day</strong>
              </div>
              <div className="summary-box__row">
                <span>Billing days</span>
                <strong>{days}</strong>
              </div>
              <div className="summary-box__row">
                <span>Base amount</span>
                <strong>{formatMoneyGhs(subtotal)}</strong>
              </div>
              <div className="summary-box__row">
                <span>VAT</span>
                <strong>{formatMoneyGhs(form.apply_vat ? subtotal * vatRate : 0)}</strong>
              </div>
              <div className="summary-box__row">
                <span>NHIL</span>
                <strong>{formatMoneyGhs(form.apply_nhil ? subtotal * nhilRate : 0)}</strong>
              </div>
              <div className="summary-box__row">
                <span>GETFund</span>
                <strong>{formatMoneyGhs(form.apply_getfund ? subtotal * getfundRate : 0)}</strong>
              </div>
              <div className="summary-box__row summary-box__row--total">
                <span>Preview total</span>
                <strong>{formatMoneyGhs(totalWithTaxes)}</strong>
              </div>
              <p className="summary-box__note">The preview uses the contract rate unless you enter an override for this invoice only.</p>
            </div>
          )}

          <fieldset className="form-fieldset">
            <legend className="form-fieldset__legend">Tax toggles</legend>
            <label className="form-fieldset__checkbox">
              <input type="checkbox" checked={form.apply_vat} onChange={(event) => setForm((current) => ({ ...current, apply_vat: event.target.checked }))} />
              Apply VAT ({(vatRate * 100).toFixed(2)}%)
            </label>
            <label className="form-fieldset__checkbox">
              <input type="checkbox" checked={form.apply_nhil} onChange={(event) => setForm((current) => ({ ...current, apply_nhil: event.target.checked }))} />
              Apply NHIL ({(nhilRate * 100).toFixed(2)}%)
            </label>
            <label className="form-fieldset__checkbox">
              <input type="checkbox" checked={form.apply_getfund} onChange={(event) => setForm((current) => ({ ...current, apply_getfund: event.target.checked }))} />
              Apply GETFund ({(getfundRate * 100).toFixed(2)}%)
            </label>
          </fieldset>
        </form>
      </Modal>

      <section className="users-card">
        <div className="users-card__header">
          <div>
            <h2>Available Equipment</h2>
            <p>This list pulls from the generic equipment resource and displays items associated with the broader rental program.</p>
          </div>
        </div>

        <div className="exec-dash__row">
          <div className="exec-dash__panel">
            <div className="registry-toolbar">
              <div className="registry-toolbar__search-row">
                <SearchField value={searchQuery} onChange={setSearchQuery} placeholder="Search equipment by name, category, or status…" />
              </div>
              <div className="registry-toolbar__actions">
                <button type="button" className="button button--secondary" onClick={() => void loadPageData()}>Refresh</button>
              </div>
            </div>

            {!equipment.length ? (
              <EmptyState
                icon="🚜"
                title="No equipment found"
                description="No equipment records are currently available."
              />
            ) : !filteredEquipment.length ? (
              <EmptyState
                icon="🔎"
                title="No matching equipment"
                description={`No equipment matches the current search (${searchQuery}).`}
              />
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEquipment.map((item) => {
                      const statusBadge = deriveStatusBadgeFromState(item.status ?? 'Unknown')
                      return (
                        <tr key={item.equipment_id ?? item.id ?? item.name}>
                          <td><strong style={{ display: 'block' }}>{item.name ?? '—'}</strong></td>
                          <td>{item.category ?? '—'}</td>
                          <td className="data-table__cell--status">
                            <StatusBadge label={statusBadge.label} tone={statusBadge.tone} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </article>
  )
}
