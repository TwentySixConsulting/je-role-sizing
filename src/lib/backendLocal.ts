import type { Band } from '../scheme/bands'
import type { Backend } from './backend'
import { filesDb, rolesDb, settingsDb } from './db'
import type { Role } from './types'

/** IndexedDB in this browser. Nothing is shared with anyone else. */
export const localBackend: Backend = {
  kind: 'local',
  requiresAuth: false,

  listRoles: () => rolesDb.all(),
  getRole: (id) => rolesDb.get(id),
  putRole: async (role) => void (await rolesDb.put(role)),

  async patchRole(id: string, patch: Partial<Role>) {
    const current = await rolesDb.get(id)
    if (!current) return
    await rolesDb.put({ ...current, ...patch })
  },

  putRoles: (roles) => rolesDb.putMany(roles),
  deleteRole: async (id) => void (await rolesDb.remove(id)),
  clearRoles: async () => void (await rolesDb.clear()),

  async getBands(): Promise<Band[] | null> {
    return (await settingsDb.get()).bands
  },
  async putBands(bands: Band[]) {
    const current = await settingsDb.get()
    await settingsDb.put({ ...current, bands })
  },

  putFile: async (roleId, file) =>
    void (await filesDb.put({ roleId, name: file.name, type: file.type, blob: file })),
  getFile: (roleId) => filesDb.get(roleId),
  deleteFile: async (roleId) => void (await filesDb.remove(roleId).catch(() => undefined)),

  subscribe: () => () => undefined,
}
