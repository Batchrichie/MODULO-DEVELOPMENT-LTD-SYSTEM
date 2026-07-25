import { useEffect, useState, type ReactNode } from 'react'

export type AdminPageState = 'loading' | 'ready' | 'unsupported'

interface AdminPageFrameProps {
  eyebrow: string
  title: string
  description: string
  summary: string
  badge: string
  status: AdminPageState
  children: ReactNode
  note?: string
}

export function AdminPageFrame({
  eyebrow,
  title,
  description,
  summary,
  badge,
  status,
  children,
  note,
}: AdminPageFrameProps) {
  const [screenState, setScreenState] = useState<AdminPageState>('loading')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setScreenState(status)
    }, 160)

    return () => window.clearTimeout(timer)
  }, [status])

  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <span className="status-pill">{badge}</span>
      </header>

      <section className="admin-dashboard__stats" aria-label="Admin status overview">
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--blue">
            <svg viewBox="0 0 24 24">
              <path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Z" />
            </svg>
          </div>
          <div className="stat-card__content">
            <span>Current status</span>
            <strong>{screenState === 'loading' ? 'Checking' : screenState === 'unsupported' ? 'Not available yet' : 'Ready'}</strong>
            <small>{summary}</small>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--purple">
            <svg viewBox="0 0 24 24">
              <path d="M5 5h14v14H5z" />
              <path d="M9 9h6M9 12h6M9 15h4" />
            </svg>
          </div>
          <div className="stat-card__content">
            <span>Verified scope</span>
            <strong>{note ? 'Contract-backed' : 'Documentation-backed'}</strong>
            <small>No financial RPCs are used in this portal.</small>
          </div>
        </div>
      </section>

      {screenState === 'loading' ? (
        <section className="users-card" aria-busy="true">
          <div className="users-card__empty">
            <div className="empty-illustration" />
            <h2>Loading admin view</h2>
            <p>Verifying the documented access surface before rendering the screen content.</p>
          </div>
        </section>
      ) : (
        <section className="users-card">
          {children}
        </section>
      )}
    </article>
  )
}
