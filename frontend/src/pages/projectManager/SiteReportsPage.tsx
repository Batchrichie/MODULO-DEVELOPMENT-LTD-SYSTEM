import { useEffect, useState } from 'react'
import '../../styles/executive-dashboard.css'
import { listMySiteReports, type SiteReport } from '../../lib/rpc/accountant'
import { deriveStatusBadgeFromState, StatusBadge } from '../../components/StatusBadge'

export function SiteReportsPage() {
  const [reports, setReports] = useState<SiteReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    setError(null)
    const result = await listMySiteReports(1, 100)
    if (result.ok) setReports(result.data)
    else setError(result.error)
    setLoading(false)
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
        </div>

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
    </article>
  )
}
