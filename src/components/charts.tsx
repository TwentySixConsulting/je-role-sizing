import { CORNERSTONES, FACTORS, FACTORS_BY_ID, type CornerstoneKey } from '../scheme/scheme'
import { bandFor, bandProximity, type Band } from '../scheme/bands'
import { CORNERSTONE_COLOUR, fmtPoints, type RoleScore } from '../lib/scoring'

/**
 * Cornerstone composition. The job is "what is this role made of", so it is one
 * stacked bar (share of the total) plus a directly-labelled readout per
 * cornerstone. Every segment carries a visible label, which is the required
 * relief for the aqua slot sitting under 3:1 against the cream surface.
 */
export function CornerstoneComposition({ score }: { score: RoleScore }) {
  const active = CORNERSTONES.filter((c) => score.byCornerstone[c.key].points > 0)
  return (
    <div>
      <div className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full bg-line-soft">
        {active.map((c) => {
          const cs = score.byCornerstone[c.key]
          return (
            <div
              key={c.key}
              title={`${c.name}: ${fmtPoints(cs.points)} points`}
              style={{
                width: `${cs.share * 100}%`,
                background: CORNERSTONE_COLOUR[c.key],
              }}
              className="first:rounded-l-full last:rounded-r-full"
            />
          )
        })}
      </div>

      <dl className="mt-3.5 grid grid-cols-2 gap-x-5 gap-y-2.5">
        {CORNERSTONES.map((c) => {
          const cs = score.byCornerstone[c.key]
          return (
            <div key={c.key} className="flex items-baseline gap-2">
              <span
                className="mt-[5px] h-2 w-2 shrink-0 rounded-sm"
                style={{ background: CORNERSTONE_COLOUR[c.key] }}
                aria-hidden="true"
              />
              <dt className="min-w-0 flex-1 truncate text-[12px] text-ink-soft">{c.name}</dt>
              <dd className="tnum text-[12px] font-semibold text-ink">
                {fmtPoints(cs.points)}
                <span className="ml-1 font-normal text-faint">
                  {Math.round(cs.share * 100)}%
                </span>
              </dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}

/**
 * Factor profile: points awarded against points available, grouped by
 * cornerstone. This is the shape consultants read to sanity-check a size -
 * a role that is all Delivery and no Know How looks wrong at a glance.
 */
export function FactorProfile({
  score,
  onPick,
  compact = false,
}: {
  score: RoleScore
  onPick?: (factorId: string) => void
  compact?: boolean
}) {
  return (
    <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
      {CORNERSTONES.map((c) => (
        <div key={c.key} className="print-break">
          <div className="mt-3 mb-1.5 flex items-center gap-2 first:mt-0">
            <span
              className="h-2 w-2 rounded-sm"
              style={{ background: CORNERSTONE_COLOUR[c.key] }}
              aria-hidden="true"
            />
            <span className="text-[11px] font-semibold tracking-[0.06em] text-muted uppercase">
              {c.name}
            </span>
          </div>
          {FACTORS.filter((f) => f.cornerstone === c.key).map((f) => {
            const fs = score.byFactor.find((x) => x.factorId === f.id)!
            const lv = fs.level == null ? null : f.levels.find((l) => l.level === fs.level)!
            const pct = (fs.points / fs.maxPoints) * 100
            const Row = onPick ? 'button' : 'div'
            return (
              <Row
                key={f.id}
                {...(onPick
                  ? { onClick: () => onPick(f.id), type: 'button' as const }
                  : {})}
                className={`group relative grid w-full grid-cols-[1fr_auto] items-center gap-x-3 rounded-md px-1.5 py-1 text-left ${
                  onPick ? 'hover:bg-line-soft focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none' : ''
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="truncate text-[12px] text-ink-soft">{f.shortName}</span>
                    {lv && (
                      <span className="tnum shrink-0 text-[11px] font-semibold text-faint">
                        L{lv.level}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 h-[5px] w-full overflow-hidden rounded-full bg-line-soft">
                    <div
                      className="h-full rounded-r-[4px] transition-[width] duration-300"
                      style={{
                        width: `${pct}%`,
                        background: fs.level == null ? 'transparent' : CORNERSTONE_COLOUR[c.key],
                      }}
                    />
                  </div>
                </div>
                <span className="tnum w-14 text-right text-[12px] font-semibold text-ink">
                  {fs.level == null ? (
                    <span className="font-normal text-faint">—</span>
                  ) : (
                    <>
                      {fmtPoints(fs.points)}
                      <span className="ml-0.5 text-[10px] font-normal text-faint">
                        /{fs.maxPoints}
                      </span>
                    </>
                  )}
                </span>

                {lv && (
                  <span className="pointer-events-none absolute bottom-full left-0 z-20 mb-1 hidden w-64 rounded-lg border border-line bg-ink px-2.5 py-2 text-[11px] leading-snug text-white shadow-lg group-hover:block">
                    <span className="font-semibold">
                      Level {lv.level} · {lv.label}
                    </span>
                    <span className="mt-1 block text-white/75">{lv.meaning}</span>
                  </span>
                )}
              </Row>
            )
          })}
        </div>
      ))}
    </div>
  )
}

/**
 * Where the total sits on the contribution scale, and how much headroom is
 * left before the next band. Band widths are drawn to scale so a score near a
 * boundary reads as near a boundary.
 */
export function BandScale({
  total,
  bands,
  complete,
}: {
  total: number
  bands: Band[]
  complete: boolean
}) {
  const top = bands[bands.length - 1]?.max ?? 1650
  const prox = bandProximity(total, bands)
  const current = bandFor(total, bands)

  return (
    <div className="@container">
      <div className="relative">
        <div className="flex h-7 w-full gap-[2px] overflow-hidden rounded-lg">
          {bands.map((b) => {
            const isCurrent = complete && current?.name === b.name
            const width = ((b.max - b.min + 1) / (top + 1)) * 100
            return (
              <div
                key={b.name}
                title={`${b.name}: ${fmtPoints(b.min)}–${fmtPoints(b.max)}`}
                style={{ width: `${width}%` }}
                className={`flex items-center justify-center overflow-hidden rounded-sm px-1 text-[10px] font-semibold whitespace-nowrap first:rounded-l-lg last:rounded-r-lg ${
                  isCurrent ? 'bg-ink text-white' : 'bg-line-soft text-faint'
                }`}
              >
                {/* Names only where the container is wide enough to hold them;
                    narrower layouts rely on the title tooltip and the caption. */}
                <span className={width > 13 ? 'hidden @[24rem]:inline' : 'hidden @[46rem]:inline'}>
                  {b.name}
                </span>
              </div>
            )
          })}
        </div>
        {complete && (
          <div
            className="absolute -top-1 -bottom-1 w-[2px] rounded-full bg-gold shadow-[0_0_0_2px_rgba(250,249,246,0.9)]"
            style={{ left: `calc(${Math.min(100, (total / (top + 1)) * 100)}% - 1px)` }}
            aria-hidden="true"
          />
        )}
      </div>

      <div className="tnum mt-1 flex justify-between text-[10px] text-faint">
        <span>0</span>
        <span>{fmtPoints(top)}</span>
      </div>

      {complete && prox && (
        <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
          <span className="font-semibold text-ink">{fmtPoints(prox.intoBand)}</span> points into{' '}
          <span className="font-semibold text-ink">{prox.band.name}</span>
          {prox.toNext != null && prox.next ? (
            <>
              {' · '}
              <span className="font-semibold text-ink">{fmtPoints(prox.toNext)}</span> more would
              reach {prox.next.name}
            </>
          ) : (
            ' · top band'
          )}
        </p>
      )}
    </div>
  )
}

/** Small inline dot + label for a cornerstone, used in headings and tables. */
export function CornerstoneDot({ cornerstone }: { cornerstone: CornerstoneKey }) {
  return (
    <span
      className="inline-block h-2 w-2 shrink-0 rounded-sm align-middle"
      style={{ background: CORNERSTONE_COLOUR[cornerstone] }}
      aria-hidden="true"
    />
  )
}

/** Factor breakdown as a table - the non-colour route to the same numbers. */
export function FactorTable({ score }: { score: RoleScore }) {
  return (
    <table className="w-full text-left text-[12px]">
      <thead>
        <tr className="border-b border-line text-[10px] font-semibold tracking-[0.06em] text-muted uppercase">
          <th className="py-1.5 pr-2 font-semibold">Factor</th>
          <th className="py-1.5 pr-2 font-semibold">Level</th>
          <th className="py-1.5 pr-2 font-semibold">Summary</th>
          <th className="py-1.5 text-right font-semibold">Points</th>
        </tr>
      </thead>
      <tbody>
        {score.byFactor.map((fs) => {
          const f = FACTORS_BY_ID[fs.factorId]
          const lv = fs.level == null ? null : f.levels.find((l) => l.level === fs.level)!
          return (
            <tr key={fs.factorId} className="border-b border-line-soft last:border-0">
              <td className="py-1.5 pr-2">
                <span className="flex items-center gap-1.5">
                  <CornerstoneDot cornerstone={f.cornerstone} />
                  <span className="text-ink-soft">{f.shortName}</span>
                </span>
              </td>
              <td className="tnum py-1.5 pr-2 font-semibold text-ink">{fs.level ?? '—'}</td>
              <td className="py-1.5 pr-2 text-muted">{lv?.label ?? 'Not scored'}</td>
              <td className="tnum py-1.5 text-right font-semibold text-ink">
                {fs.level == null ? '—' : fmtPoints(fs.points)}
              </td>
            </tr>
          )
        })}
      </tbody>
      <tfoot>
        <tr className="border-t-2 border-ink">
          <td className="py-2 text-[11px] font-semibold tracking-[0.06em] text-muted uppercase" colSpan={3}>
            Total
          </td>
          <td className="tnum py-2 text-right text-[13px] font-bold text-ink">
            {fmtPoints(score.total)}
          </td>
        </tr>
      </tfoot>
    </table>
  )
}
