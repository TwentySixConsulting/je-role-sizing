import type { Band } from '../scheme/bands'
import type { Backend } from './backend'
import { FILES_BUCKET, ROLES_TABLE, SETTINGS_TABLE, supabase } from './supabase'
import type { Role, StoredFile } from './types'

/** Column shape of je_roles. snake_case in the database, camelCase in the app. */
interface Row {
  id: string
  organisation: string
  title: string
  function_area: string
  reports_to: string
  client_grade: string
  salary: string
  jd: Role['jd']
  scores: Role['scores']
  rationale: Role['rationale']
  notes: string
  evaluator: string
  status: Role['status']
  created_at: string
  updated_at: string
  completed_at: string | null
}

function toRole(r: Row): Role {
  return {
    id: r.id,
    organisation: r.organisation ?? '',
    title: r.title ?? '',
    functionArea: r.function_area ?? '',
    reportsTo: r.reports_to ?? '',
    clientGrade: r.client_grade ?? '',
    salary: r.salary ?? '',
    jd: r.jd ?? { source: 'none', text: '' },
    scores: r.scores ?? {},
    rationale: r.rationale ?? {},
    notes: r.notes ?? '',
    evaluator: r.evaluator ?? '',
    status: r.status ?? 'draft',
    createdAt: Date.parse(r.created_at),
    updatedAt: Date.parse(r.updated_at),
    completedAt: r.completed_at ? Date.parse(r.completed_at) : undefined,
  }
}

const COLUMN: Record<keyof Role, keyof Row | null> = {
  id: 'id',
  organisation: 'organisation',
  title: 'title',
  functionArea: 'function_area',
  reportsTo: 'reports_to',
  clientGrade: 'client_grade',
  salary: 'salary',
  jd: 'jd',
  scores: 'scores',
  rationale: 'rationale',
  notes: 'notes',
  evaluator: 'evaluator',
  status: 'status',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  completedAt: 'completed_at',
}

function toRow(role: Partial<Role>): Partial<Row> {
  const row: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(role)) {
    const column = COLUMN[key as keyof Role]
    if (!column) continue
    if (key === 'createdAt' || key === 'updatedAt') {
      row[column] = new Date(value as number).toISOString()
    } else if (key === 'completedAt') {
      row[column] = value == null ? null : new Date(value as number).toISOString()
    } else {
      row[column] = value
    }
  }
  return row as Partial<Row>
}

function client() {
  if (!supabase) throw new Error('Supabase is not configured.')
  return supabase
}

/** Turns a PostgrestError into something a consultant can act on. */
function fail(context: string, error: { message: string; code?: string } | null): never {
  const hint =
    error?.code === '42P01'
      ? ' The je_roles table is missing - run the migration in supabase/migrations.'
      : error?.code === '42501'
        ? ' Permission denied, which usually means the session has expired. Sign in again.'
        : ''
  throw new Error(`${context}: ${error?.message ?? 'unknown error'}.${hint}`)
}

/** Files are stored as <roleId>/<original name>, so the name survives. */
async function filePath(roleId: string): Promise<{ path: string; name: string } | null> {
  const { data, error } = await client().storage.from(FILES_BUCKET).list(roleId, { limit: 1 })
  if (error || !data?.length) return null
  return { path: `${roleId}/${data[0].name}`, name: data[0].name }
}

export const supabaseBackend: Backend = {
  kind: 'shared',
  requiresAuth: true,

  async listRoles(): Promise<Role[]> {
    const { data, error } = await client()
      .from(ROLES_TABLE)
      .select('*')
      .order('updated_at', { ascending: false })
    if (error) fail('Could not load the roles', error)
    return (data as Row[]).map(toRole)
  },

  async getRole(id) {
    const { data, error } = await client().from(ROLES_TABLE).select('*').eq('id', id).maybeSingle()
    if (error) fail('Could not load that role', error)
    return data ? toRole(data as Row) : undefined
  },

  async putRole(role) {
    const { error } = await client().from(ROLES_TABLE).upsert(toRow(role))
    if (error) fail('Could not save that role', error)
  },

  async patchRole(id, patch) {
    // Only the changed columns go up, so two consultants editing different
    // parts of the library never overwrite each other's work.
    const row = toRow(patch)
    delete (row as Record<string, unknown>).id
    const { error } = await client().from(ROLES_TABLE).update(row).eq('id', id)
    if (error) fail('Could not save that change', error)
  },

  async putRoles(roles) {
    if (!roles.length) return
    // Chunked so a large restore does not exceed the request size limit.
    for (let i = 0; i < roles.length; i += 50) {
      const { error } = await client()
        .from(ROLES_TABLE)
        .upsert(roles.slice(i, i + 50).map(toRow))
      if (error) fail('Could not import those roles', error)
    }
  },

  async deleteRole(id) {
    const { error } = await client().from(ROLES_TABLE).delete().eq('id', id)
    if (error) fail('Could not delete that role', error)
  },

  async clearRoles() {
    // `neq` on a never-matching id, because Supabase refuses an unfiltered delete.
    const { error } = await client()
      .from(ROLES_TABLE)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) fail('Could not clear the roles', error)
  },

  async getBands(): Promise<Band[] | null> {
    const { data, error } = await client()
      .from(SETTINGS_TABLE)
      .select('bands')
      .eq('id', 'team')
      .maybeSingle()
    if (error) fail('Could not load the contribution bands', error)
    return (data?.bands as Band[] | undefined) ?? null
  },

  async putBands(bands) {
    const { error } = await client().from(SETTINGS_TABLE).upsert({ id: 'team', bands })
    if (error) fail('Could not save the contribution bands', error)
  },

  async putFile(roleId, file) {
    const { error } = await client()
      .storage.from(FILES_BUCKET)
      .upload(`${roleId}/${file.name}`, file, { upsert: true, contentType: file.type })
    // A failed upload must not lose the role: the extracted text is already
    // saved, and only the "open the original file" button is affected.
    if (error) console.warn('Could not store the original file:', error.message)
  },

  async getFile(roleId): Promise<StoredFile | undefined> {
    const found = await filePath(roleId)
    if (!found) return undefined
    const { data, error } = await client().storage.from(FILES_BUCKET).download(found.path)
    if (error || !data) return undefined
    return { roleId, name: found.name, type: data.type, blob: data }
  },

  async deleteFile(roleId) {
    const found = await filePath(roleId)
    if (found) await client().storage.from(FILES_BUCKET).remove([found.path])
  },

  subscribe(onChange) {
    const channel = client()
      .channel('je_roles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: ROLES_TABLE }, onChange)
      .subscribe()
    return () => void client().removeChannel(channel)
  },
}
