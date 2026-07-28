import { EmptyState } from '../../components/EmptyState'
import '../../styles/executive-dashboard.css'

export function LeavePage() {
  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Employee Self-Service</p>
          <h1>Leave</h1>
          <p>Request leave and review your leave history once the backend support is available.</p>
        </div>
      </header>

      <section className="users-card">
        <EmptyState
          icon="📅"
          title="Leave management is not yet available"
          description="The current backend contract does not expose a leave request or leave balance endpoint for employee self-service. This page will be enabled once that API surface is confirmed."
        />
      </section>
    </article>
  )
}
