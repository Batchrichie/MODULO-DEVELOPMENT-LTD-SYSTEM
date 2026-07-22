import type { UserRole } from '../types/auth'
import { getDefaultPortalPath } from './navigation'

export const ROLE_PORTAL_PATH: Record<UserRole, string> = {
  CEO: getDefaultPortalPath('CEO'),
  Accountant: getDefaultPortalPath('Accountant'),
  ProjectManager: getDefaultPortalPath('ProjectManager'),
  Employee: getDefaultPortalPath('Employee'),
  Admin: getDefaultPortalPath('Admin'),
}

export const ROLE_LABEL: Record<UserRole, string> = {
  CEO: 'Executive',
  Accountant: 'Accountant Workspace',
  ProjectManager: 'Project Manager Workspace',
  Employee: 'Employee Self-Service',
  Admin: 'Admin Panel',
}

export function getPortalPathForRole(role: UserRole): string {
  return ROLE_PORTAL_PATH[role]
}
