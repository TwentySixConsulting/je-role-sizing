import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { SUPABASE_CONFIGURED, TEAM_EMAIL_DOMAIN, supabase } from './supabase'

export type AuthStatus = 'checking' | 'signed-out' | 'signed-in'

interface AuthValue {
  status: AuthStatus
  /** The signed-in username, used to stamp who scored a role. */
  username: string
  /**
   * How the sign-in was checked:
   * - 'database' - Supabase Auth, enforced server-side.
   * - 'build'    - credentials baked in at build time from repository secrets.
   *                Keeps the tool out of casual view; it is not real security,
   *                because a static site has nothing to check a password
   *                against beyond what it ships to the browser.
   * - 'none'     - no credentials configured, so the app is open.
   */
  mode: 'database' | 'build' | 'none'
  signIn: (username: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

const LOCAL_SESSION_KEY = 'je.session.user'

/**
 * `VITE_APP_USERS` is `username:sha256hex` pairs separated by commas or
 * whitespace. Hashes rather than plain passwords so the built JavaScript does
 * not simply contain them.
 */
function buildUsers(): Map<string, string> {
  const raw = (import.meta.env.VITE_APP_USERS as string | undefined) ?? ''
  const map = new Map<string, string>()
  for (const entry of raw.split(/[,\s]+/).filter(Boolean)) {
    const idx = entry.lastIndexOf(':')
    if (idx < 1) continue
    const user = entry.slice(0, idx).trim().toLowerCase()
    const hash = entry.slice(idx + 1).trim().toLowerCase()
    if (user && /^[0-9a-f]{64}$/.test(hash)) map.set(user, hash)
  }
  return map
}

const BUILD_USERS = buildUsers()

export const AUTH_MODE: AuthValue['mode'] = SUPABASE_CONFIGURED
  ? 'database'
  : BUILD_USERS.size > 0
    ? 'build'
    : 'none'

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** A bare username becomes an address; a typed address is left alone. */
export function usernameToEmail(username: string): string {
  const u = username.trim().toLowerCase()
  return u.includes('@') ? u : `${u}@${TEAM_EMAIL_DOMAIN}`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(
    AUTH_MODE === 'none' ? 'signed-in' : 'checking',
  )
  const [username, setUsername] = useState('')

  useEffect(() => {
    if (AUTH_MODE === 'none') return

    if (AUTH_MODE === 'build') {
      const saved = sessionStorage.getItem(LOCAL_SESSION_KEY)
      if (saved && BUILD_USERS.has(saved)) {
        setUsername(saved)
        setStatus('signed-in')
      } else {
        setStatus('signed-out')
      }
      return
    }

    if (!supabase) return
    let live = true
    supabase.auth.getSession().then(({ data }) => {
      if (!live) return
      setUsername((data.session?.user.email ?? '').split('@')[0])
      setStatus(data.session ? 'signed-in' : 'signed-out')
    })
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!live) return
      setUsername((session?.user.email ?? '').split('@')[0])
      setStatus(session ? 'signed-in' : 'signed-out')
    })
    return () => {
      live = false
      data.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (user: string, password: string) => {
    const name = user.trim().toLowerCase()
    if (!name || !password) throw new Error('Enter a username and password.')

    if (AUTH_MODE === 'build') {
      const expected = BUILD_USERS.get(name)
      const actual = await sha256Hex(password)
      // Compare regardless of whether the username exists, so a wrong username
      // and a wrong password take the same time and give the same message.
      const ok = Boolean(expected) && expected === actual
      if (!ok) throw new Error('That username and password do not match.')
      sessionStorage.setItem(LOCAL_SESSION_KEY, name)
      setUsername(name)
      setStatus('signed-in')
      return
    }

    if (!supabase) throw new Error('Sign-in is not configured.')
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(name),
      password,
    })
    if (error) {
      throw new Error(
        error.message === 'Invalid login credentials'
          ? 'That username and password do not match.'
          : error.message,
      )
    }
  }, [])

  const signOut = useCallback(async () => {
    sessionStorage.removeItem(LOCAL_SESSION_KEY)
    if (AUTH_MODE === 'build') {
      setUsername('')
      setStatus('signed-out')
      return
    }
    await supabase?.auth.signOut()
  }, [])

  const value = useMemo<AuthValue>(
    () => ({ status, username, mode: AUTH_MODE, signIn, signOut }),
    [status, username, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const v = useContext(AuthContext)
  if (!v) throw new Error('useAuth must be used inside AuthProvider')
  return v
}
