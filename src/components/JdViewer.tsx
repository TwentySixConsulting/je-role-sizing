import { useEffect, useMemo, useRef, useState } from 'react'
import { FACTOR_CUES } from '../lib/cues'
import type { JobDescription } from '../lib/types'
import { Icon } from './ui'

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Longest terms first, so "line management" wins over "manage". */
function termRegex(terms: string[]): RegExp | null {
  const cleaned = terms.map((t) => t.trim()).filter((t) => t.length > 1)
  if (!cleaned.length) return null
  const sorted = [...new Set(cleaned)].sort((a, b) => b.length - a.length)
  return new RegExp(`\\b(${sorted.map(escapeRe).join('|')})`, 'gi')
}

type Piece = { text: string; kind: 'plain' | 'hit' | 'cue'; hitIndex?: number }

/** Splits a line into search hits, then cue matches inside what is left. */
function splitLine(line: string, search: RegExp | null, cues: RegExp | null, counter: { n: number }): Piece[] {
  const bySearch: Piece[] = []
  if (search) {
    let last = 0
    for (const m of line.matchAll(search)) {
      const i = m.index ?? 0
      if (i > last) bySearch.push({ text: line.slice(last, i), kind: 'plain' })
      bySearch.push({ text: m[0], kind: 'hit', hitIndex: counter.n++ })
      last = i + m[0].length
    }
    if (last < line.length) bySearch.push({ text: line.slice(last), kind: 'plain' })
  } else {
    bySearch.push({ text: line, kind: 'plain' })
  }

  if (!cues) return bySearch
  const out: Piece[] = []
  for (const piece of bySearch) {
    if (piece.kind !== 'plain') {
      out.push(piece)
      continue
    }
    let last = 0
    for (const m of piece.text.matchAll(cues)) {
      const i = m.index ?? 0
      if (i > last) out.push({ text: piece.text.slice(last, i), kind: 'plain' })
      out.push({ text: m[0], kind: 'cue' })
      last = i + m[0].length
    }
    if (last < piece.text.length) out.push({ text: piece.text.slice(last), kind: 'plain' })
  }
  return out
}

function looksLikeHeading(line: string): boolean {
  const t = line.trim()
  if (t.length < 3 || t.length > 70) return false
  if (/[.;]$/.test(t)) return false
  const letters = t.replace(/[^A-Za-z]/g, '')
  if (letters.length > 2 && letters === letters.toUpperCase()) return true
  return /:$/.test(t)
}

export function JdViewer({
  jd,
  activeFactorId,
  className = '',
}: {
  jd: JobDescription
  /** When set, that factor's cue words are tinted in the text. */
  activeFactorId?: string | null
  className?: string
}) {
  const [search, setSearch] = useState('')
  const [showCues, setShowCues] = useState(true)
  const [view, setView] = useState<'text' | 'formatted'>('text')
  const [activeHit, setActiveHit] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const searchRe = useMemo(() => (search.trim().length > 1 ? termRegex([search.trim()]) : null), [search])
  const cueRe = useMemo(() => {
    if (!showCues || !activeFactorId) return null
    return termRegex(FACTOR_CUES[activeFactorId] ?? [])
  }, [showCues, activeFactorId])

  const { blocks, hitCount } = useMemo(() => {
    const counter = { n: 0 }
    // Word exports put a blank line between every paragraph; collapse runs of
    // them so the description reads tightly rather than as a sparse column.
    const lines = jd.text.replace(/\n{2,}/g, '\n\n').split('\n')
    const out = lines.map((line) => ({
      heading: looksLikeHeading(line),
      blank: !line.trim(),
      pieces: line.trim() ? splitLine(line, searchRe, cueRe, counter) : [],
    }))
    return { blocks: out, hitCount: counter.n }
  }, [jd.text, searchRe, cueRe])

  // Keep the active hit in range as the query changes, and scroll to it.
  useEffect(() => {
    setActiveHit(0)
  }, [search])

  useEffect(() => {
    if (!hitCount) return
    const el = scrollRef.current?.querySelector(`[data-hit="${activeHit}"]`)
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [activeHit, hitCount])

  const step = (dir: 1 | -1) => {
    if (!hitCount) return
    setActiveHit((h) => (h + dir + hitCount) % hitCount)
  }

  const cueCount = activeFactorId ? (FACTOR_CUES[activeFactorId]?.length ?? 0) : 0

  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
      {/* Toolbar */}
      <div className="no-print flex flex-wrap items-center gap-2 border-b border-line px-4 py-2.5">
        <div className="relative min-w-[9rem] flex-1">
          <Icon
            name="search"
            className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-faint"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                step(e.shiftKey ? -1 : 1)
              }
            }}
            placeholder="Search this description"
            className="w-full rounded-lg border border-line bg-cream py-1.5 pr-2 pl-8 text-[12px] placeholder:text-faint focus:border-gold focus:bg-paper focus:ring-2 focus:ring-gold/25 focus:outline-none"
          />
        </div>

        {search.trim().length > 1 && (
          <div className="flex items-center gap-1 text-[11px] text-muted">
            <span className="tnum">
              {hitCount ? `${activeHit + 1} of ${hitCount}` : 'no matches'}
            </span>
            <button
              onClick={() => step(-1)}
              disabled={!hitCount}
              aria-label="Previous match"
              className="rounded p-1 hover:bg-line-soft disabled:opacity-40"
            >
              <Icon name="up" size={13} />
            </button>
            <button
              onClick={() => step(1)}
              disabled={!hitCount}
              aria-label="Next match"
              className="rounded p-1 hover:bg-line-soft disabled:opacity-40"
            >
              <Icon name="down" size={13} />
            </button>
          </div>
        )}

        {activeFactorId && cueCount > 0 && view === 'text' && (
          <button
            onClick={() => setShowCues((v) => !v)}
            title="Tint words in the description that often relate to this factor. A reading aid only - it never affects the score."
            className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors ${
              showCues
                ? 'border-gold/40 bg-gold-wash text-gold-deep'
                : 'border-line bg-paper text-muted hover:bg-line-soft'
            }`}
          >
            Cue words
          </button>
        )}

        {jd.html && (
          <div className="flex rounded-lg border border-line p-0.5">
            {(['text', 'formatted'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-md px-2 py-1 text-[11px] font-medium capitalize ${
                  view === v ? 'bg-ink text-white' : 'text-muted hover:text-ink'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div ref={scrollRef} className="scroll-slim min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {!jd.text && !jd.html ? (
          <p className="py-10 text-center text-[13px] text-muted">
            No job description stored for this role. Add one from the role's details.
          </p>
        ) : view === 'formatted' && jd.html ? (
          <div
            className="jd-html max-w-[68ch] text-[13px] leading-[1.75] text-ink-soft [&_h1]:mt-4 [&_h1]:mb-1.5 [&_h1]:font-display [&_h1]:text-[15px] [&_h1]:font-semibold [&_h1]:text-ink [&_h2]:mt-4 [&_h2]:mb-1.5 [&_h2]:font-display [&_h2]:text-[14px] [&_h2]:font-semibold [&_h2]:text-ink [&_h3]:mt-3 [&_h3]:mb-1 [&_h3]:font-semibold [&_h3]:text-ink [&_li]:mb-1 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_strong]:font-semibold [&_strong]:text-ink [&_table]:mb-3 [&_table]:w-full [&_td]:border [&_td]:border-line [&_td]:px-2 [&_td]:py-1 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
            // The HTML comes from mammoth's conversion of a .docx the
            // consultant chose to upload; mammoth emits a fixed, restricted
            // element set (headings, lists, tables, emphasis) and no scripts.
            dangerouslySetInnerHTML={{ __html: jd.html }}
          />
        ) : (
          <div className="max-w-[68ch] text-[13px] leading-[1.75] text-ink-soft">
            {blocks.map((b, i) =>
              b.blank ? (
                <div key={i} className="h-2" />
              ) : (
                <p
                  key={i}
                  className={
                    b.heading
                      ? 'mt-4 mb-1 font-display text-[13px] font-semibold text-ink first:mt-0'
                      : 'mb-1.5'
                  }
                >
                  {b.pieces.map((p, j) =>
                    p.kind === 'hit' ? (
                      <mark
                        key={j}
                        data-hit={p.hitIndex}
                        className={`jd-hit ${p.hitIndex === activeHit ? 'jd-hit-active' : ''}`}
                      >
                        {p.text}
                      </mark>
                    ) : p.kind === 'cue' ? (
                      <span
                        key={j}
                        className="rounded-[2px] bg-gold/18 px-[1px] text-ink underline decoration-gold/60 decoration-1 underline-offset-2"
                      >
                        {p.text}
                      </span>
                    ) : (
                      <span key={j}>{p.text}</span>
                    ),
                  )}
                </p>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  )
}
