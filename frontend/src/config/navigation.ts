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
      { type: 'item', label: 'Executive Dashboard', path: '/executive/dashboard', icon: 'LayoutDashboard' },
      { type: 'item', label: 'Financial Overview', path: '/executive/financial-overview', icon: 'LineChart' },
      { type: 'item', label: 'Project Portfolio', path: '/executive/project-portfolio', icon: 'Layers' },
      { type: 'item', label: 'Equipment Rentals', path: '/executive/equipment-rentals', icon: 'Truck' },
      { type: 'item', label: 'Tax & Compliance', path: '/executive/tax-compliance', icon: 'Landmark' },
      { type: 'item', label: 'Reports', path: '/executive/reports', icon: 'FileBarChart' },
      { type: 'item', label: 'Alerts & Notifications', path: '/executive/alerts', icon: 'Bell' },
    ],
  },
  Accountant: {
    portalLabel: 'Accounting Workspace',
    basePath: '/accountant',
    defaultPath: '/accountant/dashboard',
    entries: [
      { type: 'item', label: 'Dashboard', path: '/accountant/dashboard', icon: 'LayoutDashboard' },
      { type: 'item', label: 'Chart of Accounts', path: '/accountant/chart-of-accounts', icon: 'BookOpen' },
      { type: 'item', label: 'Journal Entries', path: '/accountant/journal-entries', icon: 'NotebookPen' },
      { type: 'item', label: 'General Ledger', path: '/accountant/general-ledger', icon: 'BookText' },
      { type: 'item', label: 'Trial Balance', path: '/accountant/trial-balance', icon: 'Scale' },
      {
        type: 'section',
        label: 'Invoicing & Expenses',
        children: [
          { label: 'Invoicing', path: '/accountant/invoicing-expenses/invoicing', icon: 'FileText' },
          { label: 'Customer Payments', path: '/accountant/invoicing-expenses/customer-payments', icon: 'CreditCard' },
          { label: 'Expenses', path: '/accountant/invoicing-expenses/expenses', icon: 'Receipt' },
          { label: 'Supplier Payments', path: '/accountant/invoicing-expenses/supplier-payments', icon: 'Banknote' },
        ],
      },
      {
        type: 'section',
        label: 'Payroll & HR',
        children: [
          { label: 'Employee Records', path: '/accountant/payroll-hr/employee-records', icon: 'Users' },
          { label: 'Payroll', path: '/accountant/payroll-hr/payroll', icon: 'Wallet' },
          { label: 'Loan Management', path: '/accountant/payroll-hr/loan-management', icon: 'HandCoins' },
        ],
      },
      {
        type: 'section',
        label: 'Contacts',
        children: [
          { label: 'Customer Records', path: '/accountant/contacts/customers', icon: 'Users' },
          { label: 'Supplier Records', path: '/accountant/contacts/suppliers', icon: 'Building2' },
        ],
      },
      {
        type: 'section',
        label: 'Banking & Cash',
        children: [
          { label: 'Bank Accounts', path: '/accountant/banking-cash/bank-accounts', icon: 'Building2' },
          { label: 'Petty Cash', path: '/accountant/banking-cash/petty-cash', icon: 'Coins' },
          { label: 'Third Party Accounts', path: '/accountant/banking-cash/third-party-accounts', icon: 'UsersRound' },
        ],
      },
      {
        type: 'section',
        label: 'Asset Management',
        children: [
          { label: 'Asset Register', path: '/accountant/asset-management/asset-register', icon: 'Archive' },
          { label: 'PPE Schedule', path: '/accountant/asset-management/ppe-schedule', icon: 'ClipboardList' },
          { label: 'Depreciation Journal', path: '/accountant/asset-management/depreciation-journal', icon: 'FileClock' },
          { label: 'Equipment Rentals', path: '/accountant/asset-management/rentals', icon: 'Truck' },
        ],
      },
      {
        type: 'section',
        label: 'Budgeting',
        children: [
          { label: 'Budgets', path: '/accountant/budgeting/budgets', icon: 'PieChart' },
          { label: 'Budget vs Actual', path: '/accountant/budgeting/budget-vs-actual', icon: 'BarChart3' },
        ],
      },
      {
        type: 'section',
        label: 'Compliance & Tax',
        children: [
          { label: 'Tax Configuration', path: '/accountant/compliance-tax/tax', icon: 'FileCheck' },
        ],
      },
      {
        type: 'section',
        label: 'Reports',
        children: [
          { label: 'Financial Reports', path: '/accountant/reports/financial-reports', icon: 'FileBarChart' },
          { label: 'Site Reports (review)', path: '/accountant/site-reports-review', icon: 'FileText' },
          { label: 'Projects', path: '/accountant/projects', icon: 'Folder' },
        ],
      },
      {
        type: 'section',
        label: 'User Account',
        children: [
          { label: 'My Profile', path: '/accountant/user-account/my-profile', icon: 'UserCircle2' },
          { label: 'Settings', path: '/accountant/user-account/settings', icon: 'Settings' },
          { label: 'Policy Settings', path: '/accountant/user-account/policy-settings', icon: 'ShieldCheck' },
          { label: 'Audit Trail', path: '/accountant/user-account/audit-trail', icon: 'History' },
        ],
      },
    ],
  },
  ProjectManager: {
    portalLabel: 'Project Manager Workspace',
    basePath: '/project-manager',
    defaultPath: '/project-manager/my-projects',
    entries: [
      { type: 'item', label: 'My Projects', path: '/project-manager/my-projects', icon: 'FolderKanban' },
      { type: 'item', label: 'Project Costing', path: '/project-manager/project-costing', icon: 'Calculator' },
      { type: 'item', label: 'Completion Assessments', path: '/project-manager/completion-assessments', icon: 'CheckSquare' },
      { type: 'item', label: 'Site Reports', path: '/project-manager/site-reports', icon: 'FileText' },
      { type: 'item', label: 'Budget Tracking', path: '/project-manager/budget-tracking', icon: 'TrendingUp' },
      { type: 'item', label: 'Documents', path: '/project-manager/documents', icon: 'FolderOpen' },
    ],
  },
  Employee: {
    portalLabel: 'Employee Self-Service',
    basePath: '/employee',
    defaultPath: '/employee/my-profile',
    entries: [
      { type: 'item', label: 'My Profile', path: '/employee/my-profile', icon: 'UserCircle2' },
      { type: 'item', label: 'Payslips', path: '/employee/payslips', icon: 'FileText' },
      { type: 'item', label: 'Leave', path: '/employee/leave', icon: 'CalendarDays' },
      { type: 'item', label: 'Assigned Projects', path: '/employee/assigned-projects', icon: 'Briefcase' },
      { type: 'item', label: 'Announcements', path: '/employee/announcements', icon: 'Megaphone' },
    ],
  },
  Admin: {
    portalLabel: 'Admin Panel',
    basePath: '/admin',
    defaultPath: '/admin/user-management',
    entries: [
      { type: 'item', label: 'User Management', path: '/admin/user-management', icon: 'Users' },
      { type: 'item', label: 'Roles & Permissions', path: '/admin/roles-permissions', icon: 'Shield' },
      { type: 'item', label: 'Audit Log', path: '/admin/audit-log', icon: 'FileBarChart' },
      { type: 'item', label: 'Security Monitoring', path: '/admin/security-monitoring', icon: 'FileBarChart' },
      { type: 'item', label: 'System Settings', path: '/admin/system-settings', icon: 'Settings' },
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
