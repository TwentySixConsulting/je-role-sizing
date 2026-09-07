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

function looksLikeHeading(line: string): boolean {
  const t = line.trim()
  if (t.length < 3 || t.length > 70) return false
  if (/[.;]$/.test(t)) return false
  const letters = t.replace(/[^A-Za-z]/g, '')
  if (letters.length > 2 && letters === letters.toUpperCase()) return true
  return /:$/.test(t)
}

/** Plain text rendered as paragraphs, for PDFs and pasted descriptions. */
function textToHtml(text: string): string {
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return text
    .replace(/\n{2,}/g, '\n\n')
    .split('\n')
    .map((line) => {
      if (!line.trim()) return ''
      return looksLikeHeading(line)
        ? `<h3>${escape(line.trim())}</h3>`
        : `<p>${escape(line)}</p>`
    })
    .filter(Boolean)
    .join('')
}

/**
 * Mammoth emits a restricted element set with no scripts, but the HTML has
 * been through a file we did not write, so strip anything executable before it
 * reaches the DOM.
 */
function sanitise(html: string): string {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html')
  const root = doc.body.firstElementChild
  if (!root) return ''
  root.querySelectorAll('script, style, iframe, object, embed, link, meta').forEach((n) => n.remove())
  root.querySelectorAll('*').forEach((el) => {
    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase()
      const value = attr.value.trim().toLowerCase()
      const dangerousHref =
        (name === 'href' || name === 'src') &&
        !/^(https?:|mailto:|data:image\/|#|\/|$)/.test(value)
      if (name.startsWith('on') || dangerousHref) el.removeAttribute(attr.name)
    }
  })
  return root.innerHTML
}

/** Wraps matches inside already-rendered HTML, so formatting survives. */
function highlight(root: HTMLElement, search: RegExp | null, cues: RegExp | null): number {
  if (!search && !cues) return 0

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.parentElement?.closest('mark') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
  })
  const textNodes: Text[] = []
  while (walker.nextNode()) {
    const n = walker.currentNode as Text
    if (n.nodeValue && n.nodeValue.trim()) textNodes.push(n)
  }

  let hits = 0
  for (const node of textNodes) {
    const value = node.nodeValue ?? ''
    // Search hits win over cue words wherever they overlap.
    const spans: { start: number; end: number; kind: 'hit' | 'cue' }[] = []
    if (search) {
      search.lastIndex = 0
      for (const m of value.matchAll(search)) {
        spans.push({ start: m.index ?? 0, end: (m.index ?? 0) + m[0].length, kind: 'hit' })
      }
    }
    if (cues) {
      cues.lastIndex = 0
      for (const m of value.matchAll(cues)) {
        const start = m.index ?? 0
        const end = start + m[0].length
        if (!spans.some((s) => start < s.end && end > s.start)) {
          spans.push({ start, end, kind: 'cue' })
        }
      }
    }
    if (!spans.length) continue
    spans.sort((a, b) => a.start - b.start)

    const frag = document.createDocumentFragment()
    let cursor = 0
    for (const span of spans) {
      if (span.start > cursor) frag.append(value.slice(cursor, span.start))
      const mark = document.createElement('mark')
      mark.textContent = value.slice(span.start, span.end)
      if (span.kind === 'hit') {
        mark.className = 'jd-hit'
        mark.dataset.hit = String(hits++)
      } else {
        mark.className = 'jd-cue'
      }
      frag.append(mark)
      cursor = span.end
    }
    if (cursor < value.length) frag.append(value.slice(cursor))
    node.parentNode?.replaceChild(frag, node)
  }
  return hits
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
  const [plain, setPlain] = useState(false)
  const [activeHit, setActiveHit] = useState(0)
  const [hitCount, setHitCount] = useState(0)
  const bodyRef = useRef<HTMLDivElement>(null)

  const searchRe = useMemo(
    () => (search.trim().length > 1 ? termRegex([search.trim()]) : null),
    [search],
  )
  const cueRe = useMemo(() => {
    if (!showCues || !activeFactorId) return null
    return termRegex(FACTOR_CUES[activeFactorId] ?? [])
  }, [showCues, activeFactorId])

  // Word job descriptions are very often laid out as tables. Rendering the
  // converted HTML keeps those tables, headings and lists intact; the plain
  // text version of the same document reads as one long run-on.
  const richHtml = useMemo(() => (jd.html ? sanitise(jd.html) : null), [jd.html])
  const html = useMemo(
    () => (richHtml && !plain ? richHtml : textToHtml(jd.text)),
    [richHtml, plain, jd.text],
  )

  // Render, then mark up. Re-rendering from the source HTML each time is what
  // keeps repeated searches from nesting marks inside one another.
  useEffect(() => {
    const root = bodyRef.current
    if (!root) return
    root.innerHTML = html
    setHitCount(highlight(root, searchRe, cueRe))
  }, [html, searchRe, cueRe])

  useEffect(() => {
    setActiveHit(0)
  }, [search])

  useEffect(() => {
    if (!hitCount) return
    const marks = bodyRef.current?.querySelectorAll('mark[data-hit]')
    marks?.forEach((m) => m.classList.remove('jd-hit-active'))
    const el = marks?.[activeHit]
    el?.classList.add('jd-hit-active')
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [activeHit, hitCount, html])

  const step = (dir: 1 | -1) => {
    if (!hitCount) return
    setActiveHit((h) => (h + dir + hitCount) % hitCount)
  }

  const cueCount = activeFactorId ? (FACTOR_CUES[activeFactorId]?.length ?? 0) : 0
  const empty = !jd.text && !jd.html

  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
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

        {activeFactorId && cueCount > 0 && (
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

        {richHtml && (
          <button
            onClick={() => setPlain((v) => !v)}
            title={
              plain
                ? 'Show the description as it is laid out in the original document'
                : 'Strip the formatting and show plain text'
            }
            className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors ${
              plain
                ? 'border-line bg-line-soft text-ink'
                : 'border-line bg-paper text-muted hover:bg-line-soft'
            }`}
          >
            {plain ? 'Plain text' : 'As laid out'}
          </button>
        )}
      </div>

      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {empty ? (
          <p className="py-10 text-center text-[13px] text-muted">
            No job description stored for this role.
          </p>
        ) : (
          <div ref={bodyRef} className="jd-body max-w-[70ch]" />
        )}
      </div>
    </div>
  )
}
