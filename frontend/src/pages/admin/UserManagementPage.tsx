import { AdminPageFrame } from './AdminPageFrame'

export function UserManagementPage() {
  return (
    <AdminPageFrame
      eyebrow="Platform"
      title="User Management"
      description="This view is intentionally conservative because the live Admin user surface is not exposed yet."
      summary="No Admin-wide user-directory RPC or RLS path is available today."
      badge="Verified placeholder"
      status="unsupported"
      note="Confirmed from the live schema/RLS: public.users only exposes the signed-in user row, and no Admin-wide user-list RPC is available."
    >
      <div className="users-card__header">
        <div>
          <h2>Current state</h2>
          <p>The live schema and RLS do not currently provide an Admin-visible user directory or role-editing path.</p>
        </div>
      </div>
      <div className="users-card__empty">
        <div className="empty-illustration" />
        <h2>Coming soon</h2>
        <p>Once a confirmed RPC or RLS-backed user-list path exists, this screen can list public.users with email, role, linked employee, and controlled role edits. Any future role change would be an explicit Admin action on another account and would never permit self-escalation.</p>
        <span className="status-pill">No financial endpoints are used here</span>
      </div>
    </AdminPageFrame>
  )
}
