import type { UserRole } from '../types/auth'

export type NavItem = {
  type: 'item'
  label: string
  path: string
  icon: string
  badge?: string
  badgeTone?: 'default' | 'warning'
}

export type NavSection = {
  type: 'section'
  label: string
  children: { label: string; path: string; icon: string; badge?: string; badgeTone?: 'default' | 'warning' }[]
}

export type NavEntry = NavItem | NavSection

export type PortalNavConfig = {
  portalLabel: string
  basePath: string
  defaultPath: string
  entries: NavEntry[]
}

/** Nav trees match CAREMS_Wireframes.html `.acc-nav-item` / `.acc-nav-section` / `.acc-nav-child` exactly. */
export const PORTAL_NAV: Record<UserRole, PortalNavConfig> = {
  CEO: {
    portalLabel: 'Executive Dashboard',
    basePath: '/executive',
    defaultPath: '/executive/dashboard',
    entries: [
      { type: 'item', label: 'Executive Dashboard', path: '/executive/dashboard', icon: 'ED' },
      { type: 'item', label: 'Financial Overview', path: '/executive/financial-overview', icon: 'FO' },
      { type: 'item', label: 'Project Portfolio', path: '/executive/project-portfolio', icon: 'PP' },
      { type: 'item', label: 'Equipment Rentals', path: '/executive/equipment-rentals', icon: 'ER' },
      { type: 'item', label: 'Tax & Compliance', path: '/executive/tax-compliance', icon: 'TC' },
      { type: 'item', label: 'Reports', path: '/executive/reports', icon: 'RP' },
      { type: 'item', label: 'Alerts & Notifications', path: '/executive/alerts', icon: 'AN' },
    ],
  },
  Accountant: {
    portalLabel: 'Accounting Workspace',
    basePath: '/accountant',
    defaultPath: '/accountant/dashboard',
    entries: [
      { type: 'item', label: 'Dashboard', path: '/accountant/dashboard', icon: 'DB' },
      { type: 'item', label: 'Chart of Accounts', path: '/accountant/chart-of-accounts', icon: 'CA' },
      { type: 'item', label: 'Journal Entries', path: '/accountant/journal-entries', icon: 'JE' },
      { type: 'item', label: 'General Ledger', path: '/accountant/general-ledger', icon: 'GL' },
      { type: 'item', label: 'Trial Balance', path: '/accountant/trial-balance', icon: 'TB' },
      {
        type: 'section',
        label: 'Payroll & HR',
        children: [
          { label: 'Employee Records', path: '/accountant/payroll-hr/employee-records', icon: 'ER' },
          { label: 'Payroll', path: '/accountant/payroll-hr/payroll', icon: 'PR' },
          { label: 'Loan Management', path: '/accountant/payroll-hr/loan-management', icon: 'LM' },
        ],
      },
      {
        type: 'section',
        label: 'Banking & Cash',
        children: [
          { label: 'Bank Accounts', path: '/accountant/banking-cash/bank-accounts', icon: 'BA' },
          { label: 'Petty Cash', path: '/accountant/banking-cash/petty-cash', icon: 'PC' },
          { label: 'Third Party Accounts', path: '/accountant/banking-cash/third-party-accounts', icon: 'TP' },
        ],
      },
      {
        type: 'section',
        label: 'Asset Management',
        children: [
          { label: 'Asset Register', path: '/accountant/asset-management/asset-register', icon: 'AR' },
          { label: 'PPE Schedule', path: '/accountant/asset-management/ppe-schedule', icon: 'PS' },
          { label: 'Depreciation Journal', path: '/accountant/asset-management/depreciation-journal', icon: 'DJ' },
        ],
      },
      {
        type: 'section',
        label: 'Budgeting',
        children: [
          { label: 'Budgets', path: '/accountant/budgeting/budgets', icon: 'BG' },
          { label: 'Budget vs Actual', path: '/accountant/budgeting/budget-vs-actual', icon: 'BV' },
        ],
      },
      {
        type: 'section',
        label: 'Reports',
        children: [
          { label: 'Financial Reports', path: '/accountant/reports/financial-reports', icon: 'FR' },
        ],
      },
      {
        type: 'section',
        label: 'User Account',
        children: [
          { label: 'My Profile', path: '/accountant/user-account/my-profile', icon: 'MP' },
          { label: 'Settings', path: '/accountant/user-account/settings', icon: 'ST' },
          { label: 'Policy Settings', path: '/accountant/user-account/policy-settings', icon: 'PO' },
          { label: 'Audit Trail', path: '/accountant/user-account/audit-trail', icon: 'AT' },
        ],
      },
    ],
  },
  ProjectManager: {
    portalLabel: 'Project Manager Workspace',
    basePath: '/project-manager',
    defaultPath: '/project-manager/my-projects',
    entries: [
      { type: 'item', label: 'My Projects', path: '/project-manager/my-projects', icon: 'MP' },
      { type: 'item', label: 'Project Costing', path: '/project-manager/project-costing', icon: 'PC' },
      { type: 'item', label: 'Completion Assessments', path: '/project-manager/completion-assessments', icon: 'CA' },
      { type: 'item', label: 'Site Reports', path: '/project-manager/site-reports', icon: 'SR' },
      { type: 'item', label: 'Budget Tracking', path: '/project-manager/budget-tracking', icon: 'BT' },
      { type: 'item', label: 'Documents', path: '/project-manager/documents', icon: 'DC' },
    ],
  },
  Employee: {
    portalLabel: 'Employee Self-Service',
    basePath: '/employee',
    defaultPath: '/employee/my-profile',
    entries: [
      { type: 'item', label: 'My Profile', path: '/employee/my-profile', icon: 'MP' },
      { type: 'item', label: 'Payslips', path: '/employee/payslips', icon: 'PS' },
      { type: 'item', label: 'Leave', path: '/employee/leave', icon: 'LV' },
      { type: 'item', label: 'Assigned Projects', path: '/employee/assigned-projects', icon: 'AP' },
      { type: 'item', label: 'Announcements', path: '/employee/announcements', icon: 'AN' },
    ],
  },
  Admin: {
    portalLabel: 'Admin Panel',
    basePath: '/admin',
    defaultPath: '/admin/user-management',
    entries: [
      {
        type: 'section',
        label: 'Platform',
        children: [
          { label: 'User Management', path: '/admin/user-management', icon: 'users' },
          { label: 'Rental Properties', path: '/admin/rental-properties', icon: 'building', badge: '12' },
          { label: 'Architecture', path: '/admin/architecture', icon: 'layers' },
          { label: 'Site Management', path: '/admin/site-management', icon: 'site', badge: '3', badgeTone: 'warning' },
        ],
      },
      {
        type: 'section',
        label: 'Analytics',
        children: [
          { label: 'Dashboard', path: '/admin/dashboard', icon: 'chart' },
          { label: 'Reports', path: '/admin/reports', icon: 'report' },
        ],
      },
    ],
  },
}

export function getDefaultPortalPath(role: UserRole): string {
  return PORTAL_NAV[role].defaultPath
}

export function getNavLabelForPath(role: UserRole, pathname: string): string {
  const config = PORTAL_NAV[role]
  for (const entry of config.entries) {
    if (entry.type === 'item' && entry.path === pathname) return entry.label
    if (entry.type === 'section') {
      const child = entry.children.find((c) => c.path === pathname)
      if (child) return child.label
    }
  }
  return config.portalLabel
}
