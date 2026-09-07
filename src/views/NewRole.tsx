import { useMemo, useRef, useState } from 'react'
import { OrganisationPicker } from '../components/OrganisationPicker'
import { Badge, Button, Field, Icon, Input, TextArea } from '../components/ui'
import { extractJobDescription, guessTitle, isSupported, type ExtractResult } from '../lib/extract'
import { go } from '../lib/route'
import { useAuth } from '../lib/auth'
import { useStore } from '../lib/store'

interface Staged {
  key: string
  file: File
  result?: ExtractResult
  title: string
  functionArea: string
  busy: boolean
}

function prettySize(bytes?: number) {
  if (!bytes) return ''
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1048576).toFixed(1)} MB`
}

export function NewRole() {
  const { roles, createRole, settings } = useStore()
  const { username } = useAuth()
  // Whoever is signed in gets the credit unless they have set a name in Settings.
  const evaluator = settings.evaluator || username
  const [mode, setMode] = useState<'upload' | 'type'>('upload')
  const [organisation, setOrganisation] = useState('')
  const [staged, setStaged] = useState<Staged[]>([])
  const [dragging, setDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Manual entry
  const [manual, setManual] = useState({
    title: '',
    functionArea: '',
    reportsTo: '',
    clientGrade: '',
    salary: '',
    text: '',
  })

  const knownOrgs = useMemo(
    () => [...new Set(roles.map((r) => r.organisation).filter(Boolean))].sort(),
    [roles],
  )

  const addFiles = async (files: File[]) => {
    const usable = files.filter(isSupported)
    const rejected = files.length - usable.length
    const entries: Staged[] = usable.map((file, i) => ({
      key: `${Date.now()}_${i}_${file.name}`,
      file,
      title: '',
      functionArea: '',
      busy: true,
    }))
    setStaged((prev) => [...prev, ...entries])
    if (rejected > 0) {
      window.setTimeout(
        () =>
          alert(
            `${rejected} file${rejected === 1 ? ' was' : 's were'} skipped. Word (.docx), PDF and plain text are supported.`,
          ),
        0,
      )
    }

    // Extract one at a time - a PDF worker chewing through ten files at once
    // makes the page feel broken.
    for (const entry of entries) {
      const result = await extractJobDescription(entry.file)
      setStaged((prev) =>
        prev.map((s) =>
          s.key === entry.key
            ? { ...s, result, busy: false, title: s.title || guessTitle(result.text) }
            : s,
        ),
      )
    }
  }

  const saveStaged = async () => {
    setSaving(true)
    try {
      const created = []
      for (const s of staged) {
        if (!s.result) continue
        const role = await createRole(
          {
            organisation: organisation.trim(),
            title: s.title.trim() || s.file.name.replace(/\.[^.]+$/, ''),
            functionArea: s.functionArea.trim(),
            evaluator,
            jd: {
              source: 'file',
              fileName: s.result.fileName,
              fileType: s.result.fileType,
              fileSize: s.result.fileSize,
              text: s.result.text,
              html: s.result.html,
              extractionFailed: s.result.extractionFailed,
            },
          },
          s.file,
        )
        created.push(role)
      }
      if (created.length === 1) go(`/evaluate/${created[0].id}`)
      else go('/')
    } finally {
      setSaving(false)
    }
  }

  const saveManual = async () => {
    setSaving(true)
    try {
      const role = await createRole({
        organisation: organisation.trim(),
        title: manual.title.trim(),
        functionArea: manual.functionArea.trim(),
        reportsTo: manual.reportsTo.trim(),
        clientGrade: manual.clientGrade.trim(),
        salary: manual.salary.trim(),
        evaluator,
        jd: manual.text.trim()
          ? { source: 'pasted', text: manual.text.trim() }
          : { source: 'none', text: '' },
      })
      go(`/evaluate/${role.id}`)
    } finally {
      setSaving(false)
    }
  }

  const ready = staged.length > 0 && staged.every((s) => !s.busy)

  return (
    <div className="mx-auto max-w-3xl px-5 py-6">
      <button
        onClick={() => go('/')}
        className="mb-4 flex items-center gap-1 text-[12px] font-medium text-muted hover:text-ink"
      >
        <Icon name="chevron" className="rotate-180" size={13} />
        Library
      </button>

      <h1 className="font-display text-[22px] font-semibold text-ink">Add a role</h1>
      <p className="mt-1 mb-6 text-[13px] leading-relaxed text-muted">
        Drop in job descriptions and the text is pulled out and kept with the role, so you can read
        it beside the scheme while you score. Nothing leaves this browser.
      </p>

      <div className="mb-5 rounded-xl border border-line bg-paper p-4">
        <OrganisationPicker value={organisation} onChange={setOrganisation} known={knownOrgs} />
      </div>

      <div className="mb-4 flex rounded-xl border border-line bg-paper p-1">
        {(
          [
            ['upload', 'Upload job descriptions'],
            ['type', 'Type or paste one in'],
          ] as const
        ).map(([k, labelText]) => (
          <button
            key={k}
            onClick={() => setMode(k)}
            className={`flex-1 rounded-lg px-3 py-2 text-[12.5px] font-semibold transition-colors ${
              mode === k ? 'bg-ink text-white' : 'text-muted hover:text-ink'
            }`}
          >
            {labelText}
          </button>
        ))}
      </div>

      {mode === 'upload' ? (
        <>
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              void addFiles([...e.dataTransfer.files])
            }}
            onClick={() => inputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
              dragging ? 'border-gold bg-gold-wash' : 'border-line bg-paper hover:border-gold/50'
            }`}
          >
            <Icon name="upload" size={22} className="mx-auto text-gold-deep" />
            <p className="mt-3 font-display text-[14px] font-semibold text-ink">
              Drop job descriptions here
            </p>
            <p className="mt-1 text-[12.5px] text-muted">
              Word (.docx), PDF or plain text. Add several at once to size a whole structure.
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept=".docx,.pdf,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => {
                const files = [...(e.target.files ?? [])]
                e.target.value = ''
                void addFiles(files)
              }}
            />
          </div>

          {staged.length > 0 && (
            <div className="mt-5 space-y-2.5">
              {staged.map((s) => (
                <div key={s.key} className="rounded-xl border border-line bg-paper p-3.5">
                  <div className="flex items-start gap-3">
                    <Icon name="doc" className="mt-1 shrink-0 text-gold-deep" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-[12.5px] font-semibold text-ink">
                          {s.file.name}
                        </span>
                        <span className="text-[11px] text-faint">{prettySize(s.file.size)}</span>
                        {s.busy ? (
                          <Badge tone="neutral">Reading…</Badge>
                        ) : s.result?.extractionFailed ? (
                          <Badge tone="warn">No text found</Badge>
                        ) : (
                          <Badge tone="good">
                            {s.result?.text.split(/\s+/).length.toLocaleString('en-GB')} words
                          </Badge>
                        )}
                      </div>

                      {s.result?.warning && (
                        <p className="mt-1.5 text-[11.5px] leading-relaxed text-warn">
                          {s.result.warning}
                        </p>
                      )}

                      {!s.busy && (
                        <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
                          <Field label="Job title">
                            <Input
                              value={s.title}
                              onChange={(e) =>
                                setStaged((prev) =>
                                  prev.map((x) => (x.key === s.key ? { ...x, title: e.target.value } : x)),
                                )
                              }
                              placeholder="Pulled from the document — check it"
                            />
                          </Field>
                          <Field label="Function" hint="optional">
                            <Input
                              value={s.functionArea}
                              onChange={(e) =>
                                setStaged((prev) =>
                                  prev.map((x) =>
                                    x.key === s.key ? { ...x, functionArea: e.target.value } : x,
                                  ),
                                )
                              }
                              placeholder="e.g. Finance"
                            />
                          </Field>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setStaged((prev) => prev.filter((x) => x.key !== s.key))}
                      aria-label={`Remove ${s.file.name}`}
                      className="rounded-md p-1 text-faint hover:bg-line-soft hover:text-danger"
                    >
                      <Icon name="close" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between gap-3 pt-1">
                <span className="text-[12px] text-muted">
                  {staged.length} role{staged.length === 1 ? '' : 's'} ready
                </span>
                <Button variant="gold" disabled={!ready || saving} onClick={() => void saveStaged()}>
                  {saving
                    ? 'Saving…'
                    : staged.length === 1
                      ? 'Add and start scoring'
                      : `Add ${staged.length} roles`}
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-line bg-paper p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Job title" className="sm:col-span-2">
              <Input
                value={manual.title}
                onChange={(e) => setManual({ ...manual, title: e.target.value })}
                placeholder="e.g. Employee Relations Adviser"
              />
            </Field>
            <Field label="Function" hint="optional">
              <Input
                value={manual.functionArea}
                onChange={(e) => setManual({ ...manual, functionArea: e.target.value })}
                placeholder="e.g. People"
              />
            </Field>
            <Field label="Reports to" hint="optional">
              <Input
                value={manual.reportsTo}
                onChange={(e) => setManual({ ...manual, reportsTo: e.target.value })}
              />
            </Field>
            <Field label="Client grade" hint="optional">
              <Input
                value={manual.clientGrade}
                onChange={(e) => setManual({ ...manual, clientGrade: e.target.value })}
                placeholder="Their own level, if they have one"
              />
            </Field>
            <Field label="FTE salary" hint="optional">
              <Input
                value={manual.salary}
                onChange={(e) => setManual({ ...manual, salary: e.target.value })}
                placeholder="e.g. £33,872 – £37,260"
              />
            </Field>
            <Field
              label="Job description"
              hint="paste it here — you will read this while scoring"
              className="sm:col-span-2"
            >
              <TextArea
                rows={12}
                value={manual.text}
                onChange={(e) => setManual({ ...manual, text: e.target.value })}
                placeholder="Paste the whole description. Blank lines and headings are kept."
              />
            </Field>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-[11.5px] text-faint">
              You can score a role without a description, but there is nothing to read against.
            </span>
            <Button
              variant="gold"
              disabled={!manual.title.trim() || saving}
              onClick={() => void saveManual()}
            >
              {saving ? 'Saving…' : 'Add and start scoring'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
