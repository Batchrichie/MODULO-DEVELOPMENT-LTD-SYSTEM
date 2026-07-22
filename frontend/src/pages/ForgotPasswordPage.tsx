import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { companyProfile } from '../config/companyProfile'
import { ThemeToggle } from '../components/ThemeToggle'
import { supabase } from '../lib/supabase'
import '../styles/login.css'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setError(null)
    setSubmitting(true)

    const redirectTo = `${window.location.origin}/login`

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo },
    )

    if (resetError) {
      setError('Unable to send reset email. Please try again later.')
      setSubmitting(false)
      return
    }

    setMessage(
      'If an account exists for that email, a password reset link has been sent.',
    )
    setSubmitting(false)
  }

  return (
    <div className="login-page">
      <div className="login-page__toolbar">
        <ThemeToggle />
      </div>

      <div className="login-card">
        <header className="login-card__brand">
          <h1 className="login-card__company">{companyProfile.name}</h1>
          <p className="login-card__subtitle">Reset your password</p>
        </header>

        <form className="login-form" onSubmit={(e) => void handleSubmit(e)} noValidate>
          {error && (
            <p className="login-form__error" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="login-form__success" role="status">
              {message}
            </p>
          )}

          <div className="login-form__field">
            <label htmlFor="reset-email">Email</label>
            <input
              id="reset-email"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
            />
          </div>

          <button type="submit" className="login-form__submit" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>

          <p className="login-form__forgot">
            <Link to="/login">Back to sign in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
