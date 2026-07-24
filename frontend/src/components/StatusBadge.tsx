import '../styles/executive-dashboard.css'

export type StatusBadgeTone = 'success' | 'warning' | 'error' | 'info' | 'muted'

interface StatusBadgeProps {
  label: string
  tone?: StatusBadgeTone
  className?: string
}

export function StatusBadge({ label, tone = 'muted', className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`status-badge status-badge--${tone}${className ? ` ${className}` : ''}`}
      role="status"
    >
      {label}
    </span>
  )
}

export function deriveStatusBadgeFromState(state: string): { label: string; tone: StatusBadgeTone } {
  const s = state.toLowerCase()

  if (['active', 'approved', 'paid', 'completed', 'posted'].includes(s)) {
    return { label: state.charAt(0).toUpperCase() + state.slice(1), tone: 'success' }
  }
  if (['draft', 'pending', 'awaiting approval', 'part-paid', 'part paid', 'submitted', 'sent'].includes(s)) {
    return { label: state.charAt(0).toUpperCase() + state.slice(1), tone: 'warning' }
  }
  if (['overdue', 'rejected', 'failed', 'cancelled', 'terminated', 'inactive', 'deactivated'].includes(s)) {
    return { label: state.charAt(0).toUpperCase() + state.slice(1), tone: 'error' }
  }
  if (['in progress', 'informational', 'processing'].includes(s)) {
    return { label: state.charAt(0).toUpperCase() + state.slice(1), tone: 'info' }
  }

  return { label: state, tone: 'muted' }
}
