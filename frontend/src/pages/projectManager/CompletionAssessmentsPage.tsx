import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../../components/Modal'
import { getRecords, completionAssessmentSubmit } from '../../lib/rpc/accountant'
import { EmptyState } from '../../components/EmptyState'
import { SearchField } from '../../components/SearchField'
import '../../styles/executive-dashboard.css'

interface Project {
  project_id?: string
  id?: string
  name?: string | null
}

export function CompletionAssessmentsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7))
  const [percent, setPercent] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    void loadProjects()
  }, [])

  useEffect(() => {
    if (!showModal) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setShowModal(false)
      }
    }
    document.addEventListener('keydown', onKey)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = originalOverflow
    }
  }, [showModal])

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)

    if (!selectedProject) {
      setFormError('Select a project first.')
      setSubmitting(false)
      return
    }
    if (!period) {
      setFormError('Period is required (YYYY-MM).')
      setSubmitting(false)
      return
    }
    const pct = Number(percent)
    if (Number.isNaN(pct) || pct < 0 || pct > 100) {
      setFormError('Percent complete must be between 0 and 100.')
      setSubmitting(false)
      return
    }

    const res = await completionAssessmentSubmit(selectedProject, period, pct)
    if (res.ok) {
      // show success and clear percent
      setFormError(null)
      setPercent('')
      setShowModal(false)
      setStatusMessage(`Submitted: ${res.data.status ?? 'Submitted'} (${res.data.period ?? period}) — ${res.data.percent_complete ?? pct}%`)
      // refresh projects if needed
      await loadProjects()
    } else {
      // Surface validation errors verbatim; callRpc provides envelope.error.message
      setFormError(res.error)
      setStatusMessage(null)
    }

    setSubmitting(false)
  }

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return projects
    return projects.filter((p) => (p.name ?? '').toLowerCase().includes(q))
  }, [projects, searchQuery])

  if (loading) {
    return (
      <article className="admin-dashboard">
        <header className="admin-dashboard__header">
          <div>
            <p className="admin-dashboard__eyebrow">Project Manager</p>
            <h1>Completion Assessments</h1>
            <p>Submit a project completion assessment (PM only).</p>
          </div>
        </header>
        <section className="users-card"><div className="exec-dash__state-card"><h2 className="exec-dash__state-title">Loading projects</h2><p className="exec-dash__state-message">Fetching projects available for assessment.</p></div></section>
      </article>
    )
  }

  if (error) {
    return (
      <article className="admin-dashboard">
        <header className="admin-dashboard__header">
          <div>
            <p className="admin-dashboard__eyebrow">Project Manager</p>
            <h1>Completion Assessments</h1>
            <p>Submit a project completion assessment (PM only).</p>
          </div>
        </header>
        <section className="users-card"><div className="exec-dash__state-card exec-dash__state-card--error"><h2 className="exec-dash__state-title">Unable to load projects</h2><p className="exec-dash__state-message">{error}</p></div></section>
      </article>
    )
  }

  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Project Manager</p>
          <h1>Completion Assessments</h1>
          <p>Submit a project completion assessment (PM only).</p>
        </div>
      </header>

      <section className="users-card">
        <div className="users-card__header">
          <div>
            <h2>Submit Assessment</h2>
            <p>Submit a percentage-of-completion assessment for a project you manage.</p>
          </div>
          <div className="users-card__actions">
            <button
              type="button"
              className="button button--primary"
              onClick={() => { setStatusMessage(null); setFormError(null); setShowModal(true) }}
            >
              New Assessment
            </button>
          </div>
        </div>

        {/* backend RPC is available; submission enabled */}

        {statusMessage && (
          <div className="exec-dash__state-card exec-dash__state-card--success exec-dash__state-card--inline" style={{ marginBottom: '1rem' }}>
            <h2 className="exec-dash__state-title">Success</h2>
            <p className="exec-dash__state-message">{statusMessage}</p>
          </div>
        )}

        <div className="exec-dash__row">
            <div className="exec-dash__panel">
              <div className="registry-toolbar">
              <div className="registry-toolbar__search-row">
                <SearchField value={searchQuery} onChange={setSearchQuery} placeholder="Search projects by name…" />
              </div>
              <div className="registry-toolbar__actions">
                <button type="button" className="button button--secondary" onClick={() => void loadProjects()}>Refresh</button>
              </div>
            </div>

            {!projects.length ? (
              <EmptyState
                icon="📋"
                title="No projects found"
                description="You currently have no projects assigned to submit assessments for."
              />
            ) : !filteredProjects.length ? (
              <EmptyState
                icon="🔎"
                title="No matching projects"
                description={`No projects match the current search (${searchQuery}).`}
              />
            ) : (
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((p) => (
                      <tr key={p.project_id ?? p.id}>
                        <td>
                          <strong style={{ display: 'block' }}>{p.name ?? '—'}</strong>
                        </td>
                        <td>
                          <div className="data-table__actions">
                            <button
                              className="button button--secondary"
                              onClick={() => {
                                setStatusMessage(null)
                                setFormError(null)
                                setSelectedProject(p.project_id ?? p.id ?? '')
                                setShowModal(true)
                              }}
                            >
                              Submit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Submit Completion Assessment"
        subtitle="Record the current percentage of completion for the project."
        maxWidth={760}
        footer={(
          <>
            <button type="button" className="button button--secondary" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="button button--primary" disabled={submitting} form="completion-assessment-form">
              {submitting ? 'Submitting…' : 'Submit Assessment'}
            </button>
          </>
        )}
      >
        <form id="completion-assessment-form" onSubmit={(e) => void handleSubmit(e)}>
          {formError && <div className="exec-dash__state-card exec-dash__state-card--error exec-dash__state-card--inline"><h2 className="exec-dash__state-title">Error</h2><p className="exec-dash__state-message">{formError}</p></div>}
          <div className="form-grid">
            <label className="form-field form-field--full">
              <span className="form-field__label">Project</span>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                required
              >
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p.project_id ?? p.id} value={p.project_id ?? p.id}>{p.name}</option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span className="form-field__label">Period</span>
              <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} required />
            </label>
            <label className="form-field">
              <span className="form-field__label">Percent Complete</span>
              <input
                type="number"
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                min="0"
                max="100"
                step="0.01"
                required
              />
            </label>
          </div>
        </form>
      </Modal>
    </article>
  )
}
