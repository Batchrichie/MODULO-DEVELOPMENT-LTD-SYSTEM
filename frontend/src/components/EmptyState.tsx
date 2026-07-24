import type { ReactNode } from 'react'
import '../styles/executive-dashboard.css'

interface EmptyStateProps {
  icon?: string
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon = '◯',
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`empty-state${className ? ` ${className}` : ''}`}>
      <div className="empty-state__icon" aria-hidden="true">{icon}</div>
      <h2 className="empty-state__title">{title}</h2>
      <p className="empty-state__description">{description}</p>
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  )
}
