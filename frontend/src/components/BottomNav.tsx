import { NavLink, useNavigate } from 'react-router-dom'
import type { UserRole } from '../types/auth'
import {
  BarChart3,
  Layers,
  FileBarChart,
  Users,
  Shield,
  Wallet,
  Menu,
  type LucideIcon,
} from 'lucide-react'

const ICON_SIZE = 14
const ICON_STROKE = 1.6

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
      { label: 'User Management', path: '/admin/user-management', icon: 'Users' },
      { label: 'Roles & Permissions', path: '/admin/roles-permissions', icon: 'Shield' },
      { label: 'Audit Log', path: '/admin/audit-log', icon: 'FileBarChart' },
    ],
    fabLabel: 'Security',
    fabPath: '/admin/security-monitoring',
  },
  CEO: {
    items: [
      { label: 'Dashboard', path: '/executive/dashboard', icon: 'BarChart3' },
      { label: 'Portfolio', path: '/executive/project-portfolio', icon: 'Layers' },
      { label: 'Reports', path: '/executive/reports', icon: 'FileBarChart' },
    ],
    fabLabel: 'New Project',
    fabPath: '/executive/project-portfolio',
  },
  Accountant: {
    items: [
      { label: 'Dashboard', path: '/accountant/dashboard', icon: 'BarChart3' },
      { label: 'Accounts', path: '/accountant/chart-of-accounts', icon: 'Wallet' },
      { label: 'Reports', path: '/accountant/reports/financial-reports', icon: 'FileBarChart' },
    ],
    fabLabel: 'New Journal',
    fabPath: '/accountant/journal-entries',
  },
  ProjectManager: {
    items: [
      { label: 'Dashboard', path: '/project-manager/my-projects', icon: 'BarChart3' },
      { label: 'Projects', path: '/project-manager/my-projects', icon: 'Layers' },
      { label: 'Team', path: '/project-manager/documents', icon: 'Users' },
    ],
    fabLabel: 'New Project',
    fabPath: '/project-manager/my-projects',
  },
  Employee: {
    items: [
      { label: 'Dashboard', path: '/employee/my-profile', icon: 'BarChart3' },
      { label: 'Projects', path: '/employee/assigned-projects', icon: 'Layers' },
      { label: 'Payslips', path: '/employee/payslips', icon: 'Wallet' },
    ],
    fabLabel: 'Request Leave',
    fabPath: '/employee/leave',
  },
}

const iconMap: Record<string, LucideIcon> = {
  BarChart3,
  Layers,
  FileBarChart,
  Users,
  Shield,
  Wallet,
  Menu,
}

function Icon({ name }: { name: string }) {
  const LucideIconComponent = iconMap[name] ?? BarChart3
  return <LucideIconComponent size={ICON_SIZE} strokeWidth={ICON_STROKE} />
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
