/**
 * Contribution bands, taken verbatim from the "Points" sheet of
 * "JE Scheme Database 2022.xlsx" (Contribution Types / Points Range).
 *
 * `max` is inclusive. The published top band stops at 1650 while the
 * scheme's arithmetic maximum is 1645, so every reachable score lands
 * in exactly one band.
 */
export interface Band {
  name: string
  min: number
  max: number
  /** Consultant's own note - editable in Settings, never invented by the tool. */
  note?: string
}

export const DEFAULT_BANDS: Band[] = [
  { name: 'Supports', min: 0, max: 300 },
  { name: 'Delivers', min: 301, max: 675 },
  { name: 'Leads & Enables', min: 676, max: 950 },
  { name: 'Operationalises', min: 951, max: 1200 },
  { name: 'Transforms', min: 1201, max: 1350 },
  { name: 'Translates', min: 1351, max: 1500 },
  { name: 'Develops', min: 1501, max: 1650 },
]

export function bandFor(points: number, bands: Band[]): Band | undefined {
  return bands.find((b) => points >= b.min && points <= b.max)
}

/**
 * Distance in points to the next band up, and to the bottom of the current
 * band. Consultants use this to judge how safe a borderline size is.
 */
export function bandProximity(points: number, bands: Band[]) {
  const idx = bands.findIndex((b) => points >= b.min && points <= b.max)
  if (idx === -1) return null
  const band = bands[idx]
  const next = bands[idx + 1]
  return {
    band,
    next,
    intoBand: points - band.min,
    toNext: next ? next.min - points : null,
    bandWidth: band.max - band.min + 1,
  }
}
