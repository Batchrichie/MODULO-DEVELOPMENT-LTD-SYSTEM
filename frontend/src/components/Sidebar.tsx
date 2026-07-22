import { NavLink } from 'react-router-dom'
import type { NavEntry, PortalNavConfig } from '../config/navigation'
import { UserMenu } from './UserMenu'

interface SidebarProps {
  config: PortalNavConfig
  collapsed: boolean
  drawerOpen: boolean
  onCloseDrawer: () => void
}

function NavItemLink({
  label,
  path,
  icon,
  collapsed,
  onNavigate,
  badge,
  badgeTone,
}: {
  label: string
  path: string
  icon: string
  collapsed: boolean
  onNavigate?: () => void
  badge?: string
  badgeTone?: 'default' | 'warning'
}) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
      }
      title={collapsed ? label : undefined}
      onClick={onNavigate}
    >
      <span className="sidebar__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d={iconPath(icon)} /></svg>
      </span>
      <span className="sidebar__label">{label}</span>
      {badge && <span className={`sidebar__badge${badgeTone === 'warning' ? ' sidebar__badge--warning' : ''}`}>{badge}</span>}
    </NavLink>
  )
}

function iconPath(icon: string) {
  const paths: Record<string, string> = {
    users: 'M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20m6-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm5.5-5.4a3 3 0 0 1 0 5.8M16 15h1.5a3.5 3.5 0 0 1 3.5 3.5V20',
    building: 'M4 20V5l8-2 8 2v15M8 8h1m-1 4h1m6-4h1m-1 4h1M9 20v-4h6v4',
    layers: 'm12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5',
    site: 'M4 20V7l8-4 8 4v13M9 20v-6h6v6M7 9h.01M12 9h.01M17 9h.01',
    chart: 'M4 19V5m0 14h16M8 16v-4m4 4V8m4 8V5',
    report: 'M6 3h9l3 3v15H6V3Zm3 5h5m-5 4h5m-5 4h3',
  }
  return paths[icon] ?? 'M5 5h14v14H5z'
}

function renderEntry(
  entry: NavEntry,
  collapsed: boolean,
  onNavigate?: () => void,
) {
  if (entry.type === 'item') {
    return (
      <NavItemLink
        key={entry.path}
        label={entry.label}
        path={entry.path}
        icon={entry.icon}
        collapsed={collapsed}
        onNavigate={onNavigate}
        badge={entry.badge}
        badgeTone={entry.badgeTone}
      />
    )
  }

  return (
    <div key={entry.label} className="sidebar__section">
      <div className="sidebar__section-label" title={collapsed ? entry.label : undefined}>
        {collapsed ? entry.label.slice(0, 2) : entry.label}
      </div>
      {entry.children.map((child) => (
        <NavItemLink
          key={child.path}
          label={child.label}
          path={child.path}
          icon={child.icon}
          collapsed={collapsed}
          onNavigate={onNavigate}
          badge={child.badge}
          badgeTone={child.badgeTone}
        />
      ))}
    </div>
  )
}

export function Sidebar({ config, collapsed, drawerOpen, onCloseDrawer }: SidebarProps) {
  return (
    <>
      {drawerOpen && (
        <button
          type="button"
          className="sidebar__backdrop"
          aria-label="Close navigation menu"
          onClick={onCloseDrawer}
        />
      )}
      <nav
        className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}${drawerOpen ? ' sidebar--drawer-open' : ''}`}
        aria-label={`${config.portalLabel} navigation`}
      >
        <div className="sidebar__inner">
          <div className="sidebar__brand">
            <span className="sidebar__brand-mark">B</span>
            {!collapsed && <span><strong>BuildCore</strong><small>{config.portalLabel}</small></span>}
          </div>
          {!collapsed && <label className="sidebar__search"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m20 20-4.2-4.2m1.2-5.3a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" /></svg><input placeholder="Search" aria-label="Search navigation" /><kbd>⌘ K</kbd></label>}
          {config.entries.map((entry) => renderEntry(entry, collapsed, onCloseDrawer))}
          <UserMenu />
        </div>
      </nav>
    </>
  )
}
