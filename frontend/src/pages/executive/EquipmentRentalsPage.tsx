import { useEffect, useMemo, useState } from 'react'
import { formatMoneyGhs } from '../../lib/formatMoney'
import { fetchRentalContracts, type RentalContract } from '../../lib/rpc/accountant'
import { EmptyState } from '../../components/EmptyState'
import { FormErrorBanner } from '../../components/FormErrorBanner'
import '../../styles/executive-dashboard.css'

function formatCount(value: number): string {
  return value.toLocaleString('en-US')
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty' }
  | { status: 'success'; contracts: RentalContract[] }

export function EquipmentRentalsPage() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    let active = true

    async function load() {
      const result = await fetchRentalContracts()
      if (!active) return

      if (!result.ok) {
        setState({ status: 'error', message: result.error })
        return
      }

      if (!result.data || result.data.length === 0) {
        setState({ status: 'empty' })
        return
      }

      setState({ status: 'success', contracts: result.data })
    }

    void load()
    return () => {
      active = false
    }
  }, [])

  const summary = useMemo(() => {
    if (state.status !== 'success') {
      return { activeCount: 0, monthlyValue: 0 }
    }

    const activeContracts = state.contracts.filter(
      (contract) => String(contract.status ?? '').toLowerCase() === 'active',
    )
    const monthlyValue = state.contracts.reduce((sum, contract) => sum + (contract.rate ?? 0), 0)
    return { activeCount: activeContracts.length, monthlyValue }
  }, [state])

  if (state.status === 'loading') {
    return (
      <article className="exec-dash exec-screen" role="status" aria-live="polite">
        <header className="exec-screen__header">
          <p className="exec-dash__breadcrumb">Executive Dashboard</p>
          <h1>Equipment Rentals</h1>
          <p>Overview of rental contracts for CEO review.</p>
        </header>

        <section className="exec-dash__kpi-grid">
          {['Active Contracts', 'Monthly Rental Value'].map((label) => (
            <div key={label} className="exec-dash__kpi exec-dash__kpi--skeleton">
              <span className="exec-dash__kpi-label">{label}</span>
              <span className="exec-dash__skeleton-bar">​</span>
            </div>
          ))}
        </section>

        <div className="exec-screen__state-card exec-screen__state-card--empty">
          <p>Loading rental contracts…</p>
        </div>
      </article>
    )
  }

  if (state.status === 'error') {
    return (
      <article className="exec-dash exec-screen" role="alert">
        <header className="exec-screen__header">
          <p className="exec-dash__breadcrumb">Executive Dashboard</p>
          <h1>Equipment Rentals</h1>
          <p>Overview of rental contracts for CEO review.</p>
        </header>

        <FormErrorBanner message={state.message} label="Unable to load rental contracts" />
      </article>
    )
  }

  if (state.status === 'empty') {
    return (
      <article className="exec-dash exec-screen">
        <header className="exec-screen__header">
          <p className="exec-dash__breadcrumb">Executive Dashboard</p>
          <h1>Equipment Rentals</h1>
          <p>Overview of rental contracts for CEO review.</p>
        </header>

        <EmptyState
          title="No rental contracts found"
          description="There are no rental contracts available for the equipment rentals overview."
        />
      </article>
    )
  }

  const contracts = state.contracts

  return (
    <article className="exec-dash exec-screen">
      <header className="exec-screen__header">
        <p className="exec-dash__breadcrumb">Executive Dashboard</p>
        <h1>Equipment Rentals</h1>
        <p>Overview of rental contracts for CEO review.</p>
      </header>

      <section className="exec-dash__kpi-grid">
        <div className="exec-dash__kpi">
          <span className="exec-dash__kpi-label">Total Active Contracts</span>
          <div className="exec-dash__kpi-value">{formatCount(summary.activeCount)}</div>
        </div>
        <div className="exec-dash__kpi">
          <span className="exec-dash__kpi-label">Total Monthly Rental Value</span>
          <div className="exec-dash__kpi-value">{formatMoneyGhs(summary.monthlyValue)}</div>
        </div>
      </section>

      <div className="table-wrapper">
        <table className="data-table" aria-label="Rental contracts">
          <thead>
            <tr>
              <th>Contract</th>
              <th>Equipment</th>
              <th>Customer</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Rate</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((contract) => (
              <tr key={contract.contract_id ?? contract.id ?? contract.equipment_id ?? Math.random()}>
                <td>{contract.contract_id ?? contract.id ?? 'Unknown'}</td>
                <td>
                  {typeof contract['equipment_name'] === 'string' && contract['equipment_name']
                    ? contract['equipment_name']
                    : typeof contract.equipment_id === 'string' && contract.equipment_id
                      ? contract.equipment_id
                      : 'Unknown'}
                  {typeof contract['description'] === 'string' && contract['description'] ? (
                    <div className="exec-screen__note">{contract['description']}</div>
                  ) : null}
                </td>
                <td>{contract.customer_id ?? 'Unknown'}</td>
                <td>{contract.start_date ?? 'Unknown'}</td>
                <td>{contract.end_date ?? 'Unknown'}</td>
                <td className="data-table__num">{formatMoneyGhs(contract.rate)}</td>
                <td>{typeof contract.status === 'string' && contract.status ? contract.status : 'Unknown'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  )
}
