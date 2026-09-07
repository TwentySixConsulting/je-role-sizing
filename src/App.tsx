import { Compare } from './views/Compare'
import { Evaluate } from './views/Evaluate'
import { Library } from './views/Library'
import { NewRole } from './views/NewRole'
import { Report } from './views/Report'
import { SchemeReference } from './views/SchemeReference'
import { SettingsView } from './views/SettingsView'
import { SignIn } from './views/SignIn'
import { Icon } from './components/ui'
import { AuthProvider, useAuth } from './lib/auth'
import { go, useRoute } from './lib/route'
import { StoreProvider, useStore } from './lib/store'

const NAV = [
  { name: 'library', label: 'Roles', path: '/', icon: 'book' },
  { name: 'compare', label: 'Compare', path: '/compare', icon: 'scales' },
  { name: 'scheme', label: 'Scheme', path: '/scheme', icon: 'doc' },
  { name: 'settings', label: 'Settings', path: '/settings', icon: 'cog' },
] as const

function Chrome() {
  const route = useRoute()
  const { roles, storage } = useStore()
  const { shared, signOut } = useAuth()
  // The scoring screen manages its own full-height layout.
  const fullBleed = route.name === 'evaluate'

  return (
    <div className="min-h-screen">
      <header className="no-print sticky top-0 z-30 border-b border-line bg-paper/90 backdrop-blur">
        <div className="flex h-13 items-center gap-4 px-4">
          <button
            onClick={() => go('/')}
            className="flex items-center gap-2.5 text-left"
            aria-label="Role sizing home"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink font-display text-[12px] font-semibold text-gold">
              26
            </span>
            <span>
              <span className="block font-display text-[13.5px] leading-tight font-semibold text-ink">
                Role Sizing
              </span>
              <span className="block text-[10.5px] leading-tight text-faint">
                TwentySix Consulting
              </span>
            </span>
          </button>

          <nav className="ml-2 flex items-center gap-0.5">
            {NAV.map((item) => {
              const active =
                route.name === item.name ||
                (item.name === 'library' && (route.name === 'new' || route.name === 'report'))
              return (
                <button
                  key={item.name}
                  onClick={() => go(item.path)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium transition-colors ${
                    active ? 'bg-line-soft text-ink' : 'text-muted hover:bg-line-soft/70 hover:text-ink'
                  }`}
                >
                  <Icon name={item.icon} size={14} />
                  {item.label}
                  {item.name === 'library' && roles.length > 0 && (
                    <span className="tnum ml-0.5 text-[10.5px] text-faint">{roles.length}</span>
                  )}
                </button>
              )
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {storage === 'local' && (
              <span
                title="This copy saves to your browser only. Nothing is shared with the rest of the team."
                className="hidden items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-warn sm:flex"
              >
                <Icon name="warning" size={12} />
                Local copy
              </span>
            )}
            <button
              onClick={() => go('/new')}
              className="flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-[12.5px] font-semibold text-ink transition-colors hover:bg-gold-deep hover:text-white"
            >
              <Icon name="plus" size={14} />
              Add a role
            </button>
            {shared && (
              <button
                onClick={() => void signOut()}
                title="Sign out of the shared library"
                className="rounded-lg p-1.5 text-muted hover:bg-line-soft hover:text-ink"
                aria-label="Sign out"
              >
                <Icon name="signout" size={15} />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className={fullBleed ? '' : 'pb-16'}>
        {route.name === 'library' && <Library />}
        {route.name === 'new' && <NewRole />}
        {route.name === 'evaluate' && <Evaluate id={route.id} />}
        {route.name === 'report' && <Report id={route.id} />}
        {route.name === 'compare' && <Compare />}
        {route.name === 'scheme' && <SchemeReference />}
        {route.name === 'settings' && <SettingsView />}
      </main>
    </div>
  )
}

/** Nothing loads until we know whether a session is needed. */
function Gate() {
  const { status } = useAuth()

  if (status === 'checking') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[13px] text-muted">Opening the role library…</p>
      </div>
    )
  }
  if (status === 'signed-out') return <SignIn />

  return (
    <StoreProvider>
      <Chrome />
    </StoreProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}
