import { useEffect, useState, type FormEvent } from 'react'
import '../../styles/executive-dashboard.css'
import { Modal } from '../../components/Modal'
import { deriveStatusBadgeFromState, StatusBadge } from '../../components/StatusBadge'
import { listMySiteReports, submitSiteReport, type SiteReport } from '../../lib/rpc/accountant'
import { fetchMyProjects, type PmProject } from '../../lib/rpc/projectManager'

type SiteReportForm = {
  project_id: string
  report_date: string
  notes: string
  photo_url: string
}

export function SiteReportsPage() {
  const [reports, setReports] = useState<SiteReport[]>([])
  const [projects, setProjects] = useState<PmProject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [form, setForm] = useState<SiteReportForm>(() => ({
    project_id: '',
    report_date: new Date().toISOString().slice(0, 10),
    notes: '',
    photo_url: '',
  }))

  useEffect(() => {
    void load()
    void loadProjects()
  }, [])

  async function load() {
    setLoading(true)
    setError(null)
    const result = await listMySiteReports(1, 100)
    if (result.ok) setReports(result.data)
    else setError(result.error)
    setLoading(false)
  }

  async function loadProjects() {
    const result = await fetchMyProjects()
    if (result.ok) setProjects(result.data)
  }

  function resetForm() {
    setForm({
      project_id: '',
      report_date: new Date().toISOString().slice(0, 10),
      notes: '',
      photo_url: '',
    })
    setFormError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setFormError(null)

    if (!form.project_id || !form.report_date) {
      setFormError('Please choose a project and report date.')
      setSubmitting(false)
      return
    }

    const result = await submitSiteReport(
      form.project_id,
      form.report_date,
      form.notes.trim() || null,
      form.photo_url.trim() || null,
    )

    if (!result.ok) {
      setFormError(result.error)
      setSubmitting(false)
      return
    }

    setShowModal(false)
    resetForm()
    setStatusMessage('Site report submitted successfully. It is now waiting for accountant review.')
    await load()
    setSubmitting(false)
  }

  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Project Manager</p>
          <h1>Site Reports — Past submissions</h1>
          <p>List of your submitted site reports.</p>
        </div>
      </header>

      <section className="users-card">
        <div className="users-card__header">
          <div>
            <h2>Past submissions</h2>
            <p>Recent reports you submitted.</p>
          </div>
          <button
            type="button"
            className="button button--primary"
            onClick={() => {
              setStatusMessage(null)
              setFormError(null)
              setShowModal(true)
            }}
          >
            New Report
          </button>
        </div>

        {statusMessage && (
          <div className="exec-dash__state-card exec-dash__state-card--success exec-dash__state-card--inline" style={{ marginBottom: '1rem' }}>
            <h2 className="exec-dash__state-title">Success</h2>
            <p className="exec-dash__state-message">{statusMessage}</p>
          </div>
        )}

        {loading ? (
          <div className="exec-dash__state-card"><h2 className="exec-dash__state-title">Loading</h2><p className="exec-dash__state-message">Fetching your site reports…</p></div>
        ) : error ? (
          <div className="exec-dash__state-card exec-dash__state-card--error"><h2 className="exec-dash__state-title">Unable to load reports</h2><p className="exec-dash__state-message">{error}</p></div>
        ) : !reports.length ? (
          <div className="exec-dash__state-card exec-dash__state-card--empty"><h2 className="exec-dash__state-title">No reports found</h2><p className="exec-dash__state-message">You have not submitted any site reports yet.</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Report date</th>
                  <th>Notes</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.report_id ?? r.id}>
                    <td>{r.report_date ?? '—'}</td>
                    <td>{r.notes ?? '—'}{r.status === 'rejected' && r.rejection_reason ? <div style={{ marginTop: 6, color: 'var(--color-error-text)' }}><strong>Rejection:</strong> {r.rejection_reason}</div> : null}</td>
                    <td>{r.status ? <StatusBadge {...deriveStatusBadgeFromState(r.status)} /> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); resetForm(); setStatusMessage(null) }}
        title="New site report"
        subtitle="Submit a new site inspection report for one of your projects."
        maxWidth={760}
        footer={(
          <>
            <button type="button" className="button button--secondary" onClick={() => { setShowModal(false); resetForm(); setStatusMessage(null) }}>Cancel</button>
            <button type="submit" className="button button--primary" disabled={submitting || !projects.length} form="site-report-form">
              {submitting ? 'Submitting…' : 'Submit report'}
            </button>
          </>
        )}
      >
        <form id="site-report-form" onSubmit={(event) => void handleSubmit(event)}>
          {formError && <div className="exec-dash__state-card exec-dash__state-card--error exec-dash__state-card--inline"><h2 className="exec-dash__state-title">Error</h2><p className="exec-dash__state-message">{formError}</p></div>}
          <div className="form-grid">
            <label className="form-field">
              <span className="form-field__label">Project *</span>
              <select
                value={form.project_id}
                onChange={(event) => setForm((current) => ({ ...current, project_id: event.target.value }))}
                required
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.project_id ?? project.id} value={project.project_id ?? project.id}>
                    {project.name ?? project.project_id ?? 'Unnamed project'}
                  </option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span className="form-field__label">Report date *</span>
              <input
                type="date"
                value={form.report_date}
                onChange={(event) => setForm((current) => ({ ...current, report_date: event.target.value }))}
                required
              />
            </label>

            <label className="form-field form-field--full">
              <span className="form-field__label">Notes</span>
              <textarea
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                rows={5}
                placeholder="Describe the site inspection details, observations, and follow-ups."
              />
            </label>

            <label className="form-field form-field--full">
              <span className="form-field__label">Photo URL (optional)</span>
              <input
                value={form.photo_url}
                onChange={(event) => setForm((current) => ({ ...current, photo_url: event.target.value }))}
                placeholder="https://example.com/photo.jpg"
              />
            </label>
          </div>
        </form>
      </Modal>
    </article>
  )
}
