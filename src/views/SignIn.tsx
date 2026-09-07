import { useState } from 'react'
import { Logo } from '../components/Logo'
import { Button, Icon } from '../components/ui'
import { useAuth } from '../lib/auth'

const FIELD =
  'w-full rounded-lg border border-line bg-cream px-3 py-2.5 text-[14px] text-ink focus:border-gold focus:bg-paper focus:ring-2 focus:ring-gold/25 focus:outline-none'

export function SignIn() {
  const { signIn, mode } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) return
    setBusy(true)
    setError(null)
    try {
      await signIn(username, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-7">
          <Logo height={30} />
          <h1 className="mt-4 font-display text-[19px] leading-tight font-semibold text-ink">
            Role Sizing
          </h1>
          <p className="mt-1 text-[12.5px] text-muted">
            Sign in to open the shared role library.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-2xl border border-line bg-paper p-5 shadow-[0_1px_3px_rgba(19,26,46,0.05)]"
        >
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.07em] text-muted uppercase">
              Username
            </span>
            <input
              autoFocus
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={FIELD}
            />
          </label>

          <label className="mt-3 block">
            <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.07em] text-muted uppercase">
              Password
            </span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={FIELD}
            />
          </label>

          {error && (
            <p className="mt-2.5 flex items-start gap-1.5 text-[12px] leading-relaxed text-danger">
              <Icon name="warning" size={13} className="mt-px" />
              {error}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            disabled={!username || !password || busy}
            className="mt-4 w-full"
          >
            {busy ? 'Signing in…' : 'Open the role library'}
          </Button>
        </form>

        <p className="mt-4 text-center text-[11.5px] leading-relaxed text-faint">
          {mode === 'database'
            ? 'Roles are stored in TwentySix’s own database and are only readable once you are signed in.'
            : 'For TwentySix consultants. Roles are saved in your own browser on this device.'}
        </p>
      </div>
    </div>
  )
}
