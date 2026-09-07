import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BandScale, CornerstoneComposition, FactorProfile, FactorTable } from '../components/charts'
import { JdViewer } from '../components/JdViewer'
import { LevelPicker } from '../components/LevelPicker'
import { Badge, Button, Field, Icon, TextArea } from '../components/ui'
import { go } from '../lib/route'
import { CORNERSTONE_COLOUR, deviations, fmtPoints, scoreRole } from '../lib/scoring'
import { useStore } from '../lib/store'
import { bandFor } from '../scheme/bands'
import { CORNERSTONES, FACTORS, MAX_POINTS } from '../scheme/scheme'

const SPLIT_KEY = 'je.split'

function useSplit() {
  const [pct, setPct] = useState(() => {
    const raw = Number(localStorage.getItem(SPLIT_KEY))
    return raw >= 25 && raw <= 70 ? raw : 46
  })
  const dragging = useRef(false)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const next = Math.min(70, Math.max(25, (e.clientX / window.innerWidth) * 100))
      setPct(next)
    }
    const onUp = () => {
      if (!dragging.current) return
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      setPct((p) => {
        localStorage.setItem(SPLIT_KEY, String(Math.round(p)))
        return p
      })
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  const start = () => {
    dragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }
  return { pct, start, setPct }
}

export function Evaluate({ id }: { id: string }) {
  const { roles, settings, updateRole, setScore, setRationale, loading } = useStore()
  const role = roles.find((r) => r.id === id)
  const { pct, start } = useSplit()

  const [tab, setTab] = useState<'score' | 'result'>('score')
  const [cursor, setCursor] = useState(0)
  const [showCriteria, setShowCriteria] = useState(true)
  const [rationaleDraft, setRationaleDraft] = useState('')
  const scoreScroll = useRef<HTMLDivElement>(null)

  const factor = FACTORS[cursor]

  // Open on the first unscored factor so picking a part-finished role up
  // lands where the work stopped.
  const jumped = useRef(false)
  useEffect(() => {
    if (jumped.current || !role) return
    jumped.current = true
    const firstGap = FACTORS.findIndex((f) => role.scores[f.id] == null)
    if (firstGap > 0) setCursor(firstGap)
  }, [role])

  useEffect(() => {
    setRationaleDraft(role?.rationale[factor.id] ?? '')
    scoreScroll.current?.scrollTo({ top: 0 })
  }, [factor.id, role?.id])

  const commitRationale = useCallback(() => {
    if (!role) return
    if ((role.rationale[factor.id] ?? '') !== rationaleDraft) {
      void setRationale(role.id, factor.id, rationaleDraft)
    }
  }, [role, factor.id, rationaleDraft, setRationale])

  // Save the note when moving away from a factor, so nothing is lost.
  const move = useCallback(
    (next: number) => {
      commitRationale()
      setCursor(Math.min(FACTORS.length - 1, Math.max(0, next)))
    },
    [commitRationale],
  )

  const pick = useCallback(
    (level: number | null) => {
      if (!role) return
      void setScore(role.id, factor.id, level)
      // Advance automatically once a level is chosen - the whole point is speed.
      if (level != null && cursor < FACTORS.length - 1) {
        window.setTimeout(() => move(cursor + 1), 220)
      }
    },
    [role, factor.id, setScore, cursor, move],
  )

  // Keyboard: number keys choose a level, arrows move between factors.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (tab !== 'score') return

      if (/^[1-8]$/.test(e.key)) {
        const lvl = Number(e.key)
        if (factor.levels.some((l) => l.level === lvl)) {
          e.preventDefault()
          pick(lvl)
        }
        return
      }
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        move(cursor + 1)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        move(cursor - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cursor, factor, move, pick, tab])

  const score = useMemo(() => scoreRole(role ?? { scores: {} }), [role])
  const peers = useMemo(
    () =>
      role
        ? roles.filter(
            (r) => r.organisation === role.organisation && r.id !== role.id && scoreRole(r).complete,
          )
        : [],
    [roles, role],
  )
  const devs = useMemo(() => (role ? deviations(role, peers) : []), [role, peers])
  const flagged = devs.filter((d) => d.flagged)

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

  const cornerstone = CORNERSTONES.find((c) => c.key === factor.cornerstone)!
  const accent = CORNERSTONE_COLOUR[factor.cornerstone]
  const band = score.complete ? bandFor(score.total, settings.bands) : undefined

  return (
    <div className="flex h-[calc(100vh-3.25rem)] flex-col">
      {/* Role bar */}
      <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-paper px-4 py-2.5">
        <button
          onClick={() => go('/')}
          className="flex items-center gap-1 text-[12px] font-medium text-muted hover:text-ink"
        >
          <Icon name="chevron" className="rotate-180" size={13} />
          Library
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-[14px] font-semibold text-ink">{role.title}</h1>
          <p className="truncate text-[11.5px] text-muted">
            {role.organisation || 'No organisation'}
            {role.functionArea && ` · ${role.functionArea}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="tnum font-display text-[17px] leading-none font-bold text-ink">
              {fmtPoints(score.total)}
              <span className="ml-1 text-[11px] font-medium text-faint">
                / {fmtPoints(MAX_POINTS)}
              </span>
            </div>
            <div className="mt-1 text-[11px] text-muted">
              {score.complete ? (
                <span className="font-semibold text-gold-deep">{band?.name ?? 'Out of range'}</span>
              ) : (
                `${score.scoredCount} of ${score.totalFactors} factors scored`
              )}
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => go(`/report/${role.id}`)}>
            Report
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Job description */}
        <section
          className="flex min-h-0 flex-col border-r border-line bg-paper"
          style={{ width: `${pct}%` }}
        >
          <JdViewer jd={role.jd} activeFactorId={tab === 'score' ? factor.id : null} className="min-h-0 flex-1" />
        </section>

        {/* Splitter */}
        <div
          onMouseDown={start}
          onDoubleClick={() => localStorage.removeItem(SPLIT_KEY)}
          role="separator"
          aria-orientation="vertical"
          title="Drag to resize"
          className="group relative w-1 shrink-0 cursor-col-resize bg-line-soft transition-colors hover:bg-gold"
        >
          <span className="absolute top-1/2 left-1/2 h-8 w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-line group-hover:bg-gold" />
        </div>

        {/* Scoring */}
        <section className="flex min-h-0 flex-1 flex-col bg-cream">
          {/* Tabs + progress */}
          <div className="shrink-0 border-b border-line bg-paper px-4 pt-2.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-1">
                {(
                  [
                    ['score', 'Score'],
                    ['result', 'Result'],
                  ] as const
                ).map(([k, labelText]) => (
                  <button
                    key={k}
                    onClick={() => {
                      commitRationale()
                      setTab(k)
                    }}
                    className={`rounded-t-lg px-3 py-1.5 text-[12.5px] font-semibold transition-colors ${
                      tab === k
                        ? 'border-b-2 border-gold text-ink'
                        : 'border-b-2 border-transparent text-muted hover:text-ink'
                    }`}
                  >
                    {labelText}
                    {k === 'result' && flagged.length > 0 && (
                      <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-100 px-1 text-[10px] font-bold text-warn">
                        {flagged.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {tab === 'score' && (
                <label className="flex cursor-pointer items-center gap-1.5 pb-1.5 text-[11.5px] text-muted select-none">
                  <input
                    type="checkbox"
                    checked={showCriteria}
                    onChange={(e) => setShowCriteria(e.target.checked)}
                    className="accent-gold"
                  />
                  Full criteria
                </label>
              )}
            </div>
          </div>

          {tab === 'score' ? (
            <>
              {/* Factor rail */}
              <nav
                aria-label="Factors"
                className="flex shrink-0 items-center gap-1 border-b border-line bg-paper px-4 py-2"
              >
                {CORNERSTONES.map((c, ci) => (
                  <div key={c.key} className="flex items-center gap-1">
                    {ci > 0 && <span className="mx-1 h-3 w-px bg-line" />}
                    {FACTORS.filter((f) => f.cornerstone === c.key).map((f) => {
                      const idx = FACTORS.indexOf(f)
                      const done = role.scores[f.id] != null
                      const active = idx === cursor
                      return (
                        <button
                          key={f.id}
                          onClick={() => move(idx)}
                          title={`${f.number}. ${f.name}${done ? ` — level ${role.scores[f.id]}` : ''}`}
                          className={`tnum h-6 w-6 rounded-lg text-[11px] font-bold transition-all ${
                            active
                              ? 'text-white ring-2 ring-offset-1'
                              : done
                                ? 'text-white opacity-55 hover:opacity-90'
                                : 'bg-line-soft text-faint hover:bg-line hover:text-muted'
                          }`}
                          style={
                            active || done
                              ? ({
                                  background: CORNERSTONE_COLOUR[c.key],
                                  ...(active ? { '--tw-ring-color': CORNERSTONE_COLOUR[c.key] } : {}),
                                } as React.CSSProperties)
                              : undefined
                          }
                        >
                          {f.number}
                        </button>
                      )
                    })}
                  </div>
                ))}
                <span className="ml-auto text-[11px] text-faint">
                  Keys <kbd className="font-sans font-semibold">1</kbd>–
                  <kbd className="font-sans font-semibold">8</kbd> pick,{' '}
                  <kbd className="font-sans font-semibold">←</kbd>
                  <kbd className="font-sans font-semibold">→</kbd> move
                </span>
              </nav>

              {/* Current factor */}
              <div ref={scoreScroll} className="scroll-slim min-h-0 flex-1 overflow-y-auto px-4 py-4">
                <div className="mx-auto max-w-2xl">
                  <div className="mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-sm"
                        style={{ background: accent }}
                        aria-hidden="true"
                      />
                      <span className="text-[11px] font-semibold tracking-[0.07em] text-muted uppercase">
                        Cornerstone {cornerstone.number}: {cornerstone.name}
                      </span>
                    </div>
                    <h2 className="mt-2 font-display text-[19px] leading-tight font-semibold text-ink">
                      <span className="text-faint">{factor.number}. </span>
                      {factor.name}
                    </h2>
                    <p className="mt-2 max-w-prose text-[12.5px] leading-relaxed text-muted">
                      {cornerstone.intro}
                    </p>
                  </div>

                  <LevelPicker
                    factor={factor}
                    value={role.scores[factor.id]}
                    onChange={pick}
                    accent={accent}
                    showCriteria={showCriteria}
                  />

                  <div className="mt-4">
                    <Field
                      label="Why this level"
                      hint="Optional, but it is what defends the score later"
                    >
                      <TextArea
                        rows={3}
                        value={rationaleDraft}
                        onChange={(e) => setRationaleDraft(e.target.value)}
                        onBlur={commitRationale}
                        placeholder={`e.g. "JD requires a degree-level qualification plus five years in practice" — quote the description where you can.`}
                      />
                    </Field>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 pb-8">
                    <Button variant="ghost" disabled={cursor === 0} onClick={() => move(cursor - 1)}>
                      <Icon name="chevron" className="rotate-180" size={13} />
                      Previous
                    </Button>
                    {cursor === FACTORS.length - 1 ? (
                      <Button
                        variant="primary"
                        onClick={() => {
                          commitRationale()
                          setTab('result')
                        }}
                      >
                        See the result
                        <Icon name="chevron" size={13} />
                      </Button>
                    ) : (
                      <Button variant="secondary" onClick={() => move(cursor + 1)}>
                        Next factor
                        <Icon name="chevron" size={13} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ------------------------------ Result ------------------------------ */
            <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-4 py-4">
              <div className="mx-auto max-w-2xl space-y-4">
                <div className="rounded-xl border border-line bg-paper p-4">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <div className="text-[11px] font-semibold tracking-[0.07em] text-muted uppercase">
                        Total points
                      </div>
                      <div className="tnum mt-1 font-display text-[34px] leading-none font-bold text-ink">
                        {fmtPoints(score.total)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-semibold tracking-[0.07em] text-muted uppercase">
                        Contribution
                      </div>
                      {score.complete ? (
                        <div className="mt-1 font-display text-[20px] leading-none font-semibold text-gold-deep">
                          {band?.name ?? 'Outside the band range'}
                        </div>
                      ) : (
                        <div className="mt-1.5 text-[12px] text-warn">
                          {score.totalFactors - score.scoredCount} factor
                          {score.totalFactors - score.scoredCount === 1 ? '' : 's'} still to score
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <BandScale total={score.total} bands={settings.bands} complete={score.complete} />
                  </div>
                </div>

                {!score.complete && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
                    <Icon name="warning" className="mt-px text-warn" />
                    <div className="text-[12.5px] leading-relaxed text-ink-soft">
                      <span className="font-semibold">Not a valid size yet.</span> Every factor has
                      to carry a level before the total means anything.{' '}
                      <button
                        className="font-semibold text-gold-deep underline"
                        onClick={() => {
                          const gap = FACTORS.findIndex((f) => role.scores[f.id] == null)
                          setTab('score')
                          setCursor(gap === -1 ? 0 : gap)
                        }}
                      >
                        Go to the first gap
                      </button>
                    </div>
                  </div>
                )}

                {flagged.length > 0 && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-3">
                    <div className="flex items-center gap-2">
                      <Icon name="info" className="text-warn" />
                      <h3 className="font-display text-[13px] font-semibold text-ink">
                        Worth a second look
                      </h3>
                    </div>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
                      Compared with {peers.length} other sized role
                      {peers.length === 1 ? '' : 's'} at {role.organisation || 'this organisation'},
                      these factors sit two or more levels from the median. That is not wrong, just
                      unusual, so it is worth being able to say why.
                    </p>
                    <ul className="mt-2.5 space-y-1">
                      {flagged.map((d) => {
                        const f = FACTORS.find((x) => x.id === d.factorId)!
                        return (
                          <li key={d.factorId} className="flex items-baseline gap-2 text-[12px]">
                            <button
                              onClick={() => {
                                setTab('score')
                                setCursor(FACTORS.indexOf(f))
                              }}
                              className="font-semibold text-ink underline decoration-line hover:decoration-gold"
                            >
                              {f.shortName}
                            </button>
                            <span className="tnum text-muted">
                              level {d.level} vs median {d.median}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}

                <div className="rounded-xl border border-line bg-paper p-4">
                  <h3 className="mb-3 font-display text-[13px] font-semibold text-ink">
                    Where the points come from
                  </h3>
                  <CornerstoneComposition score={score} />
                </div>

                <div className="rounded-xl border border-line bg-paper p-4">
                  <h3 className="mb-1 font-display text-[13px] font-semibold text-ink">
                    Factor profile
                  </h3>
                  <p className="mb-3 text-[12px] text-muted">
                    Click any factor to go back and change it.
                  </p>
                  <FactorProfile
                    score={score}
                    onPick={(fid) => {
                      setTab('score')
                      setCursor(FACTORS.findIndex((f) => f.id === fid))
                    }}
                  />
                </div>

                <div className="rounded-xl border border-line bg-paper p-4">
                  <h3 className="mb-2 font-display text-[13px] font-semibold text-ink">
                    Scores in full
                  </h3>
                  <FactorTable score={score} />
                </div>

                <div className="rounded-xl border border-line bg-paper p-4">
                  <Field label="Evaluation note" hint="Shown on the report">
                    {/* Uncontrolled: a controlled box backed by an async write
                        drops characters when you type quickly. */}
                    <TextArea
                      key={role.id}
                      rows={3}
                      defaultValue={role.notes}
                      onBlur={(e) => {
                        if (e.target.value !== role.notes) {
                          void updateRole(role.id, { notes: e.target.value })
                        }
                      }}
                      placeholder="Anything a colleague would need to know to defend this size."
                    />
                  </Field>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold tracking-[0.07em] text-muted uppercase">
                      Status
                    </span>
                    {(['draft', 'complete', 'moderated'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => void updateRole(role.id, { status: s })}
                        disabled={s !== 'draft' && !score.complete}
                        className={`rounded-lg border px-2.5 py-1 text-[11.5px] font-semibold capitalize transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          role.status === s
                            ? 'border-ink bg-ink text-white'
                            : 'border-line bg-paper text-muted hover:text-ink'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                    {!score.complete && (
                      <Badge tone="neutral">Score every factor to move past draft</Badge>
                    )}
                  </div>
                </div>

                <div className="pb-8">
                  <Button variant="primary" onClick={() => go(`/report/${role.id}`)}>
                    <Icon name="doc" size={13} />
                    Open the full report
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
