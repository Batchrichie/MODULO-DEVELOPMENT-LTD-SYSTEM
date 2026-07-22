import { PortalShell } from '../components/PortalShell'
import { PORTAL_NAV } from '../config/navigation'
import type { UserRole } from '../types/auth'

interface PortalLayoutProps {
  role: UserRole
}

export function PortalLayout({ role }: PortalLayoutProps) {
  return <PortalShell role={role} navConfig={PORTAL_NAV[role]} />
}
