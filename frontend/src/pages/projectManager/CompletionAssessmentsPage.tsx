import { useEffect, useMemo, useState } from 'react'
import { getRecords } from '../../lib/rpc/accountant'
import { EmptyState } from '../../components/EmptyState'
import { PendingBackendNotice } from '../../components/PendingBackendNotice'
import { SearchField } from '../../components/SearchField'
import '../../styles/executive-dashboard.css'

interface Project {
  project_id?: string
  id?: string
  project_name?: string | null
}

const ASSESSMENT_DISABLED_REASON =
  'Project site-report submission is disabled until the backend completion_assessment_submit RPC is verified and deployed. Buttons above are intentionally disabled.'

export function CompletionAssessmentsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
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
    setFormError('Assessment submission is disabled pending backend RPC deployment.')
    setSubmitting(false)
  }

  const filteredProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return projects
    return projects.filter((p) => (p.project_name ?? '').toLowerCase().includes(q))
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
              disabled
              title="New Assessment — pending backend completion_assessment_submit RPC"
              onClick={() => setShowModal(true)}
            >
              New Assessment
            </button>
          </div>
        </div>

        <PendingBackendNotice
          inline
          title="Site-report submission disabled"
          description={ASSESSMENT_DISABLED_REASON}
        />

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
                          <strong style={{ display: 'block' }}>{p.project_name ?? '—'}</strong>
                        </td>
                        <td>
                          <div className="data-table__actions">
                            <button
                              className="button button--secondary"
                              disabled
                              title="Submit assessment — pending backend completion_assessment_submit RPC"
                              onClick={() => {
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

      {showModal && (
        <div
          className="modal-overlay"
          onClick={(event) => {
            if (event.target !== event.currentTarget) return
            setShowModal(false)
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="assess-modal-title"
        >
          <div className="modal">
            <div className="modal__header">
              <div className="modal__header-text">
                <h2 id="assess-modal-title" className="modal__title">Submit Completion Assessment</h2>
                <p className="modal__subtitle">Record the current percentage of completion for the project.</p>
              </div>
              <button type="button" aria-label="Close dialog" className="modal__close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={(e) => void handleSubmit(e)}>
              <div className="modal__body">
                <PendingBackendNotice
                  inline
                  title="Submission disabled"
                  description="This form is read-only until the completion_assessment_submit backend RPC is deployed and verified."
                />
                {formError && <div className="exec-dash__state-card exec-dash__state-card--error exec-dash__state-card--inline"><h2 className="exec-dash__state-title">Error</h2><p className="exec-dash__state-message">{formError}</p></div>}
                <div className="form-grid">
                  <label className="form-field form-field--full">
                    <span className="form-field__label">Project</span>
                    <select
                      value={selectedProject}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      required
                      disabled
                    >
                      <option value="">Select project</option>
                      {projects.map((p) => (
                        <option key={p.project_id ?? p.id} value={p.project_id ?? p.id}>{p.project_name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="form-field">
                    <span className="form-field__label">Period</span>
                    <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} required disabled />
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
                      disabled
                    />
                  </label>
                </div>
              </div>
              <div className="modal__footer">
                <button type="button" className="button button--secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="button button--primary" disabled={true}>
                  {submitting ? 'Submitting…' : 'Submit Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </article>
  )
}
