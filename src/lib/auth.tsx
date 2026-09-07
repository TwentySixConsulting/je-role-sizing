import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { SUPABASE_CONFIGURED, TEAM_EMAIL, supabase } from './supabase'

export type AuthStatus =
  /** Working out whether there is already a session. */
  | 'checking'
  /** No Supabase configured, so the app runs on browser-only storage. */
  | 'local'
  | 'signed-out'
  | 'signed-in'

interface AuthValue {
  status: AuthStatus
  /** True when work is saved to the shared team database. */
  shared: boolean
  signIn: (password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(SUPABASE_CONFIGURED ? 'checking' : 'local')

  useEffect(() => {
    if (!supabase) return
    let live = true

    supabase.auth.getSession().then(({ data }) => {
      if (live) setStatus(data.session ? 'signed-in' : 'signed-out')
    })

    // Covers a token refresh failing and an explicit sign-out in another tab.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (live) setStatus(session ? 'signed-in' : 'signed-out')
    })
    return () => {
      live = false
      data.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (password: string) => {
    if (!supabase) return
    const { error } = await supabase.auth.signInWithPassword({
      email: TEAM_EMAIL,
      password,
    })
    if (error) {
      throw new Error(
        error.message === 'Invalid login credentials'
          ? 'That password is not right.'
          : error.message,
      )
    }
  }, [])

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut()
  }, [])

  const value = useMemo<AuthValue>(
    () => ({ status, shared: status === 'signed-in', signIn, signOut }),
    [status, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const v = useContext(AuthContext)
  if (!v) throw new Error('useAuth must be used inside AuthProvider')
  return v
}
