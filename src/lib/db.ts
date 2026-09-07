import type { Role, Settings, StoredFile } from './types'
import { DEFAULT_BANDS } from '../scheme/bands'

const DB_NAME = 'je-role-sizing'
const DB_VERSION = 1
const ROLES = 'roles'
const FILES = 'files'
const META = 'meta'

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(ROLES)) {
        const s = db.createObjectStore(ROLES, { keyPath: 'id' })
        s.createIndex('organisation', 'organisation')
        s.createIndex('updatedAt', 'updatedAt')
      }
      if (!db.objectStoreNames.contains(FILES)) {
        db.createObjectStore(FILES, { keyPath: 'roleId' })
      }
      if (!db.objectStoreNames.contains(META)) {
        db.createObjectStore(META, { keyPath: 'key' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode)
        const req = fn(t.objectStore(store))
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => reject(req.error)
        t.onabort = () => reject(t.error)
      }),
  )
}

export const rolesDb = {
  all: () => tx<Role[]>(ROLES, 'readonly', (s) => s.getAll() as IDBRequest<Role[]>),
  get: (id: string) => tx<Role | undefined>(ROLES, 'readonly', (s) => s.get(id)),
  put: (role: Role) => tx(ROLES, 'readwrite', (s) => s.put(role)),
  putMany: async (roles: Role[]) => {
    const db = await openDb()
    return new Promise<void>((resolve, reject) => {
      const t = db.transaction(ROLES, 'readwrite')
      const store = t.objectStore(ROLES)
      roles.forEach((r) => store.put(r))
      t.oncomplete = () => resolve()
      t.onerror = () => reject(t.error)
      t.onabort = () => reject(t.error)
    })
  },
  remove: (id: string) => tx(ROLES, 'readwrite', (s) => s.delete(id)),
  clear: () => tx(ROLES, 'readwrite', (s) => s.clear()),
}

export const filesDb = {
  get: (roleId: string) => tx<StoredFile | undefined>(FILES, 'readonly', (s) => s.get(roleId)),
  put: (f: StoredFile) => tx(FILES, 'readwrite', (s) => s.put(f)),
  remove: (roleId: string) => tx(FILES, 'readwrite', (s) => s.delete(roleId)),
}

export const DEFAULT_SETTINGS: Settings = {
  evaluator: '',
  bands: DEFAULT_BANDS,
  librarySort: 'points-desc',
}

export const settingsDb = {
  async get(): Promise<Settings> {
    const row = await tx<{ key: string; value: Settings } | undefined>(META, 'readonly', (s) =>
      s.get('settings'),
    )
    // Merge over defaults so a settings object written by an older version
    // still gains any fields added since.
    return { ...DEFAULT_SETTINGS, ...(row?.value ?? {}) }
  },
  put: (value: Settings) => tx(META, 'readwrite', (s) => s.put({ key: 'settings', value })),
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}
