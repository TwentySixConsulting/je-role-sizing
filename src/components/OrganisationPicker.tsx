import { useMemo, useState } from 'react'
import { Icon, Input, Label } from './ui'

/**
 * Picking an organisation is the one field that decides how the library groups
 * and ranks, so the ones already in use are offered as buttons rather than
 * hidden behind a datalist the consultant has to know is there.
 */
export function OrganisationPicker({
  value,
  onChange,
  known,
  label = 'Organisation',
  hint = 'Roles are grouped and ranked within an organisation',
  compact = false,
}: {
  value: string
  onChange: (next: string) => void
  known: string[]
  label?: string
  hint?: string
  compact?: boolean
}) {
  const [typing, setTyping] = useState(() => known.length === 0)

  const options = useMemo(() => [...new Set(known.filter(Boolean))].sort(), [known])
  const isNew = value.trim().length > 0 && !options.includes(value.trim())

  return (
    <div>
      <Label hint={compact ? undefined : hint}>{label}</Label>

      {options.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {options.map((org) => {
            const active = value.trim() === org
            return (
              <button
                key={org}
                type="button"
                onClick={() => {
                  onChange(org)
                  setTyping(false)
                }}
                className={`rounded-lg border px-2.5 py-1 text-[12px] font-medium transition-colors ${
                  active
                    ? 'border-gold bg-gold-wash text-ink'
                    : 'border-line bg-paper text-ink-soft hover:bg-line-soft'
                }`}
              >
                {org}
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => setTyping((v) => !v)}
            className={`flex items-center gap-1 rounded-lg border border-dashed px-2.5 py-1 text-[12px] font-medium transition-colors ${
              typing || isNew
                ? 'border-gold text-gold-deep'
                : 'border-line text-muted hover:bg-line-soft hover:text-ink'
            }`}
          >
            <Icon name="plus" size={12} />
            New organisation
          </button>
        </div>
      )}

      {(typing || isNew || options.length === 0) && (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Brighton Technologies"
          autoFocus={typing && options.length > 0}
        />
      )}
    </div>
  )
}
