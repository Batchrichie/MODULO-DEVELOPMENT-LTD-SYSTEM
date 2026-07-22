import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import type { PortalNavConfig } from '../config/navigation'
import { getNavLabelForPath } from '../config/navigation'
import type { UserRole } from '../types/auth'
import { BottomNav } from './BottomNav'
import { Sidebar } from './Sidebar'
import '../styles/portal-shell.css'

interface PortalShellProps {
  role: UserRole
  navConfig: PortalNavConfig
}

function useViewportMode() {
  const [mode, setMode] = useState<'phone' | 'tablet' | 'desktop'>(() => {
    if (typeof window === 'undefined') return 'desktop'
    const w = window.innerWidth
    if (w <= 768) return 'phone'
    if (w <= 1024) return 'tablet'
    return 'desktop'
  })

  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth
      if (w <= 768) setMode('phone')
      else if (w <= 1024) setMode('tablet')
      else setMode('desktop')
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return mode
}

export function PortalShell({ role, navConfig }: PortalShellProps) {
  const location = useLocation()
  const viewport = useViewportMode()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const collapsed = false
  const isPhone = viewport === 'phone'
  const pageTitle = getNavLabelForPath(role, location.pathname)

  useEffect(() => {
    setDrawerOpen(false)
  }, [location.pathname])

  return (
    <div className="portal-shell">
      <header className="portal-shell__header">
        <div className="portal-shell__brand">
          {isPhone && (
            <button
              type="button"
              className="portal-shell__menu-btn"
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(true)}
            >
              ☰
            </button>
          )}
        </div>
        <div className="portal-shell__breadcrumb" aria-live="polite">
          <span>Platform</span><b>/</b><strong>{pageTitle}</strong>
        </div>
        <div className="portal-shell__actions">
          <button type="button" className="portal-shell__icon-btn" aria-label="Notifications"><svg viewBox="0 0 24 24"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg><i /></button>
          <button type="button" className="portal-shell__icon-btn" aria-label="Settings"><svg viewBox="0 0 24 24"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8-3.5-2.1-.8a6.4 6.4 0 0 0-.5-1.3l.9-2-1.9-1.9-2 .9a6.4 6.4 0 0 0-1.3-.5L12.3 4H9.7l-.8 2.1a6.4 6.4 0 0 0-1.3.5l-2-.9-1.9 1.9.9 2a6.4 6.4 0 0 0-.5 1.3L2 12v2l2.1.8c.1.5.3.9.5 1.3l-.9 2 1.9 1.9 2-.9c.4.2.9.4 1.3.5l.8 2.1h2.6l.8-2.1a6.4 6.4 0 0 0 1.3-.5l2 .9 1.9-1.9-.9-2c.2-.4.4-.9.5-1.3L20 14v-2Z" /></svg></button>
        </div>
      </header>

      <div className="portal-shell__body">
        {!isPhone && (
          <Sidebar
            config={navConfig}
            collapsed={collapsed}
            drawerOpen={false}
            onCloseDrawer={() => setDrawerOpen(false)}
          />
        )}
        <main className="portal-shell__main" id="main-content">
          <Outlet />
        </main>
      </div>

      {isPhone && (
        <>
          <Sidebar
            config={navConfig}
            collapsed={false}
            drawerOpen={drawerOpen}
            onCloseDrawer={() => setDrawerOpen(false)}
          />
          <BottomNav role={role} menuOpen={drawerOpen} onMenuToggle={() => setDrawerOpen((open) => !open)} />
        </>
      )}
    </div>
  )
}
