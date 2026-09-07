import { bandFor, type Band } from '../scheme/bands'
import { CORNERSTONES, FACTORS } from '../scheme/scheme'
import { scoreRole } from './scoring'
import type { Role } from './types'

const BACKUP_KIND = 'twentysix-role-sizing'
const BACKUP_VERSION = 1

export function download(filename: string, data: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke on the next tick so the click has definitely been handled.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

function stamp(): string {
  return new Date().toISOString().slice(0, 10)
}

/* ------------------------------- JSON backup ------------------------------ */

export function exportJson(roles: Role[], bands: Band[]) {
  const payload = { kind: BACKUP_KIND, version: BACKUP_VERSION, exportedAt: Date.now(), bands, roles }
  download(
    `role-sizing-${stamp()}.json`,
    JSON.stringify(payload, null, 2),
    'application/json',
  )
}

export interface ImportOutcome {
  roles: Role[]
  bands?: Band[]
  skipped: number
}

/**
 * Reads a backup file. Rejects anything that is not one of our exports rather
 * than half-importing a stranger's JSON.
 */
export async function readImport(file: File): Promise<ImportOutcome> {
  const raw = JSON.parse(await file.text()) as unknown
  if (!raw || typeof raw !== 'object') throw new Error('That file is not a role sizing export.')
  const obj = raw as Record<string, unknown>
  if (obj.kind !== BACKUP_KIND) {
    throw new Error('That file is not a role sizing export (missing the expected header).')
  }
  const list = Array.isArray(obj.roles) ? (obj.roles as unknown[]) : []
  const valid: Role[] = []
  let skipped = 0
  const validIds = new Set(FACTORS.map((f) => f.id))

  for (const item of list) {
    const r = item as Partial<Role>
    if (!r || typeof r.id !== 'string' || typeof r.title !== 'string') {
      skipped++
      continue
    }
    // Drop scores for factors this build does not know about, and levels
    // outside the factor's range, so an old export cannot corrupt a total.
    const scores: Record<string, number> = {}
    for (const [k, v] of Object.entries(r.scores ?? {})) {
      if (!validIds.has(k) || typeof v !== 'number') continue
      const f = FACTORS.find((x) => x.id === k)!
      if (f.levels.some((l) => l.level === v)) scores[k] = v
    }
    valid.push({
      id: r.id,
      organisation: r.organisation ?? '',
      title: r.title,
      functionArea: r.functionArea ?? '',
      reportsTo: r.reportsTo ?? '',
      clientGrade: r.clientGrade ?? '',
      salary: r.salary ?? '',
      jd: r.jd ?? { source: 'none', text: '' },
      scores,
      rationale: r.rationale ?? {},
      notes: r.notes ?? '',
      evaluator: r.evaluator ?? '',
      status: r.status ?? 'draft',
      createdAt: r.createdAt ?? Date.now(),
      updatedAt: r.updatedAt ?? Date.now(),
      completedAt: r.completedAt,
    })
  }
  return { roles: valid, bands: Array.isArray(obj.bands) ? (obj.bands as Band[]) : undefined, skipped }
}

/* ---------------------------------- CSV ---------------------------------- */

function csvCell(v: string | number | undefined | null): string {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/**
 * One row per role, laid out to mirror the JE Scheme Database workbook:
 * identity, then a level and a points column per factor, then the totals.
 */
export function exportCsv(roles: Role[], bands: Band[]) {
  const header = [
    'Date evaluated',
    'Organisation',
    'Job title',
    'Function',
    'Reports to',
    'Client grade',
    'FTE salary',
    ...FACTORS.flatMap((f) => [`${f.shortName} - level`, `${f.shortName} - points`]),
    ...CORNERSTONES.map((c) => `${c.name} points`),
    'Total points',
    'Contribution band',
    'Factors scored',
    'Status',
    'Evaluated by',
    'Notes',
  ]

  const rows = roles.map((r) => {
    const s = scoreRole(r)
    const band = s.complete ? bandFor(s.total, bands)?.name ?? '' : ''
    return [
      new Date(r.completedAt ?? r.updatedAt).toISOString().slice(0, 10),
      r.organisation,
      r.title,
      r.functionArea,
      r.reportsTo,
      r.clientGrade,
      r.salary,
      ...FACTORS.flatMap((f) => {
        const fs = s.byFactor.find((x) => x.factorId === f.id)!
        return [fs.level ?? '', fs.level == null ? '' : fs.points]
      }),
      ...CORNERSTONES.map((c) => s.byCornerstone[c.key].points),
      s.total,
      band,
      `${s.scoredCount}/${s.totalFactors}`,
      r.status,
      r.evaluator,
      r.notes.replace(/\n+/g, ' '),
    ]
  })

  const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
  // BOM so Excel on Windows reads the pound signs and en dashes correctly.
  download(`role-sizing-${stamp()}.csv`, `﻿${csv}`, 'text/csv;charset=utf-8')
}

/** Full rationale export - the audit trail behind each score. */
export function exportRationaleCsv(roles: Role[]) {
  const header = ['Organisation', 'Job title', 'Cornerstone', 'Factor', 'Level', 'Points', 'Level summary', 'Rationale']
  const rows: (string | number)[][] = []
  for (const r of roles) {
    for (const f of FACTORS) {
      const level = r.scores[f.id]
      if (level == null) continue
      const lv = f.levels.find((l) => l.level === level)!
      rows.push([
        r.organisation,
        r.title,
        CORNERSTONES.find((c) => c.key === f.cornerstone)!.name,
        f.name,
        level,
        lv.points,
        lv.label,
        r.rationale[f.id] ?? '',
      ])
    }
  }
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
  download(`role-sizing-rationale-${stamp()}.csv`, `﻿${csv}`, 'text/csv;charset=utf-8')
}
