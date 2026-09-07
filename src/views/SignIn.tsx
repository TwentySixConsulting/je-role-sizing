import { useState } from 'react'
import { Button, Icon } from '../components/ui'
import { useAuth } from '../lib/auth'

export function SignIn() {
  const { signIn } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return
    setBusy(true)
    setError(null)
    try {
      await signIn(password)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink font-display text-[15px] font-semibold text-gold">
            26
          </span>
          <div>
            <h1 className="font-display text-[17px] leading-tight font-semibold text-ink">
              Role Sizing
            </h1>
            <p className="text-[12px] leading-tight text-faint">TwentySix Consulting</p>
          </div>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-line bg-paper p-5 shadow-[0_1px_3px_rgba(19,26,46,0.05)]">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.07em] text-muted uppercase">
              Team password
            </span>
            <input
              type="password"
              autoFocus
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-line bg-cream px-3 py-2.5 text-[14px] text-ink focus:border-gold focus:bg-paper focus:ring-2 focus:ring-gold/25 focus:outline-none"
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
            disabled={!password || busy}
            className="mt-4 w-full"
          >
            {busy ? 'Signing in…' : 'Open the role library'}
          </Button>
        </form>

        <p className="mt-4 text-center text-[11.5px] leading-relaxed text-faint">
          Client job descriptions are stored in TwentySix's own database and are only
          readable once you are signed in.
        </p>
      </div>
    </div>
  )
}
