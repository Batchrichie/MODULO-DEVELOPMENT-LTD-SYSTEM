import { EmptyState } from '../../components/EmptyState'
import '../../styles/executive-dashboard.css'

export function SystemSettingsPage() {
  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Admin Panel</p>
          <h1>System Settings</h1>
          <p>Admin system settings are not currently exposed to clients in the verified backend contract.</p>
        </div>
      </header>

      <section className="users-card">
        <EmptyState
          icon="⚙️"
          title="System settings are unavailable"
          description="No client-visible settings endpoint exists in the current workspace. This page is a documented placeholder for future Admin controls."
        />
      </section>
    </article>
  )
}
