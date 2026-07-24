import { useEffect, useMemo, useState } from 'react'
import { getRecords } from '../../lib/rpc/accountant'
import { EmptyState } from '../../components/EmptyState'
import { PendingBackendNotice } from '../../components/PendingBackendNotice'
import { SearchField } from '../../components/SearchField'
import { deriveStatusBadgeFromState, StatusBadge } from '../../components/StatusBadge'
import '../../styles/executive-dashboard.css'

interface EquipmentRecord {
  equipment_id?: string
  id?: string
  name?: string | null
  category?: string | null
  status?: string | null
}

export function RentalsPage() {
  const [equipment, setEquipment] = useState<EquipmentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    void loadEquipment()
  }, [])

  async function loadEquipment() {
    setLoading(true)
    setError(null)
    const result = await getRecords<EquipmentRecord[]>('equipment', 1, 100)
    if (result.ok) {
      setEquipment(result.data)
    } else {
      setError(result.error)
      setEquipment([])
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
        <section className="users-card"><div className="exec-dash__state-card"><h2 className="exec-dash__state-title">Loading equipment</h2><p className="exec-dash__state-message">Fetching equipment records from the generic resource endpoint.</p></div></section>
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
            <p>Equipment rentals and rental invoicing features are pending backend support.</p>
          </div>
          <div className="users-card__actions">
            <button
              type="button"
              className="button button--primary"
              disabled
              title="Create rental invoice — pending backend rental_invoice_create RPC"
            >
              Create rental invoice
            </button>
          </div>
        </div>

        <div className="exec-dash__row">
          <section className="exec-dash__panel">
            <div className="exec-dash__panel-title">Rental Contracts</div>
            <PendingBackendNotice
              inline
              title="Rental contracts pending backend"
              description="Rental contract management is not yet available in the backend API. When implemented, this panel will display active rental agreements, terms, and payment schedules."
            />
          </section>

          <section className="exec-dash__panel">
            <div className="exec-dash__panel-title">Rental Invoicing</div>
            <PendingBackendNotice
              inline
              title="Rental invoicing disabled"
              description="Rental invoice creation and management will be available once the backend rental_invoice_create RPC is deployed. The button above is intentionally disabled."
            />
          </section>
        </div>
      </section>

      <section className="users-card">
        <div className="users-card__header">
          <div>
            <h2>Available Equipment</h2>
            <p>This list pulls from the generic `equipment` resource and displays items available for potential rental programs.</p>
          </div>
        </div>

        <div className="exec-dash__row">
          <div className="exec-dash__panel">
            <div className="registry-toolbar">
              <div className="registry-toolbar__search-row">
                <SearchField value={searchQuery} onChange={setSearchQuery} placeholder="Search equipment by name, category, or status…" />
              </div>
              <div className="registry-toolbar__actions">
                <button type="button" className="button button--secondary" onClick={() => void loadEquipment()}>Refresh</button>
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
