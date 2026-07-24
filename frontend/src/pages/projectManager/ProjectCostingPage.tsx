import { useEffect, useState } from 'react'
import { formatMoneyGhs } from '../../lib/formatMoney'
import { getRecords, fetchProjectProfitability, type ProjectProfitability } from '../../lib/rpc/accountant'
import type { PmProject } from '../../lib/rpc/projectManager'
import '../../styles/executive-dashboard.css'

export function ProjectCostingPage() {
  const [projects, setProjects] = useState<PmProject[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [projectId, setProjectId] = useState('')

  const [report, setReport] = useState<ProjectProfitability | null>(null)
  const [loadingReport, setLoadingReport] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void loadProjects()
  }, [])

  useEffect(() => {
    if (projectId) void loadReport(projectId)
    else setReport(null)
  }, [projectId])

  async function loadProjects() {
    setLoadingProjects(true)
    const res = await getRecords<PmProject[]>('projects', 1, 100)
    if (res.ok) {
      setProjects(res.data)
      if (res.data.length === 1) {
        const only = res.data[0]
        setProjectId((only.project_id ?? only.id ?? '') as string)
      }
    } else {
      setError(res.error)
    }
    setLoadingProjects(false)
  }

  async function loadReport(id: string) {
    setLoadingReport(true)
    setError(null)
    const res = await fetchProjectProfitability(id)
    if (res.ok) {
      setReport(res.data)
    } else {
      setError(res.error)
      setReport(null)
    }
    setLoadingReport(false)
  }

  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Project Manager Workspace</p>
          <h1>Project Costing</h1>
          <p>Read-only. Revenue recognized to date, costs to date, and WIP position for a project you manage.</p>
        </div>
      </header>

      <section className="users-card">
        <div className="users-card__header">
          <div>
            <h2>Select a Project</h2>
            <p>Sourced from <code>report_project_profitability()</code>, confirmed live to allow the ProjectManager role, scoped to your own projects.</p>
          </div>
        </div>

        <div className="exec-dash__panel" style={{ margin: '0 21px 21px' }}>
          <label style={{ display: 'block', maxWidth: '420px' }}>
            Project
            <select
              value={projectId}
              onChange={(event) => setProjectId(event.target.value)}
              disabled={loadingProjects}
              style={{ display: 'block', width: '100%', marginTop: '0.25rem', padding: '0.5rem' }}
            >
              <option value="">{loadingProjects ? 'Loading projects…' : 'Select a project'}</option>
              {projects.map((project) => (
                <option key={project.project_id ?? project.id} value={project.project_id ?? project.id}>
                  {project.name ?? '—'}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loadingReport && (
          <div className="exec-dash__state-card"><p className="exec-dash__state-message">Loading costing report…</p></div>
        )}

        {!loadingReport && error && (
          <div className="exec-dash__state-card exec-dash__state-card--error"><p className="exec-dash__state-message">{error}</p></div>
        )}

        {!loadingReport && !error && projectId && !report && (
          <div className="exec-dash__state-card exec-dash__state-card--empty"><p className="exec-dash__state-message">No profitability data returned for this project.</p></div>
        )}

        {!loadingReport && report && (
          <section className="admin-dashboard__stats" aria-label="Project costing metrics" style={{ padding: '0 21px 21px' }}>
            <div className="stat-card"><div className="stat-card__content"><span>Contract Value</span><strong>{formatMoneyGhs(report.contract_value ?? 0)}</strong></div></div>
            <div className="stat-card"><div className="stat-card__content"><span>Revenue Recognized</span><strong>{formatMoneyGhs(report.revenue_recognized_to_date ?? 0)}</strong></div></div>
            <div className="stat-card"><div className="stat-card__content"><span>Expenses to Date</span><strong>{formatMoneyGhs(report.expenses_to_date ?? 0)}</strong></div></div>
            <div className="stat-card">
              <div className="stat-card__content">
                <span>Gross Profit</span>
                <strong>{formatMoneyGhs(report.gross_profit ?? 0)}</strong>
                {report.gross_margin_pct != null && <small>{report.gross_margin_pct}% margin</small>}
              </div>
            </div>
            <div className="stat-card"><div className="stat-card__content"><span>WIP Drawn Down (Invoiced)</span><strong>{formatMoneyGhs(report.wip_drawn_down_via_invoicing ?? 0)}</strong></div></div>
            <div className="stat-card"><div className="stat-card__content"><span>WIP Balance Undrawn</span><strong>{formatMoneyGhs(report.wip_balance_undrawn ?? 0)}</strong></div></div>
          </section>
        )}
      </section>
    </article>
  )
}
