import { Navigate, Route } from 'react-router-dom'
import type { NavEntry, PortalNavConfig } from '../config/navigation'
import { PlaceholderPage } from '../pages/PlaceholderPage'

function breadcrumbForEntry(entry: NavEntry, config: PortalNavConfig): string {
  if (entry.type === 'item') {
    return `${config.portalLabel} › ${entry.label}`
  }
  return `${config.portalLabel} › ${entry.label}`
}

function childBreadcrumb(sectionLabel: string, childLabel: string, config: PortalNavConfig): string {
  return `${config.portalLabel} › ${sectionLabel} › ${childLabel}`
}

function routeForEntry(entry: NavEntry, config: PortalNavConfig) {
  if (entry.type === 'item') {
    const relativePath = entry.path.replace(`${config.basePath}/`, '')
    return (
      <Route
        key={entry.path}
        path={relativePath}
        element={
          <PlaceholderPage
            title={entry.label}
            breadcrumb={breadcrumbForEntry(entry, config)}
          />
        }
      />
    )
  }

  return entry.children.map((child) => {
    const relativePath = child.path.replace(`${config.basePath}/`, '')
    return (
      <Route
        key={child.path}
        path={relativePath}
        element={
          <PlaceholderPage
            title={child.label}
            breadcrumb={childBreadcrumb(entry.label, child.label, config)}
          />
        }
      />
    )
  })
}

export function createPortalChildRoutes(config: PortalNavConfig) {
  const routes = config.entries.flatMap((entry) => routeForEntry(entry, config))

  return (
    <>
      <Route index element={<Navigate to={config.defaultPath.replace(`${config.basePath}/`, '')} replace />} />
      {routes}
    </>
  )
}
