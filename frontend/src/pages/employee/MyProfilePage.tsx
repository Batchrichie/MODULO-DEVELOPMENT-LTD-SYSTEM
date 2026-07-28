import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { fetchMyProfile, type MyEmployeeRecord } from '../../lib/rpc/accountant'
import { EmptyState } from '../../components/EmptyState'
import { FormErrorBanner } from '../../components/FormErrorBanner'
import '../../styles/executive-dashboard.css'

export function MyProfilePage() {
  const { appUser } = useAuth()
  const [profile, setProfile] = useState<MyEmployeeRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      setError(null)
      const result = await fetchMyProfile(appUser?.email)
      if (result.ok) {
        setProfile(result.data)
      } else {
        setError(result.error)
        setProfile(null)
      }
      setLoading(false)
    }

    if (appUser?.email) {
      void loadProfile()
    } else {
      setProfile(null)
      setLoading(false)
    }
  }, [appUser?.email])

  return (
    <article className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">Employee Self-Service</p>
          <h1>My Profile</h1>
          <p>View the employee profile information associated with your signed-in account.</p>
        </div>
      </header>

      <section className="users-card">
        <div className="users-card__header">
          <div>
            <h2>Profile details</h2>
            <p>Your employee record is sourced from the backend employee directory.</p>
          </div>
        </div>

        {loading ? (
          <div className="exec-dash__state-card"><h2 className="exec-dash__state-title">Loading profile</h2><p className="exec-dash__state-message">Fetching your employee profile from the backend.</p></div>
        ) : error ? (
          <>
            <FormErrorBanner message={error} />
            <EmptyState
              icon="🙁"
              title="Unable to load profile"
              description="There was a problem loading your employee profile. Try refreshing the page or contact support if the issue persists."
            />
          </>
        ) : !profile ? (
          <EmptyState
            icon="👤"
            title="Profile information unavailable"
            description="No employee record was found for your account. Please verify your user email and contact your administrator."
          />
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <tbody>
                <tr>
                  <th>Full Name</th>
                  <td>{profile.full_name ?? '—'}</td>
                </tr>
                <tr>
                  <th>Email</th>
                  <td>{profile.email ?? appUser?.email ?? '—'}</td>
                </tr>
                <tr>
                  <th>Role</th>
                  <td>{profile.role ?? 'Employee'}</td>
                </tr>
                <tr>
                  <th>Employment Status</th>
                  <td>{profile.employment_status ?? '—'}</td>
                </tr>
                <tr>
                  <th>Staff Category</th>
                  <td>{profile.staff_category ?? '—'}</td>
                </tr>
                <tr>
                  <th>User ID</th>
                  <td>{profile.employee_id ?? profile.id ?? '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>
    </article>
  )
}
