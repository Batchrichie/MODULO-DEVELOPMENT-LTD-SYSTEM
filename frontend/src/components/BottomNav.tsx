import { NavLink, useNavigate } from 'react-router-dom'
import type { UserRole } from '../types/auth'

interface BottomNavProps {
  role: UserRole
  menuOpen: boolean
  onMenuToggle: () => void
}

interface BottomNavItem {
  label: string
  path: string
  icon: string
}

interface BottomNavConfig {
  items: [BottomNavItem, BottomNavItem, BottomNavItem]
  fabLabel: string
  fabPath: string
}

const bottomNavByRole: Record<UserRole, BottomNavConfig> = {
  Admin: {
    items: [
      { label: 'Dashboard', path: '/admin/dashboard', icon: 'chart' },
      { label: 'Properties', path: '/admin/rental-properties', icon: 'building' },
      { label: 'Analytics', path: '/admin/reports', icon: 'report' },
    ],
    fabLabel: 'Add Property',
    fabPath: '/admin/rental-properties',
  },
  CEO: {
    items: [
      { label: 'Dashboard', path: '/executive/dashboard', icon: 'chart' },
      { label: 'Portfolio', path: '/executive/project-portfolio', icon: 'layers' },
      { label: 'Reports', path: '/executive/reports', icon: 'report' },
    ],
    fabLabel: 'New Project',
    fabPath: '/executive/project-portfolio',
  },
  Accountant: {
    items: [
      { label: 'Dashboard', path: '/accountant/dashboard', icon: 'chart' },
      { label: 'Accounts', path: '/accountant/chart-of-accounts', icon: 'wallet' },
      { label: 'Reports', path: '/accountant/reports/financial-reports', icon: 'report' },
    ],
    fabLabel: 'New Journal',
    fabPath: '/accountant/journal-entries',
  },
  ProjectManager: {
    items: [
      { label: 'Dashboard', path: '/project-manager/my-projects', icon: 'chart' },
      { label: 'Projects', path: '/project-manager/my-projects', icon: 'layers' },
      { label: 'Team', path: '/project-manager/documents', icon: 'users' },
    ],
    fabLabel: 'New Project',
    fabPath: '/project-manager/my-projects',
  },
  Employee: {
    items: [
      { label: 'Dashboard', path: '/employee/my-profile', icon: 'chart' },
      { label: 'Projects', path: '/employee/assigned-projects', icon: 'layers' },
      { label: 'Payslips', path: '/employee/payslips', icon: 'wallet' },
    ],
    fabLabel: 'Request Leave',
    fabPath: '/employee/leave',
  },
}

const iconPaths: Record<string, string> = {
  chart: 'M4 19V5m0 14h16M8 16v-4m4 4V8m4 8V5',
  building: 'M4 20V5l8-2 8 2v15M8 8h1m-1 4h1m6-4h1m-1 4h1M9 20v-4h6v4',
  layers: 'm12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5',
  report: 'M6 3h9l3 3v15H6V3Zm3 5h5m-5 4h5m-5 4h3',
  users: 'M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20m6-9a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
  wallet: 'M4 7h16v13H4V7Zm0 0 2-4h12l2 4m-4 6h4',
  menu: 'M4 6h16M4 12h16M4 18h16',
}

function Icon({ name }: { name: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={iconPaths[name] ?? iconPaths.chart} /></svg>
}

export function BottomNav({ role, menuOpen, onMenuToggle }: BottomNavProps) {
  const config = bottomNavByRole[role]
  const navigate = useNavigate()

  return (
    <nav className="bottom-nav" aria-label="Primary mobile navigation">
      <NavLink to={config.items[0].path} className="bottom-nav__item">
        <Icon name={config.items[0].icon} /><span>{config.items[0].label}</span>
      </NavLink>
      <NavLink to={config.items[1].path} className="bottom-nav__item">
        <Icon name={config.items[1].icon} /><span>{config.items[1].label}</span>
      </NavLink>
      <button type="button" className="bottom-nav__fab" aria-label={config.fabLabel} onClick={() => navigate(config.fabPath)}>+</button>
      <NavLink to={config.items[2].path} className="bottom-nav__item">
        <Icon name={config.items[2].icon} /><span>{config.items[2].label}</span>
      </NavLink>
      <button type="button" className={`bottom-nav__item${menuOpen ? ' bottom-nav__item--active' : ''}`} aria-expanded={menuOpen} aria-label="Open navigation menu" onClick={onMenuToggle}>
        <Icon name="menu" /><span>Menu</span>
      </button>
    </nav>
  )
}
