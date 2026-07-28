import { EmptyState } from '../../components/EmptyState'
import '../../styles/executive-dashboard.css'

export function AssignedProjectsPage() {
  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Employee Self-Service</p>
          <h1>Assigned Projects</h1>
          <p>View the projects assigned to you once the backend exposes the assignments surface.</p>
        </div>
      </header>

      <section className="users-card">
        <EmptyState
          icon="🧾"
          title="Assigned projects are not available"
          description="No client-visible assignment path is available for employee accounts in the current backend contract. This view will show your assigned work after the API is added."
        />
      </section>
    </article>
  )
}
