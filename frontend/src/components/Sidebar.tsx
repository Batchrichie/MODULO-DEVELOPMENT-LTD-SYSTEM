import { NavLink } from 'react-router-dom'
import type { NavEntry, PortalNavConfig } from '../config/navigation'
import { UserMenu } from './UserMenu'
import {
  LayoutDashboard,
  LineChart,
  Layers,
  Truck,
  Landmark,
  FileBarChart,
  Bell,
  BookOpen,
  NotebookPen,
  BookText,
  Scale,
  FileText,
  CreditCard,
  Receipt,
  Banknote,
  Users,
  Wallet,
  HandCoins,
  Building2,
  Coins,
  UsersRound,
  Archive,
  ClipboardList,
  FileClock,
  PieChart,
  BarChart3,
  FileCheck,
  UserCircle2,
  Settings,
  ShieldCheck,
  History,
  FolderKanban,
  Calculator,
  CheckSquare,
  TrendingUp,
  FolderOpen,
  CalendarDays,
  Briefcase,
  Megaphone,
  Shield,
  type LucideIcon,
} from 'lucide-react'

const ICON_SIZE = 14
const ICON_STROKE = 1.6

const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  LineChart,
  Layers,
  Truck,
  Landmark,
  FileBarChart,
  Bell,
  BookOpen,
  NotebookPen,
  BookText,
  Scale,
  FileText,
  CreditCard,
  Receipt,
  Banknote,
  Users,
  Wallet,
  HandCoins,
  Building2,
  Coins,
  UsersRound,
  Archive,
  ClipboardList,
  FileClock,
  PieChart,
  BarChart3,
  FileCheck,
  UserCircle2,
  Settings,
  ShieldCheck,
  History,
  FolderKanban,
  Calculator,
  CheckSquare,
  TrendingUp,
  FolderOpen,
  CalendarDays,
  Briefcase,
  Megaphone,
  Shield,
}

function SidebarIcon({ name }: { name: string }) {
  const Icon = iconMap[name] ?? LayoutDashboard
  return <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} />
}

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
        <SidebarIcon name={icon} />
      </span>
      <span className="sidebar__label">{label}</span>
      {badge && <span className={`sidebar__badge${badgeTone === 'warning' ? ' sidebar__badge--warning' : ''}`}>{badge}</span>}
    </NavLink>
  )
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
          {!collapsed && <label className="sidebar__search sidebar__search--top"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m20 20-4.2-4.2m1.2-5.3a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" /></svg><input placeholder="Search" aria-label="Search navigation" /><kbd>⌘ K</kbd></label>}
          {config.entries.map((entry) => renderEntry(entry, collapsed, onCloseDrawer))}
          <UserMenu />
        </div>
      </nav>
    </>
  )
}
