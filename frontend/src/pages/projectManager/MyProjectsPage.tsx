import { useEffect, useState } from 'react'
import { getRecords } from '../../lib/rpc/accountant'
import '../../styles/executive-dashboard.css'

interface Project {
  project_id?: string
  id?: string
  project_name?: string | null
  expected_completion?: string | null
  total_budget?: number | null
  total_actual?: number | null
}

export function MyProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  if (loading) {
    return (
      <article className="admin-dashboard">
        <header className="admin-dashboard__header">
          <div>
            <p className="admin-dashboard__eyebrow">Project Manager</p>
            <h1>My Projects</h1>
            <p>Projects assigned to you as project manager.</p>
          </div>
        </header>
        <section className="users-card"><div className="exec-dash__state-card"><h2 className="exec-dash__state-title">Loading projects</h2><p className="exec-dash__state-message">Fetching your projects from the backend.</p></div></section>
      </article>
    )
  }

  if (error) {
    return (
      <article className="admin-dashboard">
        <header className="admin-dashboard__header">
          <div>
            <p className="admin-dashboard__eyebrow">Project Manager</p>
            <h1>My Projects</h1>
            <p>Projects assigned to you as project manager.</p>
          </div>
        </header>
        <section className="users-card"><div className="exec-dash__state-card exec-dash__state-card--error"><h2 className="exec-dash__state-title">Unable to load projects</h2><p className="exec-dash__state-message">{error}</p></div></section>
      </article>
    )
  }

  if (!projects.length) {
    return (
      <article className="admin-dashboard">
        <header className="admin-dashboard__header">
          <div>
            <p className="admin-dashboard__eyebrow">Project Manager</p>
            <h1>My Projects</h1>
            <p>Projects assigned to you as project manager.</p>
          </div>
        </header>
        <section className="users-card"><div className="exec-dash__state-card exec-dash__state-card--empty"><h2 className="exec-dash__state-title">No projects found</h2><p className="exec-dash__state-message">You currently have no projects assigned. If this seems incorrect, contact your administrator.</p></div></section>
      </article>
    )
  }

  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Project Manager</p>
          <h1>My Projects</h1>
          <p>Projects assigned to you as project manager.</p>
        </div>
      </header>

      <section className="users-card">
        <div className="users-card__header">
          <div>
            <h2>Active Projects</h2>
            <p>List of projects you manage. Backend enforces ownership scoping server-side.</p>
          </div>
          <div className="users-card__actions">
            <button type="button" className="button button--secondary" onClick={() => void loadProjects()}>Refresh</button>
          </div>
        </div>

        <div style={{ overflowX: 'auto', padding: '0 21px 21px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Project</th>
                <th style={{ textAlign: 'left', padding: '0.5rem' }}>Expected Completion</th>
                <th style={{ textAlign: 'right', padding: '0.5rem' }}>Budget</th>
                <th style={{ textAlign: 'right', padding: '0.5rem' }}>Actual</th>
                <th style={{ textAlign: 'right', padding: '0.5rem' }}>Variance</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.project_id ?? p.id}>
                  <td style={{ padding: '0.5rem' }}>{p.project_name ?? '—'}</td>
                  <td style={{ padding: '0.5rem' }}>{p.expected_completion ?? '—'}</td>
                  <td style={{ textAlign: 'right', padding: '0.5rem' }}>{typeof p.total_budget === 'number' ? p.total_budget.toFixed(2) : '—'}</td>
                  <td style={{ textAlign: 'right', padding: '0.5rem' }}>{typeof p.total_actual === 'number' ? p.total_actual.toFixed(2) : '—'}</td>
                  <td style={{ textAlign: 'right', padding: '0.5rem' }}>{typeof p.total_budget === 'number' && typeof p.total_actual === 'number' ? (p.total_budget - p.total_actual).toFixed(2) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </article>
  )
}
