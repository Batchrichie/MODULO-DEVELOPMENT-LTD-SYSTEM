import { EmptyState } from '../../components/EmptyState'
import '../../styles/executive-dashboard.css'

export function AnnouncementsPage() {
  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Employee Self-Service</p>
          <h1>Announcements</h1>
          <p>Company announcements will appear here once a supported announcements endpoint is available.</p>
        </div>
      </header>

      <section className="users-card">
        <EmptyState
          icon="📣"
          title="Announcements are not available"
          description="This workspace does not currently expose a client-accessible announcements feed. This page will show company news after that surface is added."
        />
      </section>
    </article>
  )
}
