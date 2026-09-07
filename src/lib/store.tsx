import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { DEFAULT_BANDS } from '../scheme/bands'
import type { Backend } from './backend'
import { localBackend } from './backendLocal'
import { supabaseBackend } from './backendSupabase'
import { DEFAULT_SETTINGS, newId, settingsDb } from './db'
import { isFullyScored } from './scoring'
import { SUPABASE_CONFIGURED } from './supabase'
import type { Role, Settings, StoredFile } from './types'

/** Shared team database when it is configured, this browser otherwise. */
export const backend: Backend = SUPABASE_CONFIGURED ? supabaseBackend : localBackend

interface StoreValue {
  roles: Role[]
  settings: Settings
  loading: boolean
  error: string | null
  /** Where the data lives, so the UI can say so plainly. */
  storage: Backend['kind']
  createRole: (init: Partial<Role>, file?: File | null) => Promise<Role>
  updateRole: (id: string, patch: Partial<Role>) => Promise<void>
  setScore: (id: string, factorId: string, level: number | null) => Promise<void>
  setRationale: (id: string, factorId: string, text: string) => Promise<void>
  deleteRole: (id: string) => Promise<void>
  importRoles: (roles: Role[]) => Promise<void>
  clearAllRoles: () => Promise<void>
  saveSettings: (patch: Partial<Settings>) => Promise<void>
  getFile: (id: string) => Promise<StoredFile | undefined>
  refresh: () => Promise<void>
}

const StoreContext = createContext<StoreValue | null>(null)

export function emptyRole(init: Partial<Role> = {}): Role {
  const now = Date.now()
  return {
    id: newId(),
    organisation: '',
    title: '',
    functionArea: '',
    reportsTo: '',
    clientGrade: '',
    salary: '',
    jd: { source: 'none', text: '' },
    scores: {},
    rationale: {},
    notes: '',
    evaluator: '',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    ...init,
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [roles, setRoles] = useState<Role[]>([])
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /** Roles this session has written, so its own writes do not trigger a reload. */
  const ownWrites = useRef(0)

  const load = useCallback(async () => {
    // Evaluator name and list sort are per person, so they stay local even when
    // the roles themselves are shared.
    const [remoteRoles, localSettings, sharedBands] = await Promise.all([
      backend.listRoles(),
      settingsDb.get(),
      backend.getBands(),
    ])
    setRoles(remoteRoles)
    setSettings({ ...localSettings, bands: sharedBands ?? DEFAULT_BANDS })
  }, [])

  useEffect(() => {
    let live = true
    load()
      .catch((e) => live && setError(describe(e)))
      .finally(() => live && setLoading(false))
    return () => {
      live = false
    }
  }, [load])

  // A colleague's change arrives here. Reload the list rather than trying to
  // patch it, so the library is always what the database actually holds.
  useEffect(() => {
    return backend.subscribe(() => {
      if (ownWrites.current > 0) {
        ownWrites.current -= 1
        return
      }
      backend
        .listRoles()
        .then(setRoles)
        .catch(() => undefined)
    })
  }, [])

  /** Apply a change locally straight away, then persist it. */
  const applyLocal = useCallback((role: Role) => {
    setRoles((prev) => {
      const i = prev.findIndex((r) => r.id === role.id)
      if (i === -1) return [...prev, role]
      const copy = [...prev]
      copy[i] = role
      return copy
    })
  }, [])

  const current = useCallback(
    async (id: string): Promise<Role | undefined> =>
      roles.find((r) => r.id === id) ?? (await backend.getRole(id)),
    [roles],
  )

  /**
   * Writes the given fields plus updated_at, and keeps completedAt in step with
   * whether every factor now carries a level.
   */
  const persistPatch = useCallback(
    async (role: Role, patch: Partial<Role>) => {
      const merged: Role = { ...role, ...patch, updatedAt: Date.now() }
      const complete = isFullyScored(merged)
      merged.completedAt = complete ? (role.completedAt ?? merged.updatedAt) : undefined

      applyLocal(merged)
      ownWrites.current += 1
      try {
        await backend.patchRole(role.id, {
          ...patch,
          updatedAt: merged.updatedAt,
          completedAt: merged.completedAt,
        })
      } catch (e) {
        // Put the old value back rather than showing a change that did not save.
        applyLocal(role)
        setError(describe(e))
        throw e
      }
    },
    [applyLocal],
  )

  const createRole = useCallback(
    async (init: Partial<Role>, file?: File | null) => {
      const role = emptyRole({ evaluator: settings.evaluator, ...init })
      ownWrites.current += 1
      await backend.putRole(role)
      applyLocal(role)
      if (file) await backend.putFile(role.id, file)
      return role
    },
    [applyLocal, settings.evaluator],
  )

  const updateRole = useCallback(
    async (id: string, patch: Partial<Role>) => {
      const role = await current(id)
      if (role) await persistPatch(role, patch)
    },
    [current, persistPatch],
  )

  const setScore = useCallback(
    async (id: string, factorId: string, level: number | null) => {
      const role = await current(id)
      if (!role) return
      const scores = { ...role.scores }
      if (level == null) delete scores[factorId]
      else scores[factorId] = level
      await persistPatch(role, { scores })
    },
    [current, persistPatch],
  )

  const setRationale = useCallback(
    async (id: string, factorId: string, text: string) => {
      const role = await current(id)
      if (!role) return
      const rationale = { ...role.rationale }
      if (text.trim()) rationale[factorId] = text
      else delete rationale[factorId]
      await persistPatch(role, { rationale })
    },
    [current, persistPatch],
  )

  const deleteRole = useCallback(async (id: string) => {
    ownWrites.current += 1
    await backend.deleteRole(id)
    await backend.deleteFile(id).catch(() => undefined)
    setRoles((prev) => prev.filter((r) => r.id !== id))
  }, [])

  const importRoles = useCallback(
    async (incoming: Role[]) => {
      ownWrites.current += 1
      await backend.putRoles(incoming)
      setRoles(await backend.listRoles())
    },
    [],
  )

  const clearAllRoles = useCallback(async () => {
    ownWrites.current += 1
    await backend.clearRoles()
    setRoles([])
  }, [])

  const saveSettings = useCallback(
    async (patch: Partial<Settings>) => {
      const next = { ...settings, ...patch }
      setSettings(next)
      // Bands are a team decision; the rest is personal preference.
      await settingsDb.put(next)
      if (patch.bands) await backend.putBands(patch.bands)
    },
    [settings],
  )

  const value = useMemo<StoreValue>(
    () => ({
      roles,
      settings,
      loading,
      error,
      storage: backend.kind,
      createRole,
      updateRole,
      setScore,
      setRationale,
      deleteRole,
      importRoles,
      clearAllRoles,
      saveSettings,
      getFile: backend.getFile,
      refresh: load,
    }),
    [
      roles,
      settings,
      loading,
      error,
      createRole,
      updateRole,
      setScore,
      setRationale,
      deleteRole,
      importRoles,
      clearAllRoles,
      saveSettings,
      load,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

function describe(e: unknown): string {
  const message = e instanceof Error ? e.message : String(e)
  return /Failed to fetch|NetworkError/i.test(message)
    ? `${message}. Check your connection - the shared database could not be reached.`
    : message
}

export function useStore(): StoreValue {
  const v = useContext(StoreContext)
  if (!v) throw new Error('useStore must be used inside StoreProvider')
  return v
}
