import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { AppUser, UserRole } from '../types/auth'

interface AuthContextValue {
  session: Session | null
  appUser: AppUser | null
  loading: boolean
  refreshAppUser: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const VALID_ROLES: UserRole[] = [
  'CEO',
  'Accountant',
  'ProjectManager',
  'Employee',
  'Admin',
]

function isUserRole(value: string): value is UserRole {
  return VALID_ROLES.includes(value as UserRole)
}

async function fetchAppUser(authUserId: string): Promise<AppUser | null> {
  const { data, error } = await supabase
    .from('users')
    .select('user_id, email, role')
    .eq('auth_user_id', authUserId)
    .maybeSingle()

  if (error || !data || !isUserRole(data.role)) {
    return null
  }

  return {
    userId: data.user_id,
    email: data.email,
    role: data.role,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshAppUser = useCallback(async () => {
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession()

    if (!currentSession?.user) {
      setAppUser(null)
      return
    }

    const profile = await fetchAppUser(currentSession.user.id)
    setAppUser(profile)
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setAppUser(null)
    setSession(null)
  }, [])

  useEffect(() => {
    let mounted = true

    async function initAuth() {
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession()

      if (!mounted) return

      setSession(initialSession)

      if (initialSession?.user) {
        const profile = await fetchAppUser(initialSession.user.id)
        if (mounted) setAppUser(profile)
      }

      if (mounted) setLoading(false)
    }

    void initAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession)

      if (nextSession?.user) {
        const profile = await fetchAppUser(nextSession.user.id)
        if (mounted) setAppUser(profile)
      } else {
        setAppUser(null)
      }

      if (mounted) setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const value = useMemo(
    () => ({
      session,
      appUser,
      loading,
      refreshAppUser,
      signOut,
    }),
    [session, appUser, loading, refreshAppUser, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export { fetchAppUser }
