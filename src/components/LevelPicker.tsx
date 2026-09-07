import type { SchemeFactor } from '../scheme/scheme'
import { fmtPoints } from '../lib/scoring'
import { Icon } from './ui'

/**
 * The "what does this mean?" text often restates the scheme criteria almost
 * word for word. Only show it when it genuinely adds something.
 */
export function distinctMeaning(description: string, meaning: string): string | null {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()
  const d = norm(description)
  const m = norm(meaning)
  if (!m || d === m) return null
  if (d.includes(m) || m.includes(d)) return null
  // Near-identical openings mean the same sentence with light rewording.
  if (d.slice(0, 60) === m.slice(0, 60)) return null
  return meaning
}

export function LevelPicker({
  factor,
  value,
  onChange,
  accent,
  showCriteria = true,
}: {
  factor: SchemeFactor
  value: number | undefined
  onChange: (level: number | null) => void
  accent: string
  showCriteria?: boolean
}) {
  return (
    <div className="space-y-2">
      {factor.levels.map((lv) => {
        const selected = value === lv.level
        const meaning = distinctMeaning(lv.description, lv.meaning)
        return (
          <button
            key={lv.level}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(selected ? null : lv.level)}
            className={`group block w-full rounded-xl border px-3.5 py-3 text-left transition-all focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none ${
              selected
                ? 'border-transparent bg-paper shadow-[0_1px_3px_rgba(19,26,46,0.08)] ring-2'
                : 'border-line bg-paper/70 hover:border-line hover:bg-paper hover:shadow-[0_1px_2px_rgba(19,26,46,0.05)]'
            }`}
            style={selected ? ({ '--tw-ring-color': accent } as React.CSSProperties) : undefined}
          >
            <div className="flex items-start gap-3">
              {/* Level chip */}
              <span
                className={`mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold ${
                  selected ? 'text-white' : 'bg-line-soft text-muted group-hover:bg-line'
                }`}
                style={selected ? { background: accent } : undefined}
              >
                {selected ? <Icon name="check" size={13} className="stroke-[2.4]" /> : lv.level}
              </span>

              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <span
                    className={`font-display text-[13px] leading-snug font-semibold ${
                      selected ? 'text-ink' : 'text-ink-soft'
                    }`}
                  >
                    <span className="text-faint">Level {lv.level} · </span>
                    {lv.label}
                  </span>
                  <span
                    className={`tnum shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
                      selected ? 'bg-gold-wash text-gold-deep' : 'text-faint'
                    }`}
                  >
                    {fmtPoints(lv.points)} pts
                  </span>
                </span>

                {showCriteria && (
                  <span className="mt-1.5 block text-[12.5px] leading-[1.6] text-muted">
                    {lv.description}
                  </span>
                )}

                {showCriteria && meaning && (
                  <span className="mt-2 block border-l-2 border-line pl-2.5 text-[12px] leading-[1.55] text-faint">
                    <span className="font-semibold text-muted">What this means: </span>
                    {meaning}
                  </span>
                )}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
