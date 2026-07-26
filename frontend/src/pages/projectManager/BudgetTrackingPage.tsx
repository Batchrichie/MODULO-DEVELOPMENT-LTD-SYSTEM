import { useEffect, useState } from 'react'
import { getRecords, reportBudgetVsActual } from '../../lib/rpc/accountant'
import { PendingBackendNotice } from '../../components/PendingBackendNotice'
import '../../styles/executive-dashboard.css'

interface Project {
  project_id?: string
  id?: string
  project_name?: string | null
}

export function BudgetTrackingPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [report, setReport] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingReport, setLoadingReport] = useState(false)

  useEffect(() => {
    void loadProjects()
  }, [])

  async function loadProjects() {
    setLoading(true)
    setError(null)
    const result = await getRecords<Project[]>('projects', 1, 100)
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
      <article className="admin-dashboard">
        <header className="admin-dashboard__header">
          <div>
            <p className="admin-dashboard__eyebrow">Project Manager</p>
            <h1>Budget Tracking</h1>
            <p>View total budget vs actual for a project.</p>
          </div>
        </header>
        <section className="users-card"><div className="exec-dash__state-card"><h2 className="exec-dash__state-title">Loading projects</h2><p className="exec-dash__state-message">Fetching projects available for budget reporting.</p></div></section>
      </article>
    )
  }

  if (error) {
    return (
      <article className="admin-dashboard">
        <header className="admin-dashboard__header">
          <div>
            <p className="admin-dashboard__eyebrow">Project Manager</p>
            <h1>Budget Tracking</h1>
            <p>View total budget vs actual for a project.</p>
          </div>
        </header>
        <section className="users-card"><div className="exec-dash__state-card exec-dash__state-card--error"><h2 className="exec-dash__state-title">Unable to load</h2><p className="exec-dash__state-message">{error}</p></div></section>
      </article>
    )
  }

  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Project Manager</p>
          <h1>Budget Tracking</h1>
          <p>View total budget vs actual for a project.</p>
        </div>
      </header>

      <section className="users-card">
        <div className="users-card__header">
          <div>
            <h2>Budget vs Actual</h2>
            <p>Totals-only budget vs actual, as provided by the backend.</p>
          </div>
          <div className="users-card__actions">
            <label className="form-field" style={{ margin: 0, width: '100%', minWidth: 0 }}>
              <span className="form-field__label">Project</span>
              <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}>
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p.project_id ?? p.id} value={p.project_id ?? p.id}>{p.project_name}</option>
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
          title="Reporting scope"
          description="Total only — category breakdown pending Phase Two"
          className="pending-backend--standalone"
        />

        {loadingReport ? (
          <div className="exec-dash__state-card"><h2 className="exec-dash__state-title">Loading report</h2><p className="exec-dash__state-message">Requesting budget vs actual for the selected project.</p></div>
        ) : !report ? (
          <div className="exec-dash__state-card exec-dash__state-card--empty"><h2 className="exec-dash__state-title">No report</h2><p className="exec-dash__state-message">Select a project and click Load to view totals-only budget tracking.</p></div>
        ) : (
          <div className="exec-dash__panel--standalone">
            <div className="summary-box">
              <div className="summary-box__row">
                <span className="summary-box__label">Project</span>
                <span className="summary-box__value">{report.project_name ?? report.project_id}</span>
              </div>
              <div className="summary-box__row">
                <span className="summary-box__label">Total Budget</span>
                <span className="summary-box__value data-table__num">{typeof report.total_budget === 'number' ? report.total_budget.toFixed(2) : '—'}</span>
              </div>
              <div className="summary-box__row">
                <span className="summary-box__label">Total Actual</span>
                <span className="summary-box__value data-table__num">{typeof report.total_actual === 'number' ? report.total_actual.toFixed(2) : '—'}</span>
              </div>
              <div className="summary-box__row">
                <span className="summary-box__label">Variance</span>
                <span className="summary-box__value data-table__num">{typeof report.variance === 'number' ? report.variance.toFixed(2) : '—'}</span>
              </div>
              <div className="summary-box__row summary-box__row--total">
                <span className="summary-box__label">Variance %</span>
                <span className="summary-box__value data-table__num">{typeof report.variance_pct === 'number' ? `${report.variance_pct.toFixed(2)}%` : '—'}</span>
              </div>
            </div>
            {report.limitation && <p className="summary-box__note">{report.limitation}</p>}
          </div>
        )}
      </section>
    </article>
  )
}
