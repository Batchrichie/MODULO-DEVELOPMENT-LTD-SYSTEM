import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function LogoutButton() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <button type="button" className="logout-button" onClick={() => void handleLogout()}>
      Log out
    </button>
  )
}
