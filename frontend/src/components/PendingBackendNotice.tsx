import '../styles/executive-dashboard.css'

interface PendingBackendNoticeProps {
  title?: string
  description?: string
  inline?: boolean
  className?: string
}

export function PendingBackendNotice({
  title = 'Pending backend',
  description = 'This action is not yet available because the required backend RPC function has not been deployed.',
  inline = false,
  className = '',
}: PendingBackendNoticeProps) {
  return (
    <div
      className={`pending-backend${inline ? ' pending-backend--inline' : ''}${className ? ` ${className}` : ''}`}
      role="note"
    >
      <span className="pending-backend__icon" aria-hidden="true">⏳</span>
      <span>
        <strong>{title}</strong>
        <p>{description}</p>
      </span>
    </div>
  )
}
