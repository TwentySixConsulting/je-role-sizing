import { useMemo, useState } from 'react'
import { CornerstoneDot } from '../components/charts'
import { distinctMeaning } from '../components/LevelPicker'
import { Icon, Input } from '../components/ui'
import { go } from '../lib/route'
import { CORNERSTONE_COLOUR, fmtPoints } from '../lib/scoring'
import { useStore } from '../lib/store'
import { CORNERSTONES, CORNERSTONE_MAX, FACTORS, MAX_POINTS, MIN_POINTS } from '../scheme/scheme'

export function SchemeReference() {
  const { settings } = useStore()
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const visible = useMemo(
    () =>
      FACTORS.filter(
        (f) =>
          !q ||
          f.name.toLowerCase().includes(q) ||
          f.levels.some(
            (l) =>
              l.label.toLowerCase().includes(q) ||
              l.description.toLowerCase().includes(q) ||
              l.meaning.toLowerCase().includes(q),
          ),
      ),
    [q],
  )

  return (
    <div className="mx-auto max-w-4xl px-5 py-6">
      <button
        onClick={() => go('/')}
        className="mb-4 flex items-center gap-1 text-[12px] font-medium text-muted hover:text-ink"
      >
        <Icon name="chevron" className="rotate-180" size={13} />
        Library
      </button>

      <h1 className="font-display text-[22px] font-semibold text-ink">The scheme</h1>
      <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted">
        Four cornerstones, eleven factors, {fmtPoints(MIN_POINTS)} to {fmtPoints(MAX_POINTS)} points.
        Every level below is taken word for word from the role sizing scheme, with the points cross-checked
        against the JE Scheme Database.
      </p>

      {/* Weighting */}
      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {CORNERSTONES.map((c) => (
          <div key={c.key} className="rounded-xl border border-line bg-paper p-3.5">
            <div className="flex items-center gap-1.5">
              <CornerstoneDot cornerstone={c.key} />
              <span className="text-[12px] font-semibold text-ink">{c.name}</span>
            </div>
            <div className="tnum mt-2 font-display text-[19px] leading-none font-bold text-ink">
              {Math.round((CORNERSTONE_MAX[c.key] / MAX_POINTS) * 100)}%
            </div>
            <div className="tnum mt-1 text-[11px] text-faint">
              up to {fmtPoints(CORNERSTONE_MAX[c.key])} pts
            </div>
          </div>
        ))}
      </div>

      {/* Bands */}
      <div className="mt-5 rounded-xl border border-line bg-paper p-4">
        <h2 className="mb-2.5 font-display text-[13px] font-semibold text-ink">Contribution bands</h2>
        <table className="w-full text-left text-[12.5px]">
          <thead>
            <tr className="border-b border-line text-[10.5px] font-semibold tracking-[0.06em] text-muted uppercase">
              <th className="py-1.5 font-semibold">Contribution</th>
              <th className="py-1.5 font-semibold">Points</th>
              <th className="py-1.5 font-semibold">Note</th>
            </tr>
          </thead>
          <tbody>
            {settings.bands.map((b) => (
              <tr key={b.name} className="border-b border-line-soft last:border-0">
                <td className="py-1.5 font-semibold text-ink">{b.name}</td>
                <td className="tnum py-1.5 text-muted">
                  {b.min === 0 ? `up to ${fmtPoints(b.max)}` : `${fmtPoints(b.min)} – ${fmtPoints(b.max)}`}
                </td>
                <td className="py-1.5 text-muted">{b.note ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Search */}
      <div className="relative mt-6 mb-4">
        <Icon
          name="search"
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the scheme — e.g. 'budget', 'coaching', 'ambiguous'"
          className="pl-9"
        />
      </div>

      {/* Factors */}
      <div className="space-y-6">
        {CORNERSTONES.map((c) => {
          const factors = visible.filter((f) => f.cornerstone === c.key)
          if (!factors.length) return null
          return (
            <section key={c.key}>
              <div className="mb-2 flex items-center gap-2">
                <CornerstoneDot cornerstone={c.key} />
                <h2 className="font-display text-[15px] font-semibold text-ink">
                  Cornerstone {c.number}: {c.name}
                </h2>
              </div>
              <p className="mb-3 max-w-prose text-[12.5px] leading-relaxed text-muted">{c.intro}</p>

              <div className="space-y-3">
                {factors.map((f) => (
                  <details
                    key={f.id}
                    open={!!q}
                    className="group rounded-xl border border-line bg-paper open:shadow-[0_1px_3px_rgba(19,26,46,0.05)]"
                  >
                    <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 select-none">
                      <Icon
                        name="chevron"
                        size={13}
                        className="text-faint transition-transform group-open:rotate-90"
                      />
                      <span className="font-display text-[13.5px] font-semibold text-ink">
                        <span className="text-faint">{f.number}. </span>
                        {f.name}
                      </span>
                      <span className="tnum ml-auto text-[11.5px] text-faint">
                        {f.levels.length} levels · up to{' '}
                        {fmtPoints(Math.max(...f.levels.map((l) => l.points)))} pts
                      </span>
                    </summary>

                    <div className="border-t border-line-soft px-4 py-3">
                      <div className="space-y-3">
                        {f.levels.map((lv) => {
                          const meaning = distinctMeaning(lv.description, lv.meaning)
                          return (
                            <div key={lv.level} className="grid gap-1.5 sm:grid-cols-[3rem_1fr] sm:gap-3">
                              <div>
                                <span
                                  className="tnum inline-flex h-6 w-6 items-center justify-center rounded-lg text-[11.5px] font-bold text-white"
                                  style={{ background: CORNERSTONE_COLOUR[c.key] }}
                                >
                                  {lv.level}
                                </span>
                                <span className="tnum mt-1 block text-[11px] text-faint">
                                  {fmtPoints(lv.points)} pts
                                </span>
                              </div>
                              <div>
                                <p className="text-[12.5px] font-semibold text-ink">{lv.label}</p>
                                <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">
                                  {lv.description}
                                </p>
                                {meaning && (
                                  <p className="mt-1.5 border-l-2 border-line pl-2.5 text-[12px] leading-relaxed text-faint">
                                    <span className="font-semibold text-muted">What this means: </span>
                                    {meaning}
                                  </p>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )
        })}
        {q && visible.length === 0 && (
          <p className="py-8 text-center text-[13px] text-muted">Nothing in the scheme matches "{query}".</p>
        )}
      </div>
    </div>
  )
}
