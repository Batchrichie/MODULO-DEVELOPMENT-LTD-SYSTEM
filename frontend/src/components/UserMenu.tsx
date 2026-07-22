import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export function UserMenu() {
  const [open, setOpen] = useState(false)
  const { signOut } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="user-menu">
      {open && <button className="user-menu__backdrop" type="button" aria-label="Close account menu" onClick={() => setOpen(false)} />}
      <button type="button" className="user-menu__trigger" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((value) => !value)}>
        <span className="user-menu__avatar">JD</span>
        <span className="user-menu__identity"><strong>John Doe</strong><small>Super Admin</small></span>
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
      </button>
      {open && (
        <div className="user-menu__dropdown" role="menu">
          <button type="button" role="menuitem" onClick={() => setOpen(false)}>Profile</button>
          <button type="button" role="menuitem" onClick={() => setOpen(false)}>Settings</button>
          <button type="button" role="menuitem" className="user-menu__theme" onClick={toggleTheme}><span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span><span className="user-menu__theme-state">{theme === 'light' ? 'Off' : 'On'}</span></button>
          <div className="user-menu__divider" />
          <button type="button" role="menuitem" className="user-menu__logout" onClick={() => void handleLogout()}>Log Out</button>
        </div>
      )}
    </div>
  )
}
