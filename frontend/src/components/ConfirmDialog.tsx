import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'
import '../styles/executive-dashboard.css'

type ConfirmDialogTone = 'danger' | 'warning' | 'info'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (reason?: string) => void | Promise<void>
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: ConfirmDialogTone
  iconGlyph?: string
  requireReason?: boolean
  reasonLabel?: string
  reasonPlaceholder?: string
  confirmingLabel?: string
}

const TONE_ICON: Record<ConfirmDialogTone, { glyph: string; cls: string }> = {
  danger: { glyph: '⚠', cls: 'confirm-dialog__icon--danger' },
  warning: { glyph: '?', cls: 'confirm-dialog__icon--warning' },
  info: { glyph: 'i', cls: 'confirm-dialog__icon--info' },
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'warning',
  iconGlyph,
  requireReason = false,
  reasonLabel = 'Reason (required)',
  reasonPlaceholder = 'Please provide a reason…',
  confirmingLabel = 'Processing…',
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('')
  const [working, setWorking] = useState(false)

  useEffect(() => {
    if (!open) return
    setReason('')
    setWorking(false)
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

  const canConfirm = !working && (!requireReason || reason.trim().length > 0)
  const icon = TONE_ICON[tone]

  async function handleConfirm() {
    if (!canConfirm) return
    setWorking(true)
    try {
      await onConfirm(requireReason ? reason.trim() : undefined)
    } finally {
      setWorking(false)
    }
  }

  return createPortal(
    <div
      className="modal-overlay"
      onClick={(event) => {
        if (event.target !== event.currentTarget || working) return
        onClose()
      }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <div className="modal confirm-dialog">
        <div className="modal__body">
          <div className={`confirm-dialog__icon ${icon.cls}`} aria-hidden="true">
            {iconGlyph ?? icon.glyph}
          </div>
          <h3 id="confirm-dialog-title" className="confirm-dialog__title">
            {title}
          </h3>
          <p id="confirm-dialog-description" className="confirm-dialog__body-text">
            {description}
          </p>
          {requireReason && (
            <div className="confirm-dialog__reason-field">
              <label className="confirm-dialog__reason-label" htmlFor="confirm-dialog-reason">
                {reasonLabel}
              </label>
              <textarea
                id="confirm-dialog-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={reasonPlaceholder}
                required
              />
            </div>
          )}
        </div>
        <div className="modal__footer">
          <button
            type="button"
            className="button button--secondary"
            onClick={onClose}
            disabled={working}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`button button--${tone === 'danger' ? 'secondary' : 'primary'}`}
            onClick={() => void handleConfirm()}
            disabled={!canConfirm}
            style={tone === 'danger' ? { borderColor: 'var(--color-error-border)', color: 'var(--color-error-text)' } : undefined}
          >
            {working ? confirmingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
