import { Navigate, Route } from 'react-router-dom'
import type { ReactElement } from 'react'
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

function routeForEntry(
  entry: NavEntry,
  config: PortalNavConfig,
  pageOverrides?: Record<string, ReactElement>,
) {
  if (entry.type === 'item') {
    const relativePath = entry.path.replace(`${config.basePath}/`, '')
    const override = pageOverrides?.[entry.path]
    return (
      <Route
        key={entry.path}
        path={relativePath}
        element={
          override ?? (
            <PlaceholderPage
              title={entry.label}
              breadcrumb={breadcrumbForEntry(entry, config)}
            />
          )
        }
      />
    )
  }

  return entry.children.map((child) => {
    const relativePath = child.path.replace(`${config.basePath}/`, '')
    const override = pageOverrides?.[child.path]
    return (
      <Route
        key={child.path}
        path={relativePath}
        element={
          override ?? (
            <PlaceholderPage
              title={child.label}
              breadcrumb={childBreadcrumb(entry.label, child.label, config)}
            />
          )
        }
      />
    )
  })
}

export function createPortalChildRoutes(
  config: PortalNavConfig,
  pageOverrides?: Record<string, ReactElement>,
) {
  const routes = config.entries.flatMap((entry) =>
    routeForEntry(entry, config, pageOverrides),
  )

  return (
    <>
      <Route index element={<Navigate to={config.defaultPath.replace(`${config.basePath}/`, '')} replace />} />
      {routes}
    </>
  )
}
