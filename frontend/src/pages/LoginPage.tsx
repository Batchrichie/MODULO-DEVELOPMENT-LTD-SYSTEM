import { type FormEvent, useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { companyProfile } from '../config/companyProfile'
import { getPortalPathForRole } from '../config/roles'
import { ThemeToggle } from '../components/ThemeToggle'
import { useAuth, fetchAppUser } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import '../styles/login.css'

const GENERIC_LOGIN_ERROR = 'Invalid email or password.'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { session, appUser, loading, refreshAppUser } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const redirectMessage = (location.state as { message?: string } | null)?.message

  useEffect(() => {
    if (redirectMessage) {
      setError(redirectMessage)
    }
  }, [redirectMessage])

  if (!loading && session && appUser) {
    return <Navigate to={getPortalPathForRole(appUser.role)} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError || !data.session) {
      setError(GENERIC_LOGIN_ERROR)
      setSubmitting(false)
      return
    }

    const profile = await fetchAppUser(data.session.user.id)

    if (!profile) {
      await supabase.auth.signOut()
      setError(
        'Your account is not linked to a CAREMS user profile. Contact an administrator.',
      )
      setSubmitting(false)
      return
    }

    await refreshAppUser()
    navigate(getPortalPathForRole(profile.role), { replace: true })
  }

  return (
    <div className="login-page">
      <div className="login-page__toolbar">
        <ThemeToggle />
      </div>

      <div className="login-card">
        <header className="login-card__brand">
          <div className="login-card__logo-frame" aria-hidden="true">
            {companyProfile.logoUrl ? (
              <img src={companyProfile.logoUrl} alt="" className="login-card__logo" />
            ) : (
              <svg className="login-card__logo-placeholder" viewBox="0 0 48 48" role="img">
                <path d="M9 39h30M13 39V20l11-9 11 9v19M18 39V26h12v13M20 20h8M24 11V6M21 6h6" />
              </svg>
            )}
          </div>
          <h1 className="login-card__company">{companyProfile.name}</h1>
          <p className="login-card__subtitle">Sign in to your account</p>
          <div className="login-card__tagline">
            <span />
            <strong>Construction · Architecture · Rentals</strong>
            <span />
          </div>
        </header>

        <form className="login-form" onSubmit={(e) => void handleSubmit(e)} noValidate>
          {error && (
            <p className="login-form__error" role="alert">
              {error}
            </p>
          )}

          <div className="login-form__field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <div className="login-form__field">
            <label htmlFor="password">Password</label>
            <div className="login-form__password-wrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={submitting}
              />
              <button
                type="button"
                className="login-form__password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                disabled={submitting}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  {showPassword ? (
                    <>
                      <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10.7 10.7 0 0 1 12 5c5 0 8.7 4.2 9.8 6.1a1.7 1.7 0 0 1 0 1.8 14 14 0 0 1-3.1 3.4M6.2 6.2A14 14 0 0 0 2.2 11a1.7 1.7 0 0 0 0 2C3.3 14.9 7 19 12 19c.8 0 1.6-.1 2.3-.3" />
                    </>
                  ) : (
                    <path d="M2.2 12C3.3 10.1 7 6 12 6s8.7 4.1 9.8 6a1.7 1.7 0 0 1 0 2C20.7 15.9 17 20 12 20s-8.7-4.1-9.8-6a1.7 1.7 0 0 1 0-2Z M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          <div className="login-form__options">
            <label className="login-form__remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={submitting}
              />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password">Forgot password?</Link>
          </div>

          <button type="submit" className="login-form__submit" disabled={submitting}>
            <span>{submitting ? 'Signing in...' : 'Sign In'}</span>
          </button>

          <div className="login-form__divider"><span>or</span></div>

          <div className="login-form__socials">
            <button type="button" className="login-form__social">
              <span className="login-form__social-mark login-form__social-mark--google">G</span>
              Continue with Google
            </button>
            <button type="button" className="login-form__social">
              <span className="login-form__social-mark login-form__social-mark--microsoft" aria-hidden="true">
                <i /><i /><i /><i />
              </span>
              Continue with Microsoft
            </button>
          </div>

          <p className="login-form__request">
            Need an account? <a href="mailto:access@example.com">Request access</a>
          </p>
        </form>

        <footer className="login-card__footer">
          <span><b className="trust-icon trust-icon--lock" aria-hidden="true" />Secure Access</span>
          <span><b className="trust-icon trust-icon--shield" aria-hidden="true" />Enterprise Grade</span>
        </footer>
      </div>
    </div>
  )
}
