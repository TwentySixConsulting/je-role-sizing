import type { Band } from '../scheme/bands'
import type { Role, StoredFile } from './types'

/**
 * The storage seam. Two implementations:
 *
 * - `supabaseBackend` - the shared team database, used whenever the Supabase
 *   environment variables are present. Everyone sees the same roles.
 * - `localBackend` - IndexedDB in this browser, used when they are not. Handy
 *   for development and as a fallback, but nothing is shared.
 *
 * Nothing above this file knows which one it is talking to.
 */
export interface Backend {
  /** Shown in the UI so it is never ambiguous where the data lives. */
  readonly kind: 'shared' | 'local'
  /** True when the backend needs a signed-in session before it will answer. */
  readonly requiresAuth: boolean

  listRoles(): Promise<Role[]>
  getRole(id: string): Promise<Role | undefined>
  /** Insert or replace a whole role. */
  putRole(role: Role): Promise<void>
  /**
   * Write only the named fields. Preferred over `putRole` for edits, so two
   * consultants working on different roles - or on different factors of the
   * same role - do not overwrite each other's columns.
   */
  patchRole(id: string, patch: Partial<Role>): Promise<void>
  putRoles(roles: Role[]): Promise<void>
  deleteRole(id: string): Promise<void>
  clearRoles(): Promise<void>

  getBands(): Promise<Band[] | null>
  putBands(bands: Band[]): Promise<void>

  putFile(roleId: string, file: File): Promise<void>
  getFile(roleId: string): Promise<StoredFile | undefined>
  deleteFile(roleId: string): Promise<void>

  /**
   * Called when another session changes something. Returns an unsubscribe
   * function. The local backend has no peers, so it never fires.
   */
  subscribe(onChange: () => void): () => void
}
