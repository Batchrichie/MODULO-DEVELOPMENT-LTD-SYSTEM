import { createPortal } from 'react-dom'
import { useEffect, type CSSProperties, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  maxWidth?: number | string
  labelledById?: string
  overlayStyle?: CSSProperties
  contentStyle?: CSSProperties
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth,
  labelledById,
  overlayStyle,
  contentStyle,
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = originalOverflow
    }
  }, [open, onClose])

  if (!open) return null

  const titleId = labelledById ?? 'modal-title'
  const resolvedContentStyle = {
    ...(maxWidth !== undefined ? { maxWidth } : {}),
    ...(contentStyle ?? {}),
  }

  return createPortal(
    <div
      className="modal-overlay"
      style={overlayStyle}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return
        onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="modal" style={resolvedContentStyle}>
        <div className="modal__header">
          <div className="modal__header-text">
            <h2 id={titleId} className="modal__title">
              {title}
            </h2>
            {subtitle && <p className="modal__subtitle">{subtitle}</p>}
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            className="modal__close"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
