import { EmptyState } from '../../components/EmptyState'
import '../../styles/executive-dashboard.css'

export function DocumentsPage() {
  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Project Manager Workspace</p>
          <h1>Documents</h1>
          <p>Project documents are not yet exposed through a verified backend path in this workspace.</p>
        </div>
      </header>

      <section className="users-card">
        <EmptyState
          icon="📁"
          title="Project documents not available"
          description="The backend contract does not currently expose a client-visible documents resource for project managers. This page will be built once that surface is available."
        />
      </section>
    </article>
  )
}
