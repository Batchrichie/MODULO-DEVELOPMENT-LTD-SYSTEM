import { useEffect, useState } from 'react'
import { EmptyState } from '../../components/EmptyState'
import '../../styles/executive-dashboard.css'
import { listPendingSiteReports, siteReportApprove, siteReportReject, type SiteReport } from '../../lib/rpc/accountant'
import { StatusBadge, deriveStatusBadgeFromState } from '../../components/StatusBadge'
import { ConfirmDialog } from '../../components/ConfirmDialog'

export function SiteReportsReviewPage() {
  const [reports, setReports] = useState<SiteReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [currentRejectId, setCurrentRejectId] = useState<string | null>(null)

  useEffect(() => { void load() }, [])

  async function load() {
    setLoading(true)
    setError(null)
    const res = await listPendingSiteReports(1, 200)
    if (res.ok) setReports(res.data)
    else setError(res.error)
    setLoading(false)
  }

  async function handleApprove(id?: string) {
    if (!id) return
    const res = await siteReportApprove(id)
    if (!res.ok) return setError(res.error)
    await load()
  }

  async function handleReject(id?: string, reason?: string) {
    if (!id || !reason) return
    const res = await siteReportReject(id, reason)
    if (!res.ok) return setError(res.error)
    setConfirmOpen(false)
    setCurrentRejectId(null)
    await load()
  }

  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Accounting</p>
          <h1>Site Reports — Review queue</h1>
          <p>Approve or reject submitted site reports.</p>
        </div>
      </header>

      <section className="users-card">
        {loading ? (
          <div className="exec-dash__state-card"><h2 className="exec-dash__state-title">Loading</h2><p className="exec-dash__state-message">Fetching pending reports…</p></div>
        ) : error ? (
          <div className="exec-dash__state-card exec-dash__state-card--error"><h2 className="exec-dash__state-title">Unable to load</h2><p className="exec-dash__state-message">{error}</p></div>
        ) : !reports.length ? (
          <EmptyState
            icon="✅"
            title="No pending reports"
            description="There are no site reports awaiting review."
          />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Submitted by</th>
                  <th>Project</th>
                  <th>Report date</th>
                  <th>Notes</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.report_id ?? r.id}>
                    <td>{r.submitted_by_name ?? r.submitted_by ?? '—'}</td>
                    <td>{r.project_name ?? r.project_id ?? '—'}</td>
                    <td>{r.report_date ?? '—'}</td>
                    <td>{r.notes ?? '—'}</td>
                    <td>{r.status ? <StatusBadge {...deriveStatusBadgeFromState(r.status)} /> : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="button" onClick={() => void handleApprove(r.report_id ?? r.id)}>Approve</button>
                        <button className="button button--secondary" onClick={() => { setCurrentRejectId(r.report_id ?? r.id ?? null); setConfirmOpen(true) }}>Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => { setConfirmOpen(false); setCurrentRejectId(null) }}
        onConfirm={(reason) => handleReject(currentRejectId ?? undefined, reason)}
        title="Reject site report"
        description="Provide a reason for rejecting this site report. This will be recorded and shown to the submitter."
        confirmLabel="Reject"
        tone="danger"
        requireReason
      />
    </article>
  )
}
