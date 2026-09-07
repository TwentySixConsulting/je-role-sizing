import { Fragment, useMemo, useState } from 'react'
import { CornerstoneDot } from '../components/charts'
import { Button, EmptyState, Icon, Input } from '../components/ui'
import { go } from '../lib/route'
import { fmtPoints, median, scoreRole } from '../lib/scoring'
import { useStore } from '../lib/store'
import { bandFor } from '../scheme/bands'
import { CORNERSTONES, FACTORS } from '../scheme/scheme'

const MAX_COLUMNS = 5

export function Compare() {
  const { roles, settings } = useStore()
  const [picked, setPicked] = useState<string[]>([])
  const [query, setQuery] = useState('')

  const options = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...roles]
      .filter((r) => !q || r.title.toLowerCase().includes(q) || r.organisation.toLowerCase().includes(q))
      .sort((a, b) => {
        const orgCmp = a.organisation.localeCompare(b.organisation)
        return orgCmp !== 0 ? orgCmp : scoreRole(b).total - scoreRole(a).total
      })
  }, [roles, query])

  const chosen = useMemo(
    () =>
      picked
        .map((id) => roles.find((r) => r.id === id))
        .filter((r): r is NonNullable<typeof r> => !!r)
        .map((role) => ({ role, score: scoreRole(role) }))
        .sort((a, b) => b.score.total - a.score.total),
    [picked, roles],
  )

  const toggle = (id: string) =>
    setPicked((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX_COLUMNS
          ? prev
          : [...prev, id],
    )

  return (
    <div className="mx-auto max-w-6xl px-5 py-6">
      <button
        onClick={() => go('/')}
        className="mb-4 flex items-center gap-1 text-[12px] font-medium text-muted hover:text-ink"
      >
        <Icon name="chevron" className="rotate-180" size={13} />
        Library
      </button>

      <h1 className="font-display text-[22px] font-semibold text-ink">Compare roles</h1>
      <p className="mt-1 mb-5 max-w-2xl text-[13px] leading-relaxed text-muted">
        Put up to {MAX_COLUMNS} roles side by side, factor by factor. Cells that sit away from the
        row's middle are tinted, which is how you catch a level that was applied inconsistently
        across a structure.
      </p>

      {roles.length < 2 ? (
        <EmptyState
          title="Not enough roles yet"
          body="Size at least two roles and you can line them up against each other here."
        />
      ) : (
        <>
          {/* Picker */}
          <div className="mb-5 rounded-xl border border-line bg-paper p-3.5">
            <div className="mb-2.5 flex flex-wrap items-center gap-2">
              <div className="relative min-w-[12rem] flex-1">
                <Icon
                  name="search"
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint"
                />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Find a role"
                  className="pl-9"
                />
              </div>
              <span className="text-[12px] text-muted">
                {picked.length} of {MAX_COLUMNS} chosen
              </span>
              {picked.length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => setPicked([])}>
                  Clear
                </Button>
              )}
            </div>

            <div className="scroll-slim flex max-h-48 flex-wrap gap-1.5 overflow-y-auto">
              {options.map((r) => {
                const on = picked.includes(r.id)
                const s = scoreRole(r)
                return (
                  <button
                    key={r.id}
                    onClick={() => toggle(r.id)}
                    disabled={!on && picked.length >= MAX_COLUMNS}
                    className={`rounded-lg border px-2.5 py-1.5 text-left text-[12px] transition-colors disabled:opacity-40 ${
                      on
                        ? 'border-gold bg-gold-wash text-ink'
                        : 'border-line bg-paper text-ink-soft hover:bg-line-soft'
                    }`}
                  >
                    <span className="font-semibold">{r.title || 'Untitled'}</span>
                    <span className="tnum ml-2 text-faint">{fmtPoints(s.total)}</span>
                    <span className="block text-[10.5px] text-faint">{r.organisation || 'Unassigned'}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {chosen.length === 0 ? (
            <EmptyState title="Pick some roles" body="Choose two or more above to build the comparison." />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-line bg-paper">
              <table className="w-full min-w-[42rem] border-collapse text-left text-[12px]">
                <thead>
                  <tr className="border-b border-line">
                    <th className="sticky left-0 z-10 bg-paper px-3 py-2.5 text-[10.5px] font-semibold tracking-[0.06em] text-muted uppercase">
                      Factor
                    </th>
                    {chosen.map(({ role }) => (
                      <th key={role.id} className="min-w-36 px-3 py-2.5 align-bottom">
                        <button
                          onClick={() => go(`/evaluate/${role.id}`)}
                          className="block max-w-40 text-left"
                        >
                          <span className="block truncate font-display text-[12.5px] font-semibold text-ink hover:text-gold-deep">
                            {role.title || 'Untitled'}
                          </span>
                          <span className="block truncate text-[10.5px] font-normal text-faint">
                            {role.organisation || 'Unassigned'}
                          </span>
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {CORNERSTONES.map((c) => (
                    <Fragment key={c.key}>
                      <tr className="bg-cream">
                        <td
                          colSpan={chosen.length + 1}
                          className="sticky left-0 px-3 py-1.5 text-[10.5px] font-semibold tracking-[0.06em] text-muted uppercase"
                        >
                          <span className="flex items-center gap-1.5">
                            <CornerstoneDot cornerstone={c.key} />
                            {c.name}
                          </span>
                        </td>
                      </tr>
                      {FACTORS.filter((f) => f.cornerstone === c.key).map((f) => {
                        const levels = chosen
                          .map(({ role }) => role.scores[f.id])
                          .filter((l): l is number => l != null)
                        const mid = median(levels)
                        return (
                          <tr key={f.id} className="border-b border-line-soft">
                            <td className="sticky left-0 z-10 bg-paper px-3 py-2 align-top">
                              <span className="text-ink-soft">{f.shortName}</span>
                            </td>
                            {chosen.map(({ role }) => {
                              const level = role.scores[f.id]
                              const lv = level == null ? null : f.levels.find((l) => l.level === level)!
                              const away = level != null && mid != null ? Math.abs(level - mid) : 0
                              return (
                                <td
                                  key={role.id}
                                  className={`px-3 py-2 align-top ${
                                    away >= 2 ? 'bg-amber-50' : away >= 1 ? 'bg-gold-wash/40' : ''
                                  }`}
                                >
                                  {lv ? (
                                    <>
                                      <span className="tnum font-semibold text-ink">L{lv.level}</span>
                                      <span className="tnum ml-1.5 text-faint">{lv.points}</span>
                                      <span className="mt-0.5 block text-[11px] leading-snug text-muted">
                                        {lv.label}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-faint">—</span>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </Fragment>
                  ))}
                </tbody>

                <tfoot>
                  {CORNERSTONES.map((c) => (
                    <tr key={c.key} className="border-t border-line-soft">
                      <td className="sticky left-0 z-10 bg-paper px-3 py-1.5 text-[11px] text-muted">
                        {c.name} subtotal
                      </td>
                      {chosen.map(({ role, score }) => (
                        <td key={role.id} className="tnum px-3 py-1.5 font-semibold text-ink-soft">
                          {fmtPoints(score.byCornerstone[c.key].points)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-t-2 border-ink">
                    <td className="sticky left-0 z-10 bg-paper px-3 py-2.5 text-[11px] font-semibold tracking-[0.06em] text-muted uppercase">
                      Total
                    </td>
                    {chosen.map(({ role, score }) => (
                      <td key={role.id} className="px-3 py-2.5">
                        <span className="tnum font-display text-[15px] font-bold text-ink">
                          {fmtPoints(score.total)}
                        </span>
                        <span className="block text-[11px] font-semibold text-gold-deep">
                          {score.complete
                            ? (bandFor(score.total, settings.bands)?.name ?? '')
                            : `${score.scoredCount}/${score.totalFactors} scored`}
                        </span>
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
