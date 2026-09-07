import { useState } from 'react'
import { Button, Field, Icon, Input, Modal } from '../components/ui'
import { DEFAULT_BANDS } from '../scheme/bands'
import { MAX_POINTS, MIN_POINTS } from '../scheme/scheme'
import { exportJson } from '../lib/exportImport'
import { go } from '../lib/route'
import { fmtPoints } from '../lib/scoring'
import { useStore } from '../lib/store'

export function SettingsView() {
  const { settings, saveSettings, roles, clearAllRoles, storage } = useStore()
  const [confirmWipe, setConfirmWipe] = useState(false)

  const bands = settings.bands

  const updateBand = (i: number, patch: Partial<(typeof bands)[number]>) => {
    const next = bands.map((b, j) => (j === i ? { ...b, ...patch } : b))
    void saveSettings({ bands: next })
  }

  // A band set is only usable if it is ordered and leaves no gap or overlap.
  const problems: string[] = []
  bands.forEach((b, i) => {
    if (b.max < b.min) problems.push(`${b.name}: the top is below the bottom.`)
    const prev = bands[i - 1]
    if (prev && b.min !== prev.max + 1) {
      problems.push(`Between ${prev.name} and ${b.name} there is a ${b.min > prev.max + 1 ? 'gap' : 'overlap'}.`)
    }
  })
  const top = bands[bands.length - 1]?.max ?? 0
  if (top < MAX_POINTS) {
    problems.push(
      `The top band stops at ${fmtPoints(top)}, below the scheme maximum of ${fmtPoints(MAX_POINTS)}. A very large role would fall outside every band.`,
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-6">
      <button
        onClick={() => go('/')}
        className="mb-4 flex items-center gap-1 text-[12px] font-medium text-muted hover:text-ink"
      >
        <Icon name="chevron" className="rotate-180" size={13} />
        Library
      </button>

      <h1 className="font-display text-[22px] font-semibold text-ink">Settings</h1>

      {/* Evaluator */}
      <section className="mt-5 rounded-xl border border-line bg-paper p-4">
        <h2 className="mb-1 font-display text-[14px] font-semibold text-ink">Who is scoring</h2>
        <p className="mb-3 text-[12.5px] text-muted">
          Stamped onto new roles and shown on the report, so a panel can see who sized what. This
          one is yours alone and stays in your browser.
        </p>
        <Field label="Name">
          <Input
            defaultValue={settings.evaluator}
            onBlur={(e) => void saveSettings({ evaluator: e.target.value })}
            placeholder="e.g. Millie Harrison"
            className="max-w-sm"
          />
        </Field>
      </section>

      {/* Bands */}
      <section className="mt-5 rounded-xl border border-line bg-paper p-4">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="font-display text-[14px] font-semibold text-ink">Contribution bands</h2>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => void saveSettings({ bands: DEFAULT_BANDS })}
          >
            <Icon name="reset" size={13} />
            Reset to the scheme
          </Button>
        </div>
        <p className="mb-3 text-[12.5px] leading-relaxed text-muted">
          These are the ranges from the JE Scheme Database. Change them only to match a client's own
          grade structure. The scheme itself can produce {fmtPoints(MIN_POINTS)} to{' '}
          {fmtPoints(MAX_POINTS)} points.
          {storage === 'shared' && ' Bands are shared, so a change here applies to the whole team.'}
        </p>

        <div className="space-y-2">
          {bands.map((b, i) => (
            <div key={i} className="grid items-end gap-2 sm:grid-cols-[1.2fr_5rem_5rem_1.6fr]">
              <Field label={i === 0 ? 'Name' : ''}>
                <Input
                  value={b.name}
                  onChange={(e) => updateBand(i, { name: e.target.value })}
                  className="text-[12.5px]"
                />
              </Field>
              <Field label={i === 0 ? 'From' : ''}>
                <Input
                  type="number"
                  value={b.min}
                  onChange={(e) => updateBand(i, { min: Number(e.target.value) })}
                  className="tnum text-[12.5px]"
                />
              </Field>
              <Field label={i === 0 ? 'To' : ''}>
                <Input
                  type="number"
                  value={b.max}
                  onChange={(e) => updateBand(i, { max: Number(e.target.value) })}
                  className="tnum text-[12.5px]"
                />
              </Field>
              <Field label={i === 0 ? 'Your note' : ''}>
                <Input
                  value={b.note ?? ''}
                  onChange={(e) => updateBand(i, { note: e.target.value })}
                  placeholder="optional"
                  className="text-[12.5px]"
                />
              </Field>
            </div>
          ))}
        </div>

        {problems.length > 0 && (
          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <Icon name="warning" size={13} className="text-warn" />
              <span className="text-[12px] font-semibold text-ink">Check these bands</span>
            </div>
            <ul className="mt-1 list-disc pl-5 text-[12px] leading-relaxed text-muted">
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Data */}
      <section className="mt-5 rounded-xl border border-line bg-paper p-4">
        <h2 className="mb-1 font-display text-[14px] font-semibold text-ink">
          {storage === 'shared' ? 'Team data' : 'Your data'}
        </h2>
        {storage === 'shared' ? (
          <p className="mb-3 text-[12.5px] leading-relaxed text-muted">
            Roles, scores and job descriptions are saved to TwentySix's own database, so every
            consultant who signs in sees the same library and changes appear without reloading.
            Deleting a role deletes it for everyone, so take a backup first if there is any doubt.
          </p>
        ) : (
          <p className="mb-3 text-[12.5px] leading-relaxed text-muted">
            This copy is running on browser-only storage, so nothing is shared with the rest of the
            team and clearing your browser data loses it. Take a backup before anything risky, and
            use a backup file to move work to a colleague.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => exportJson(roles, settings.bands)} disabled={!roles.length}>
            <Icon name="download" size={13} />
            Download a backup ({roles.length} role{roles.length === 1 ? '' : 's'})
          </Button>
          <Button variant="danger" onClick={() => setConfirmWipe(true)} disabled={!roles.length}>
            <Icon name="trash" size={13} />
            {storage === 'shared' ? 'Delete everything, for everyone' : 'Delete everything'}
          </Button>
        </div>
      </section>

      <Modal open={confirmWipe} onClose={() => setConfirmWipe(false)} title="Delete everything?">
        <p className="text-[13px] leading-relaxed text-ink-soft">
          This removes all {roles.length} role{roles.length === 1 ? '' : 's'}, their scores and
          their stored job descriptions
          {storage === 'shared'
            ? ' from the shared team database, for every consultant'
            : ' from this browser'}
          . It cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button onClick={() => setConfirmWipe(false)}>Cancel</Button>
          <Button
            variant="danger"
            onClick={async () => {
              await clearAllRoles()
              setConfirmWipe(false)
              go('/')
            }}
          >
            Yes, delete everything
          </Button>
        </div>
      </Modal>
    </div>
  )
}
