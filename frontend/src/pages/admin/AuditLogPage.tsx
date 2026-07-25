import { AdminPageFrame } from './AdminPageFrame'

export function AuditLogPage() {
  return (
    <AdminPageFrame
      eyebrow="Compliance"
      title="Audit Log"
      description="This screen remains read-only because the live audit-log surface is not accessible to clients today."
      summary="No client-visible audit-log RPC or table path is available today."
      badge="Placeholder"
      status="unsupported"
      note="Confirmed from the live schema/RLS: public.audit_log has RLS enabled with zero policies, so it is inaccessible to any client role."
    >
      <div className="users-card__header">
        <div>
          <h2>Current state</h2>
          <p>Audit history is not exposed through a client-visible backend path in this workspace today.</p>
        </div>
      </div>
      <div className="users-card__empty">
        <div className="empty-illustration" />
        <h2>Coming soon</h2>
        <p>Once the backend exposes a confirmed audit-log resource through a supported RPC or a client-visible table path, this page can display immutable system activity, actor details, and timestamps.</p>
        <span className="status-pill">No financial endpoints are used here</span>
      </div>
    </AdminPageFrame>
  )
}
