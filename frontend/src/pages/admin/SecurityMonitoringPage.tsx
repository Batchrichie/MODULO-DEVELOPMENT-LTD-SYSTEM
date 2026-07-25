import { AdminPageFrame } from './AdminPageFrame'

export function SecurityMonitoringPage() {
  return (
    <AdminPageFrame
      eyebrow="Security"
      title="Security Monitoring"
      description="This area is intentionally a placeholder until a documented session or login-monitoring endpoint exists."
      summary="No monitoring RPC was confirmed in the documented surface."
      badge="Placeholder"
      status="unsupported"
      note="The current contract does not expose session, login, or security-monitoring endpoints for Admin."
    >
      <div className="users-card__header">
        <div>
          <h2>Current state</h2>
          <p>No backend support for security monitoring was found in the verified contract or current RPC whitelist.</p>
        </div>
      </div>
      <div className="users-card__empty">
        <div className="empty-illustration" />
        <h2>Coming soon</h2>
        <p>When the backend adds a confirmed security-monitoring surface, this page can surface login activity, suspicious events, and administrative alerts without touching any financial endpoints.</p>
        <span className="status-pill">No financial endpoints are used here</span>
      </div>
    </AdminPageFrame>
  )
}
