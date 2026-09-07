import { useMemo, useState } from 'react'
import { BandScale, CornerstoneComposition, CornerstoneDot, FactorProfile } from '../components/charts'
import { Badge, Button, Field, Icon, Input, Modal, Select, TextArea } from '../components/ui'
import { go } from '../lib/route'
import { fmtPoints, scoreRole } from '../lib/scoring'
import { useStore } from '../lib/store'
import { bandFor } from '../scheme/bands'
import { CORNERSTONES, FACTORS, MAX_POINTS } from '../scheme/scheme'

export function Report({ id }: { id: string }) {
  const { roles, settings, updateRole, setScore, setRationale, getFile, loading } = useStore()
  const role = roles.find((r) => r.id === id)
  const [editing, setEditing] = useState(false)
  const score = useMemo(() => scoreRole(role ?? { scores: {} }), [role])

  if (loading) return <div className="p-10 text-[13px] text-muted">Loading…</div>
  if (!role) {
    return (
      <div className="p-10">
        <p className="text-[13px] text-muted">That role no longer exists.</p>
        <Button className="mt-4" onClick={() => go('/')}>
          Back to the library
        </Button>
      </div>
    )
  }

  const band = score.complete ? bandFor(score.total, settings.bands) : undefined

  const openOriginal = async () => {
    const stored = await getFile(role.id)
    if (!stored) return
    const url = URL.createObjectURL(stored.blob)
    window.open(url, '_blank', 'noopener')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-6 print:max-w-none print:px-0 print:py-0">
      <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => go('/')}
          className="flex items-center gap-1 text-[12px] font-medium text-muted hover:text-ink"
        >
          <Icon name="chevron" className="rotate-180" size={13} />
          Library
        </button>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setEditing(true)}>
            Edit details
          </Button>
          {role.jd.source === 'file' && (
            <Button size="sm" onClick={() => void openOriginal()}>
              <Icon name="doc" size={13} />
              Original file
            </Button>
          )}
          <Button size="sm" onClick={() => go(`/evaluate/${role.id}`)}>
            Back to scoring
          </Button>
          <Button size="sm" variant="primary" onClick={() => window.print()}>
            <Icon name="print" size={13} />
            Print or save as PDF
          </Button>
        </div>
      </div>

      {/* Header */}
      <header className="border-b-2 border-ink pb-4">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.1em] text-gold-deep uppercase">
              Role sizing outcome
            </p>
            <h1 className="mt-1.5 font-display text-[26px] leading-tight font-semibold text-ink">
              {role.title || 'Untitled role'}
            </h1>
            <p className="mt-1 text-[13.5px] text-muted">
              {[role.organisation, role.functionArea, role.reportsTo && `reports to ${role.reportsTo}`]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="tnum font-display text-[38px] leading-none font-bold text-ink">
              {fmtPoints(score.total)}
            </div>
            <div className="mt-1 text-[11px] text-faint">of {fmtPoints(MAX_POINTS)} available</div>
            {score.complete ? (
              <div className="mt-2 font-display text-[16px] font-semibold text-gold-deep">
                {band?.name ?? 'Outside the band range'}
              </div>
            ) : (
              <Badge tone="warn" className="mt-2">
                Incomplete — {score.totalFactors - score.scoredCount} to score
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Facts */}
      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[12.5px] sm:grid-cols-4">
        {[
          ['Client grade', role.clientGrade],
          ['FTE salary', role.salary],
          ['Evaluated by', role.evaluator],
          [
            'Date',
            new Date(role.completedAt ?? role.updatedAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }),
          ],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-[10.5px] font-semibold tracking-[0.06em] text-faint uppercase">{k}</dt>
            <dd className="mt-0.5 text-ink-soft">{v || '—'}</dd>
          </div>
        ))}
      </dl>

      {/* Band + composition */}
      <section className="mt-6 space-y-5">
        <div className="print-break rounded-xl border border-line bg-paper p-4">
          <h2 className="mb-3 font-display text-[13px] font-semibold text-ink">
            Position on the contribution scale
          </h2>
          <BandScale total={score.total} bands={settings.bands} complete={score.complete} />
        </div>
        <div className="print-break rounded-xl border border-line bg-paper p-4">
          <h2 className="mb-3 font-display text-[13px] font-semibold text-ink">
            Where the points come from
          </h2>
          <CornerstoneComposition score={score} />
        </div>
      </section>

      <section className="mt-5 print-break rounded-xl border border-line bg-paper p-4">
        <h2 className="mb-3 font-display text-[13px] font-semibold text-ink">Factor profile</h2>
        <FactorProfile score={score} />
      </section>

      {/* Factor detail */}
      <section className="mt-6">
        <h2 className="mb-3 font-display text-[16px] font-semibold text-ink">
          Level awarded on each factor
        </h2>
        <div className="space-y-4">
          {CORNERSTONES.map((c) => (
            <div key={c.key} className="print-break">
              <div className="mb-2 flex items-center gap-2 border-b border-line pb-1.5">
                <CornerstoneDot cornerstone={c.key} />
                <h3 className="font-display text-[13px] font-semibold text-ink">
                  Cornerstone {c.number}: {c.name}
                </h3>
                <span className="tnum ml-auto text-[12px] font-semibold text-muted">
                  {fmtPoints(score.byCornerstone[c.key].points)} pts
                </span>
              </div>

              <div className="space-y-3">
                {FACTORS.filter((f) => f.cornerstone === c.key).map((f) => {
                  const level = role.scores[f.id]
                  const lv = level == null ? null : f.levels.find((l) => l.level === level)!
                  return (
                    <div key={f.id} className="grid gap-2 sm:grid-cols-[auto_1fr] sm:gap-4">
                      <div className="flex items-start gap-2 sm:w-52">
                        <span className="tnum text-[12px] font-semibold text-faint">{f.number}.</span>
                        <div>
                          <div className="text-[12.5px] font-semibold text-ink">{f.shortName}</div>
                          <div className="no-print mt-1">
                            <Select
                              value={level ?? ''}
                              onChange={(e) =>
                                void setScore(
                                  role.id,
                                  f.id,
                                  e.target.value === '' ? null : Number(e.target.value),
                                )
                              }
                              className="py-1 text-[12px]"
                              aria-label={`Level for ${f.name}`}
                            >
                              <option value="">Not scored</option>
                              {f.levels.map((l) => (
                                <option key={l.level} value={l.level}>
                                  Level {l.level} — {l.points} pts
                                </option>
                              ))}
                            </Select>
                          </div>
                          <div className="tnum hidden text-[11px] text-muted print:block">
                            {lv ? `Level ${lv.level} · ${lv.points} pts` : 'Not scored'}
                          </div>
                        </div>
                      </div>

                      <div className="min-w-0">
                        {lv ? (
                          <>
                            <p className="text-[12.5px] font-semibold text-ink">{lv.label}</p>
                            <p className="mt-0.5 text-[12px] leading-relaxed text-muted">
                              {lv.description}
                            </p>
                            <RationaleField
                              value={role.rationale[f.id] ?? ''}
                              onSave={(text) => void setRationale(role.id, f.id, text)}
                            />
                          </>
                        ) : (
                          <p className="text-[12px] text-warn">No level chosen yet.</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {role.notes && (
        <section className="mt-6 print-break rounded-xl border border-line bg-paper p-4">
          <h2 className="mb-2 font-display text-[13px] font-semibold text-ink">Evaluation note</h2>
          <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap text-ink-soft">{role.notes}</p>
        </section>
      )}

      <footer className="mt-8 border-t border-line pt-3 text-[11px] text-faint">
        Sized against the role sizing scheme (v2), 4 cornerstones and 11 factors, maximum{' '}
        {fmtPoints(MAX_POINTS)} points. Contribution bands as published in the JE Scheme Database.
        {role.jd.fileName && ` Source description: ${role.jd.fileName}.`}
      </footer>

      <Modal open={editing} onClose={() => setEditing(false)} title="Role details">
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ['title', 'Job title'],
              ['organisation', 'Organisation'],
              ['functionArea', 'Function'],
              ['reportsTo', 'Reports to'],
              ['clientGrade', 'Client grade'],
              ['salary', 'FTE salary'],
              ['evaluator', 'Evaluated by'],
            ] as const
          ).map(([key, labelText]) => (
            <Field key={key} label={labelText}>
              <Input
                defaultValue={role[key]}
                onBlur={(e) => void updateRole(role.id, { [key]: e.target.value })}
              />
            </Field>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="primary" onClick={() => setEditing(false)}>
            Done
          </Button>
        </div>
      </Modal>
    </div>
  )
}

/**
 * The reason behind a level. Kept out of the way until there is something to
 * read or the consultant asks for the box, so the report prints as a report
 * rather than as an empty form.
 */
function RationaleField({ value, onSave }: { value: string; onSave: (text: string) => void }) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return (
      <div className="no-print mt-1.5">
        <TextArea
          rows={2}
          autoFocus
          defaultValue={value}
          onBlur={(e) => {
            onSave(e.target.value)
            setEditing(false)
          }}
          placeholder="Why this level, ideally quoting the description"
          className="text-[12px]"
        />
      </div>
    )
  }

  if (!value) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="no-print mt-1 text-[11.5px] font-medium text-muted underline decoration-line hover:text-gold-deep hover:decoration-gold"
      >
        Add a reason
      </button>
    )
  }

  return (
    <p className="mt-1.5 border-l-2 border-gold pl-2.5 text-[12px] leading-relaxed text-ink-soft">
      {value}
      <button
        onClick={() => setEditing(true)}
        className="no-print ml-2 align-baseline text-[11px] font-medium text-muted underline decoration-line hover:text-gold-deep"
      >
        edit
      </button>
    </p>
  )
}
