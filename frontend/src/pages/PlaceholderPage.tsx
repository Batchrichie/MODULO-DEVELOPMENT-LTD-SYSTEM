interface PlaceholderPageProps {
  title: string
  breadcrumb?: string
}

export function PlaceholderPage({ title, breadcrumb }: PlaceholderPageProps) {
  if (title === 'User Management') {
    return <UserManagementPage />
  }

  return (
    <article className="placeholder-page">
      {breadcrumb && <p className="placeholder-page__breadcrumb">{breadcrumb}</p>}
      <div className="placeholder-page__card">
        <span className="placeholder-page__badge">Coming in REBUILD-3+ — not yet built</span>
        <h2 className="placeholder-page__title">{title}</h2>
        <p className="placeholder-page__body">
          This is a navigation placeholder only. No backend is connected and no data is shown
          here — workspace content will be built in a later ticket.
        </p>
      </div>
    </article>
  )
}

const stats = [
  { label: 'Total Users', value: '1,284', change: '+12.5%', tone: 'blue', icon: 'users' },
  { label: 'Active Now', value: '847', change: '+8.2%', tone: 'green', icon: 'pulse' },
  { label: 'Pending Access', value: '23', change: '-3.1%', tone: 'orange', icon: 'clock' },
  { label: 'Admins', value: '14', change: '+2 new', tone: 'purple', icon: 'shield' },
]

function UserManagementPage() {
  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div><p className="admin-dashboard__eyebrow">Platform</p><h1>User Management</h1><p>Manage access, roles, and team members across your workspace.</p></div>
        <button type="button" className="admin-dashboard__more" aria-label="More page actions">•••</button>
      </header>
      <section className="admin-dashboard__stats" aria-label="User statistics">
        {stats.map((stat) => <div className="stat-card" key={stat.label}><div className={`stat-card__icon stat-card__icon--${stat.tone}`}><svg viewBox="0 0 24 24"><path d={statPath(stat.icon)} /></svg></div><div className="stat-card__content"><span>{stat.label}</span><strong>{stat.value}</strong><small className={stat.change.startsWith('-') ? 'stat-card__change--negative' : ''}>{stat.change} <em>vs. last month</em></small></div></div>)}
      </section>
      <section className="users-card">
        <div className="users-card__header"><div><h2>All Users</h2><p>View and manage everyone with access to BuildCore.</p></div><div className="users-card__actions"><button type="button" className="button button--secondary"><svg viewBox="0 0 24 24"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14" /></svg>Export</button><button type="button" className="button button--primary">+ Add User</button></div></div>
        <div className="users-card__empty"><div className="empty-illustration"><span /><span /><span /><i /></div><h2>Coming in REBUILD-3+</h2><p>User management workflows are being prepared. This workspace will soon show your team, roles, and access activity.</p><span className="status-pill">Not yet built</span></div>
      </section>
    </article>
  )
}

function statPath(icon: string) {
  const paths: Record<string, string> = { users: 'M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20m6-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm5.5-5.4a3 3 0 0 1 0 5.8M16 15h1.5a3.5 3.5 0 0 1 3.5 3.5V20', pulse: 'M3 12h4l2-6 4 12 2-6h6', clock: 'M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', shield: 'M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Z' }
  return paths[icon]
}
