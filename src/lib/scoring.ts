import {
  CORNERSTONES,
  CORNERSTONE_MAX,
  FACTORS,
  FACTORS_BY_ID,
  type CornerstoneKey,
} from '../scheme/scheme'
import type { Role } from './types'

export interface FactorScore {
  factorId: string
  level: number | null
  points: number
  /** Highest points available on this factor, for profile scaling. */
  maxPoints: number
}

export interface RoleScore {
  total: number
  byFactor: FactorScore[]
  byCornerstone: Record<CornerstoneKey, { points: number; max: number; share: number }>
  scoredCount: number
  totalFactors: number
  complete: boolean
}

export function levelPoints(factorId: string, level: number | undefined | null): number {
  if (level == null) return 0
  const f = FACTORS_BY_ID[factorId]
  if (!f) return 0
  return f.levels.find((l) => l.level === level)?.points ?? 0
}

export function scoreRole(role: Pick<Role, 'scores'>): RoleScore {
  const byFactor: FactorScore[] = FACTORS.map((f) => {
    const level = role.scores[f.id] ?? null
    return {
      factorId: f.id,
      level,
      points: levelPoints(f.id, level),
      maxPoints: Math.max(...f.levels.map((l) => l.points)),
    }
  })

  const total = byFactor.reduce((t, s) => t + s.points, 0)

  const byCornerstone = CORNERSTONES.reduce(
    (acc, c) => {
      const points = byFactor
        .filter((s) => FACTORS_BY_ID[s.factorId].cornerstone === c.key)
        .reduce((t, s) => t + s.points, 0)
      acc[c.key] = {
        points,
        max: CORNERSTONE_MAX[c.key],
        share: total > 0 ? points / total : 0,
      }
      return acc
    },
    {} as RoleScore['byCornerstone'],
  )

  const scoredCount = byFactor.filter((s) => s.level != null).length
  return {
    total,
    byFactor,
    byCornerstone,
    scoredCount,
    totalFactors: FACTORS.length,
    complete: scoredCount === FACTORS.length,
  }
}

/** Points a role would total if every unscored factor sat at its lowest level. */
export function isFullyScored(role: Pick<Role, 'scores'>): boolean {
  return FACTORS.every((f) => role.scores[f.id] != null)
}

export function missingFactors(role: Pick<Role, 'scores'>) {
  return FACTORS.filter((f) => role.scores[f.id] == null)
}

/**
 * Moderation aid: for each factor, how far a role's level sits from the median
 * level given to that factor across a comparison set (normally the other
 * complete roles in the same organisation). Two or more levels away is worth a
 * second look, so that is what `flagged` means.
 */
export interface FactorDeviation {
  factorId: string
  level: number | null
  median: number | null
  delta: number | null
  flagged: boolean
}

export function median(values: number[]): number | null {
  if (!values.length) return null
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

export function deviations(role: Role, comparisonSet: Role[]): FactorDeviation[] {
  const others = comparisonSet.filter((r) => r.id !== role.id)
  return FACTORS.map((f) => {
    const level = role.scores[f.id] ?? null
    const peers = others.map((r) => r.scores[f.id]).filter((l): l is number => l != null)
    const med = median(peers)
    const delta = level != null && med != null ? level - med : null
    return {
      factorId: f.id,
      level,
      median: med,
      delta,
      flagged: delta != null && Math.abs(delta) >= 2,
    }
  })
}

export const CORNERSTONE_COLOUR: Record<CornerstoneKey, string> = {
  knowHow: 'var(--color-cs-knowhow)',
  people: 'var(--color-cs-people)',
  thinking: 'var(--color-cs-thinking)',
  delivery: 'var(--color-cs-delivery)',
}

export function fmtPoints(n: number): string {
  return n.toLocaleString('en-GB')
}
