import { useMemo, useState } from 'react'
import { CornerstoneComposition, FactorProfile } from '../components/charts'
import { JdViewer } from '../components/JdViewer'
import { OrganisationPicker } from '../components/OrganisationPicker'
import { Badge, Button, EmptyState, Icon, Input, Modal, Select } from '../components/ui'
import { exportCsv, exportJson, exportRationaleCsv, readImport } from '../lib/exportImport'
import { go } from '../lib/route'
import { fmtPoints, scoreRole } from '../lib/scoring'
import { useStore } from '../lib/store'
import type { Role, Settings } from '../lib/types'
import { bandFor } from '../scheme/bands'
import { FACTORS } from '../scheme/scheme'

type Sort = Settings['librarySort']

const SORT_LABELS: Record<Sort, string> = {
  'points-desc': 'Most points first',
  'points-asc': 'Fewest points first',
  title: 'Job title A–Z',
  added: 'Recently added',
  updated: 'Recently updated',
}

/** Short date for the list, full date for the expanded panel. */
const shortDate = (ms: number) =>
  new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })

const longDate = (ms: number) =>
  new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

function StatusBadge({ role, complete }: { role: Role; complete: boolean }) {
  if (role.status === 'moderated') return <Badge tone="good">Moderated</Badge>
  if (!complete) return <Badge tone="warn">Draft</Badge>
  if (role.status === 'complete') return <Badge tone="ink">Complete</Badge>
  return <Badge tone="neutral">Scored</Badge>
}

export function Library() {
  const { roles, settings, saveSettings, deleteRole, updateRole, importRoles, loading, error } =
    useStore()
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [collapsedOrgs, setCollapsedOrgs] = useState<Set<string>>(new Set())
  const [confirmDelete, setConfirmDelete] = useState<Role | null>(null)
  const [importMsg, setImportMsg] = useState<string | null>(null)

  const sort = settings.librarySort

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = roles.filter((r) => {
      if (!q) return true
      return (
        r.title.toLowerCase().includes(q) ||
        r.organisation.toLowerCase().includes(q) ||
        r.functionArea.toLowerCase().includes(q) ||
        r.jd.text.toLowerCase().includes(q)
      )
    })

    const byOrg = new Map<string, Role[]>()
    for (const r of filtered) {
      const key = r.organisation.trim() || 'Unassigned'
      const list = byOrg.get(key) ?? []
      list.push(r)
      byOrg.set(key, list)
    }

    const sorted = [...byOrg.entries()].map(([org, list]) => {
      const withScores = list.map((r) => ({ role: r, score: scoreRole(r) }))
      withScores.sort((a, b) => {
        switch (sort) {
          case 'points-asc':
            return a.score.total - b.score.total || a.role.title.localeCompare(b.role.title)
          case 'title':
            return a.role.title.localeCompare(b.role.title)
          case 'added':
            return b.role.createdAt - a.role.createdAt
          case 'updated':
            return b.role.updatedAt - a.role.updatedAt
          default:
            return b.score.total - a.score.total || a.role.title.localeCompare(b.role.title)
        }
      })
      return { org, rows: withScores }
    })
    sorted.sort((a, b) => a.org.localeCompare(b.org))
    return sorted
  }, [roles, query, sort])

  const knownOrgs = useMemo(
    () => [...new Set(roles.map((r) => r.organisation).filter(Boolean))].sort(),
    [roles],
  )

  const totals = useMemo(() => {
    const complete = roles.filter((r) => scoreRole(r).complete).length
    return { all: roles.length, complete, draft: roles.length - complete }
  }, [roles])

  const onImport = async (file: File) => {
    try {
      const res = await readImport(file)
      await importRoles(res.roles)
      if (res.bands) await saveSettings({ bands: res.bands })
      setImportMsg(
        `Imported ${res.roles.length} role${res.roles.length === 1 ? '' : 's'}` +
          (res.skipped ? `, skipped ${res.skipped} unreadable entr${res.skipped === 1 ? 'y' : 'ies'}` : '') +
          '. Roles with a matching id were overwritten.',
      )
    } catch (e) {
      setImportMsg(e instanceof Error ? e.message : String(e))
    }
  }

  if (loading) return <div className="p-10 text-[13px] text-muted">Loading your roles…</div>

  return (
    <div className="mx-auto max-w-6xl px-5 py-6">
      {error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-[12.5px] text-ink-soft">
          <Icon name="warning" className="mt-px text-danger" />
          {error}
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[22px] font-semibold text-ink">Role library</h1>
          <p className="mt-1 text-[13px] text-muted">
            {totals.all === 0
              ? 'Nothing sized yet.'
              : `${totals.all} role${totals.all === 1 ? '' : 's'} · ${totals.complete} fully scored${
                  totals.draft ? ` · ${totals.draft} in draft` : ''
                }`}
          </p>
        </div>
        <Button variant="gold" onClick={() => go('/new')}>
          <Icon name="plus" size={14} />
          Add a role
        </Button>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[14rem] flex-1">
          <Icon
            name="search"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles, organisations, or inside the descriptions"
            className="pl-9"
          />
        </div>
        <Select
          value={sort}
          onChange={(e) => void saveSettings({ librarySort: e.target.value as Sort })}
          aria-label="Sort roles"
          className="w-auto!"
        >
          {(Object.keys(SORT_LABELS) as Sort[]).map((k) => (
            <option key={k} value={k}>
              {SORT_LABELS[k]}
            </option>
          ))}
        </Select>

        <div className="flex gap-2">
          <Button size="sm" onClick={() => go('/compare')} disabled={roles.length < 2}>
            <Icon name="scales" size={13} />
            Compare
          </Button>
          <Button size="sm" onClick={() => exportCsv(roles, settings.bands)} disabled={!roles.length}>
            <Icon name="download" size={13} />
            CSV
          </Button>
          <Button
            size="sm"
            onClick={() => exportRationaleCsv(roles)}
            disabled={!roles.length}
            title="One row per factor with the reason recorded for each level"
          >
            Rationale
          </Button>
          <Button size="sm" onClick={() => exportJson(roles, settings.bands)} disabled={!roles.length}>
            Backup
          </Button>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-paper px-2.5 py-1.5 text-[12px] font-medium text-ink hover:bg-line-soft">
            <Icon name="upload" size={13} />
            Restore
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (f) void onImport(f)
              }}
            />
          </label>
        </div>
      </div>

      {roles.length === 0 ? (
        <EmptyState
          title="Start with a job description"
          body="Upload a Word or PDF job description, or type a title in and paste the text. The description stays on the left while you work through the eleven factors on the right."
          action={
            <Button variant="gold" onClick={() => go('/new')}>
              <Icon name="plus" size={14} />
              Add the first role
            </Button>
          }
        />
      ) : groups.length === 0 ? (
        <EmptyState title="No matches" body={`Nothing matches "${query}". Try a shorter search.`} />
      ) : (
        <div className="space-y-5">
          {groups.map(({ org, rows }) => {
            const collapsed = collapsedOrgs.has(org)
            const done = rows.filter((r) => r.score.complete)
            const range = done.length
              ? `${fmtPoints(Math.min(...done.map((r) => r.score.total)))}–${fmtPoints(
                  Math.max(...done.map((r) => r.score.total)),
                )} points`
              : 'none fully scored'
            return (
              <section key={org}>
                <button
                  onClick={() =>
                    setCollapsedOrgs((prev) => {
                      const next = new Set(prev)
                      if (next.has(org)) next.delete(org)
                      else next.add(org)
                      return next
                    })
                  }
                  className="group mb-2 flex w-full items-center gap-2 text-left"
                >
                  <Icon
                    name="chevron"
                    size={13}
                    className={`text-faint transition-transform ${collapsed ? '' : 'rotate-90'}`}
                  />
                  <h2 className="font-display text-[15px] font-semibold text-ink">{org}</h2>
                  <span className="text-[12px] text-muted">
                    {rows.length} role{rows.length === 1 ? '' : 's'} · {range}
                  </span>
                </button>

                {!collapsed && (
                  <div className="overflow-hidden rounded-xl border border-line bg-paper">
                    <div className="flex items-center gap-3 border-b border-line bg-cream/60 px-3 py-1.5 text-[10px] font-semibold tracking-[0.06em] text-faint uppercase">
                      <span className="w-6 text-center">#</span>
                      <span className="w-3" />
                      <span className="min-w-0 flex-1">Role</span>
                      <span className="hidden w-32 shrink-0 sm:block">Progress</span>
                      <span className="hidden w-24 shrink-0 lg:block">Added</span>
                      <span className="w-24 shrink-0 text-right">Points</span>
                      <span className="hidden w-28 shrink-0 md:block">Status</span>
                      <span className="w-[4.6rem] shrink-0" />
                      <span className="w-[1.9rem] shrink-0" />
                    </div>
                    {rows.map(({ role, score }, i) => {
                      const band = score.complete ? bandFor(score.total, settings.bands) : undefined
                      const open = expanded === role.id
                      return (
                        <div key={role.id} className="border-b border-line-soft last:border-0">
                          <div
                            className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
                              open ? 'bg-cream' : 'hover:bg-cream/70'
                            }`}
                          >
                            <button
                              onClick={() => setExpanded(open ? null : role.id)}
                              aria-expanded={open}
                              className="flex min-w-0 flex-1 items-center gap-3 text-left"
                            >
                              <span className="tnum w-6 shrink-0 text-center text-[12px] font-semibold text-faint">
                                {sort === 'points-desc' || sort === 'points-asc' ? i + 1 : '·'}
                              </span>
                              <Icon
                                name="chevron"
                                size={12}
                                className={`shrink-0 text-faint transition-transform ${open ? 'rotate-90' : ''}`}
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-[13.5px] font-semibold text-ink">
                                  {role.title || 'Untitled role'}
                                </span>
                                <span className="block truncate text-[11.5px] text-muted">
                                  {[role.functionArea, role.clientGrade && `grade ${role.clientGrade}`, role.salary]
                                    .filter(Boolean)
                                    .join(' · ') ||
                                    role.jd.fileName ||
                                    (role.jd.text ? 'Description pasted in' : 'No description')}
                                </span>
                              </span>
                            </button>

                            <div className="hidden w-32 shrink-0 sm:block">
                              <div className="h-[5px] w-full overflow-hidden rounded-full bg-line-soft">
                                <div
                                  className="h-full rounded-r-[4px] bg-gold"
                                  style={{ width: `${(score.scoredCount / score.totalFactors) * 100}%` }}
                                />
                              </div>
                              <div className="mt-1 text-[10.5px] text-faint">
                                {score.scoredCount}/{score.totalFactors} factors
                              </div>
                            </div>

                            <div className="hidden w-24 shrink-0 lg:block">
                              <div
                                className="text-[11.5px] text-muted"
                                title={`Added ${longDate(role.createdAt)}`}
                              >
                                {shortDate(role.createdAt)}
                              </div>
                              <div className="mt-0.5 text-[10.5px] text-faint">added</div>
                            </div>

                            <div className="w-24 shrink-0 text-right">
                              <div className="tnum text-[15px] leading-none font-bold text-ink">
                                {fmtPoints(score.total)}
                              </div>
                              <div className="mt-1 truncate text-[10.5px] font-semibold text-gold-deep">
                                {band?.name ?? ''}
                              </div>
                            </div>

                            <div className="hidden w-28 shrink-0 md:block">
                              <StatusBadge role={role} complete={score.complete} />
                            </div>

                            <Button size="sm" variant="secondary" onClick={() => go(`/evaluate/${role.id}`)}>
                              {score.complete ? 'Review' : 'Continue'}
                            </Button>

                            <button
                              onClick={() => setConfirmDelete(role)}
                              aria-label={`Delete ${role.title || 'this role'}`}
                              title="Delete this role"
                              className="shrink-0 rounded-lg p-1.5 text-faint hover:bg-red-50 hover:text-danger"
                            >
                              <Icon name="trash" size={15} />
                            </button>
                          </div>

                          {open && (
                            <div className="animate-rise grid gap-4 border-t border-line bg-cream px-3 py-4 lg:grid-cols-[1.25fr_1fr]">
                              <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-paper">
                                <div className="flex items-center justify-between gap-2 border-b border-line px-3.5 py-2">
                                  <h3 className="font-display text-[12.5px] font-semibold text-ink">
                                    Job description
                                  </h3>
                                  <span className="truncate text-[11px] text-faint">
                                    {role.jd.fileName ??
                                      (role.jd.source === 'pasted' ? 'Pasted in' : 'None stored')}
                                  </span>
                                </div>
                                <div className="h-80">
                                  <JdViewer jd={role.jd} className="h-full" />
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div className="rounded-xl border border-line bg-paper p-3.5">
                                  <h3 className="mb-2.5 font-display text-[12.5px] font-semibold text-ink">
                                    Where the points come from
                                  </h3>
                                  <CornerstoneComposition score={score} />
                                </div>
                                <div className="rounded-xl border border-line bg-paper p-3.5">
                                  <h3 className="mb-2 font-display text-[12.5px] font-semibold text-ink">
                                    Factor profile
                                  </h3>
                                  <FactorProfile
                                    score={score}
                                    compact
                                    onPick={() => go(`/evaluate/${role.id}`)}
                                  />
                                </div>
                                {role.notes && (
                                  <div className="rounded-xl border border-line bg-paper p-3.5">
                                    <h3 className="mb-1.5 font-display text-[12.5px] font-semibold text-ink">
                                      Evaluation note
                                    </h3>
                                    <p className="text-[12px] leading-relaxed whitespace-pre-wrap text-muted">
                                      {role.notes}
                                    </p>
                                  </div>
                                )}
                                <div className="rounded-xl border border-line bg-paper p-3.5">
                                  <OrganisationPicker
                                    value={role.organisation}
                                    onChange={(next) =>
                                      void updateRole(role.id, { organisation: next })
                                    }
                                    known={knownOrgs}
                                    label="Organisation"
                                    hint="changing this moves the role"
                                    compact
                                  />
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <Button size="sm" onClick={() => go(`/evaluate/${role.id}`)}>
                                    Open scoring
                                  </Button>
                                  <Button size="sm" onClick={() => go(`/report/${role.id}`)}>
                                    <Icon name="doc" size={13} />
                                    Report
                                  </Button>
                                  <Button size="sm" variant="danger" onClick={() => setConfirmDelete(role)}>
                                    <Icon name="trash" size={13} />
                                    Delete
                                  </Button>
                                </div>
                                <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11.5px]">
                                  <div>
                                    <dt className="text-[10px] font-semibold tracking-[0.06em] text-faint uppercase">
                                      Added
                                    </dt>
                                    <dd className="text-ink-soft">{longDate(role.createdAt)}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-[10px] font-semibold tracking-[0.06em] text-faint uppercase">
                                      Last updated
                                    </dt>
                                    <dd className="text-ink-soft">{longDate(role.updatedAt)}</dd>
                                  </div>
                                  {role.completedAt && (
                                    <div>
                                      <dt className="text-[10px] font-semibold tracking-[0.06em] text-faint uppercase">
                                        Fully scored
                                      </dt>
                                      <dd className="text-ink-soft">{longDate(role.completedAt)}</dd>
                                    </div>
                                  )}
                                  <div>
                                    <dt className="text-[10px] font-semibold tracking-[0.06em] text-faint uppercase">
                                      Scored by
                                    </dt>
                                    <dd className="text-ink-soft">{role.evaluator || '—'}</dd>
                                  </div>
                                </dl>
                                <p className="text-[11px] text-faint">
                                  {FACTORS.filter((f) => role.rationale[f.id]).length} of{' '}
                                  {FACTORS.length} levels have a written reason
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete this role?"
      >
        <p className="text-[13px] leading-relaxed text-ink-soft">
          <span className="font-semibold">{confirmDelete?.title}</span> and its scores, written
          reasons and stored job description will be removed from this browser. This cannot be
          undone, so take a backup first if you might need it.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={() => setConfirmDelete(null)}>Keep it</Button>
          <Button
            variant="danger"
            onClick={() => {
              if (confirmDelete) void deleteRole(confirmDelete.id)
              setConfirmDelete(null)
              setExpanded(null)
            }}
          >
            Delete permanently
          </Button>
        </div>
      </Modal>

      <Modal open={!!importMsg} onClose={() => setImportMsg(null)} title="Restore from backup">
        <p className="text-[13px] leading-relaxed text-ink-soft">{importMsg}</p>
        <div className="mt-4 flex justify-end">
          <Button variant="primary" onClick={() => setImportMsg(null)}>
            Close
          </Button>
        </div>
      </Modal>
    </div>
  )
}
