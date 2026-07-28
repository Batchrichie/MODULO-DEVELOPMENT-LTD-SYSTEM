import { useEffect, useState } from 'react'
import { formatMoneyGhs } from '../../lib/formatMoney'
import { getRecords, reportBudgetVsActual } from '../../lib/rpc/accountant'
import { PendingBackendNotice } from '../../components/PendingBackendNotice'
import '../../styles/executive-dashboard.css'

interface Project {
  project_id?: string
  id?: string
  project_name?: string | null
}

export function AccountantBudgetVsActualPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [report, setReport] = useState<{
    project_id?: string
    project_name?: string
    total_budget?: number
    total_actual?: number
    variance?: number
    variance_pct?: number | null
    limitation?: string | null
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingReport, setLoadingReport] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void loadProjects()
  }, [])

  async function loadProjects() {
    setLoading(true)
    setError(null)
    const result = await getRecords<Project[]>('projects', 1, 200)
    if (result.ok) {
      setProjects(result.data)
    } else {
      setError(result.error)
      setProjects([])
    }
    setLoading(false)
  }

  async function loadReport() {
    if (!selectedProject) return
    setLoadingReport(true)
    setError(null)
    setReport(null)

    const result = await reportBudgetVsActual(selectedProject)
    if (result.ok) {
      setReport(result.data)
    } else {
      setError(result.error)
      setReport(null)
    }
    setLoadingReport(false)
  }

  if (loading) {
    return (
      <article className="admin-dashboard" role="status">
        <header className="admin-dashboard__header">
          <div>
            <p className="admin-dashboard__eyebrow">Accounting Workspace</p>
            <h1>Budget vs Actual</h1>
            <p>Compare planned budgets against actual delivery for a project.</p>
          </div>
        </header>
        <section className="users-card"><div className="exec-dash__state-card"><h2 className="exec-dash__state-title">Loading projects</h2><p className="exec-dash__state-message">Fetching available projects for budget reporting.</p></div></section>
      </article>
    )
  }

  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Accounting Workspace</p>
          <h1>Budget vs Actual</h1>
          <p>Compare planned budgets against actual delivery for a project.</p>
        </div>
      </header>

      <section className="users-card">
        <div className="users-card__header">
          <div>
            <h2>Budget report</h2>
            <p>Project-level totals-only budget vs actual reporting.</p>
          </div>
          <div className="users-card__actions">
            <label className="form-field" style={{ margin: 0, width: '100%', minWidth: 0 }}>
              <span className="form-field__label">Project</span>
              <select value={selectedProject} onChange={(event) => setSelectedProject(event.target.value)}>
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.project_id ?? project.id} value={project.project_id ?? project.id}>{project.project_name ?? project.project_id ?? 'Unnamed project'}</option>
                ))}
              </select>
            </label>
            <button type="button" className="button button--primary" onClick={() => void loadReport()} disabled={!selectedProject || loadingReport}>
              {loadingReport ? 'Loading…' : 'Load report'}
            </button>
          </div>
        </div>

        <PendingBackendNotice
          inline
          title="Simplified reporting"
          description="This page uses the backend's totals-only budget vs actual endpoint. Category breakdown is pending a richer reporting API."
          className="pending-backend--standalone"
        />

        {error ? (
          <div className="exec-dash__state-card exec-dash__state-card--error"><h2 className="exec-dash__state-title">Unable to load report</h2><p className="exec-dash__state-message">{error}</p></div>
        ) : loadingReport ? (
          <div className="exec-dash__state-card"><h2 className="exec-dash__state-title">Loading report</h2><p className="exec-dash__state-message">Requesting budget vs actual for the selected project.</p></div>
        ) : !report ? (
          <div className="exec-dash__state-card exec-dash__state-card--empty"><h2 className="exec-dash__state-title">No report selected</h2><p className="exec-dash__state-message">Select a project and click Load report to view totals.</p></div>
        ) : (
          <div className="exec-dash__panel exec-dash__panel--standalone">
            <div className="exec-dash__panel-title">Result summary</div>
            <div className="summary-box">
              <div className="summary-box__row"><span className="summary-box__label">Project</span><span className="summary-box__value">{report.project_name ?? report.project_id ?? '—'}</span></div>
              <div className="summary-box__row"><span className="summary-box__label">Total budget</span><span className="summary-box__value data-table__num">{formatMoneyGhs(report.total_budget ?? 0)}</span></div>
              <div className="summary-box__row"><span className="summary-box__label">Total actual</span><span className="summary-box__value data-table__num">{formatMoneyGhs(report.total_actual ?? 0)}</span></div>
              <div className="summary-box__row"><span className="summary-box__label">Variance</span><span className="summary-box__value data-table__num">{formatMoneyGhs(report.variance ?? 0)}</span></div>
              <div className="summary-box__row summary-box__row--total"><span className="summary-box__label">Variance %</span><span className="summary-box__value data-table__num">{typeof report.variance_pct === 'number' ? `${report.variance_pct.toFixed(2)}%` : '—'}</span></div>
            </div>
            {report.limitation && <p className="summary-box__note">{report.limitation}</p>}
          </div>
        )}
      </section>
    </article>
  )
}
