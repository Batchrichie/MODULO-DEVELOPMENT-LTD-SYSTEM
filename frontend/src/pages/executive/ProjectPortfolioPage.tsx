import { Fragment, useEffect, useState } from 'react'
import { formatMoneyGhs, formatCount } from '../../lib/formatMoney'
import { fetchMyProjects, fetchProjectProfitability, type PmProject, type ProjectProfitability } from '../../lib/rpc/projectManager'
import { EmptyState } from '../../components/EmptyState'
import { FormErrorBanner } from '../../components/FormErrorBanner'
import '../../styles/executive-dashboard.css'

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty' }
  | { status: 'success'; projects: PmProject[] }

type ProfitState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: ProjectProfitability }
  | { status: 'error'; message: string }

export function ProjectPortfolioPage() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [profitability, setProfitability] = useState<Record<string, ProfitState>>({})

  useEffect(() => {
    let active = true

    async function load() {
      const result = await fetchMyProjects()
      if (!active) return

      if (!result.ok) {
        setState({ status: 'error', message: result.error })
        return
      }

      if (!result.data || result.data.length === 0) {
        setState({ status: 'empty' })
        return
      }

      setState({ status: 'success', projects: result.data })
    }

    void load()
    return () => {
      active = false
    }
  }, [])

  const toggleProject = async (project: PmProject) => {
    const projectId = project.project_id ?? project.id ?? ''
    if (!projectId) return

    setExpanded((current) => ({ ...current, [projectId]: !current[projectId] }))

    if (profitability[projectId]?.status !== 'idle' && profitability[projectId]?.status !== undefined) {
      return
    }

    setProfitability((current) => ({ ...current, [projectId]: { status: 'loading' } }))
    const result = await fetchProjectProfitability(projectId)
    if (!result.ok) {
      setProfitability((current) => ({ ...current, [projectId]: { status: 'error', message: result.error } }))
      return
    }

    setProfitability((current) => ({ ...current, [projectId]: { status: 'success', data: result.data } }))
  }

  const summary = (projects: PmProject[]) => {
    const count = projects.length
    const totalValue = projects.reduce((sum, project) => sum + (project.contract_value ?? 0), 0)
    return {
      count,
      totalValue,
    }
  }

  if (state.status === 'loading') {
    return (
      <article className="exec-dash exec-screen" role="status" aria-live="polite">
        <header className="exec-screen__header">
          <p className="exec-dash__breadcrumb">Executive Dashboard</p>
          <h1>Project Portfolio</h1>
          <p>All projects and profitability metrics for CEO review.</p>
        </header>

        <section className="exec-dash__kpi-grid">
          {['Projects', 'Contract Value'].map((label) => (
            <div key={label} className="exec-dash__kpi exec-dash__kpi--skeleton">
              <span className="exec-dash__kpi-label">{label}</span>
              <span className="exec-dash__skeleton-bar">​</span>
            </div>
          ))}
        </section>

        <div className="exec-screen__state-card exec-screen__state-card--empty">
          <p>Loading project portfolio…</p>
        </div>
      </article>
    )
  }

  if (state.status === 'error') {
    return (
      <article className="exec-dash exec-screen" role="alert">
        <header className="exec-screen__header">
          <p className="exec-dash__breadcrumb">Executive Dashboard</p>
          <h1>Project Portfolio</h1>
          <p>All projects and profitability metrics for CEO review.</p>
        </header>

        <FormErrorBanner message={state.message} label="Unable to load projects" />
      </article>
    )
  }

  if (state.status === 'empty') {
    return (
      <article className="exec-dash exec-screen">
        <header className="exec-screen__header">
          <p className="exec-dash__breadcrumb">Executive Dashboard</p>
          <h1>Project Portfolio</h1>
          <p>All projects and profitability metrics for CEO review.</p>
        </header>

        <EmptyState
          title="No projects available"
          description="There are currently no projects to display in the executive portfolio."
        />
      </article>
    )
  }

  const data = state.projects
  const totals = summary(data)

  return (
    <article className="exec-dash exec-screen">
      <header className="exec-screen__header">
        <p className="exec-dash__breadcrumb">Executive Dashboard</p>
        <h1>Project Portfolio</h1>
        <p>All projects and profitability metrics for CEO review.</p>
      </header>

      <section className="exec-dash__kpi-grid">
        <div className="exec-dash__kpi">
          <span className="exec-dash__kpi-label">Total Projects</span>
          <div className="exec-dash__kpi-value">{formatCount(totals.count)}</div>
        </div>
        <div className="exec-dash__kpi">
          <span className="exec-dash__kpi-label">Contract Value</span>
          <div className="exec-dash__kpi-value">{formatMoneyGhs(totals.totalValue)}</div>
        </div>
      </section>

      <div className="table-wrapper">
        <table className="data-table" aria-label="Project portfolio">
          <thead>
            <tr>
              <th>Project</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Contract Value</th>
              <th>Expected Completion</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {data.map((project, index) => {
              const projectId = project.project_id ?? project.id ?? ''
              const key = projectId || `${project.name ?? 'project'}-${index}`
              const isOpen = !!expanded[projectId]
              const profitState = profitability[projectId] ?? { status: 'idle' }

              return (
                <Fragment key={key}>
                  <tr>
                    <td>{project.name ?? 'Unnamed project'}</td>
                    <td>{project.customer_id ?? 'Unknown'}</td>
                    <td>{project.status ?? 'Unknown'}</td>
                    <td className="data-table__num">{formatMoneyGhs(project.contract_value)}</td>
                    <td>{project.expected_completion ?? 'Unknown'}</td>
                    <td>
                      <button
                        type="button"
                        className="button button--secondary"
                        onClick={() => toggleProject(project)}
                        aria-expanded={isOpen}
                      >
                        {isOpen ? 'Hide' : 'View'} profitability
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="exec-screen__expand-row">
                      <td colSpan={6}>
                        <section className="exec-screen__panel exec-screen__panel--standalone">
                          {profitState.status === 'loading' ? (
                            <p>Loading profitability details…</p>
                          ) : profitState.status === 'error' ? (
                            <div className="exec-dash__state-card exec-dash__state-card--error">
                              <p>{profitState.message}</p>
                            </div>
                          ) : profitState.status === 'success' ? (
                            <div className="exec-screen__definition-list">
                              <div>
                                <dt>Revenue recognized</dt>
                                <dd>{formatMoneyGhs(profitState.data.revenue_recognized_to_date)}</dd>
                              </div>
                              <div>
                                <dt>Expenses</dt>
                                <dd>{formatMoneyGhs(profitState.data.expenses_to_date)}</dd>
                              </div>
                              <div>
                                <dt>Gross profit</dt>
                                <dd>{formatMoneyGhs(profitState.data.gross_profit)}</dd>
                              </div>
                              <div>
                                <dt>Margin</dt>
                                <dd>{profitState.data.gross_margin_pct != null ? `${profitState.data.gross_margin_pct.toFixed(2)}%` : '—'}</dd>
                              </div>
                              <div>
                                <dt>WIP drawn down</dt>
                                <dd>{formatMoneyGhs(profitState.data.wip_drawn_down_via_invoicing)}</dd>
                              </div>
                              <div>
                                <dt>WIP balance</dt>
                                <dd>{formatMoneyGhs(profitState.data.wip_balance_undrawn)}</dd>
                              </div>
                            </div>
                          ) : (
                            <p>No profitability details available.</p>
                          )}
                        </section>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </article>
  )
}
