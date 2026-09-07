import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { useEffect, useRef } from 'react'

/* --------------------------------- Button -------------------------------- */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-ink text-white hover:bg-ink-soft border-ink',
  gold: 'bg-gold text-ink hover:bg-gold-deep hover:text-white border-gold',
  secondary: 'bg-paper text-ink hover:bg-line-soft border-line',
  ghost: 'bg-transparent text-ink-soft hover:bg-line-soft border-transparent',
  danger: 'bg-paper text-danger hover:bg-red-50 border-line',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' }) {
  const pad = size === 'sm' ? 'px-2.5 py-1.5 text-[12px]' : 'px-3.5 py-2 text-[13px]'
  return (
    <button
      {...rest}
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border font-medium transition-colors focus-visible:ring-2 focus-visible:ring-gold focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45 ${pad} ${VARIANTS[variant]} ${className}`}
    />
  )
}

/* --------------------------------- Inputs -------------------------------- */

const FIELD =
  'w-full rounded-lg border border-line bg-paper px-3 py-2 text-[13px] text-ink placeholder:text-faint focus:border-gold focus:ring-2 focus:ring-gold/25 focus:outline-none'

export function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <span className="mb-1.5 flex items-baseline gap-2">
      <span className="text-[11px] font-semibold tracking-[0.07em] text-muted uppercase">
        {children}
      </span>
      {hint && <span className="text-[11px] text-faint">{hint}</span>}
    </span>
  )
}

export function Field({
  label,
  hint,
  children,
  className = '',
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <Label hint={hint}>{label}</Label>
      {children}
    </label>
  )
}

export function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={`${FIELD} ${className}`} />
}

export function TextArea({ className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...rest} className={`${FIELD} resize-y leading-relaxed ${className}`} />
}

export function Select({ className = '', ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...rest} className={`${FIELD} cursor-pointer pr-8 ${className}`} />
}

/* --------------------------------- Chrome -------------------------------- */

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-line bg-paper shadow-[0_1px_2px_rgba(19,26,46,0.04)] ${className}`}>
      {children}
    </div>
  )
}

export function Badge({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: ReactNode
  tone?: 'neutral' | 'gold' | 'good' | 'warn' | 'ink'
  className?: string
}) {
  const tones = {
    neutral: 'bg-line-soft text-muted border-line',
    gold: 'bg-gold-wash text-gold-deep border-gold/35',
    good: 'bg-emerald-50 text-good border-emerald-200',
    warn: 'bg-amber-50 text-warn border-amber-200',
    ink: 'bg-ink text-white border-ink',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-4">
      <h2 className="font-display text-[15px] font-semibold text-ink">{children}</h2>
      {right}
    </div>
  )
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-paper/60 px-8 py-14 text-center">
      <h3 className="font-display text-[15px] font-semibold text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-muted">{body}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  )
}

/* --------------------------------- Modal --------------------------------- */

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 'max-w-lg',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  width?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    ref.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/35 p-4 pt-[8vh] backdrop-blur-[2px]">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`animate-rise relative w-full ${width} rounded-2xl border border-line bg-paper shadow-2xl outline-none`}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="font-display text-[14px] font-semibold text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted hover:bg-line-soft hover:text-ink"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

/* --------------------------------- Icons --------------------------------- */

const PATHS: Record<string, ReactNode> = {
  close: <path d="M4 4l8 8M12 4l-8 8" />,
  chevron: <path d="M6 4l4 4-4 4" />,
  down: <path d="M4 6l4 4 4-4" />,
  up: <path d="M4 10l4-4 4 4" />,
  plus: <path d="M8 3.5v9M3.5 8h9" />,
  search: (
    <>
      <circle cx="7" cy="7" r="4" />
      <path d="M10 10l3 3" />
    </>
  ),
  check: <path d="M3.5 8.5l3 3 6-7" />,
  doc: (
    <>
      <path d="M4 2h5l3 3v9H4z" />
      <path d="M9 2v3h3" />
    </>
  ),
  upload: (
    <>
      <path d="M8 11V3" />
      <path d="M5 6l3-3 3 3" />
      <path d="M3 11v2h10v-2" />
    </>
  ),
  download: (
    <>
      <path d="M8 3v8" />
      <path d="M5 8l3 3 3-3" />
      <path d="M3 13h10" />
    </>
  ),
  trash: (
    <>
      <path d="M3 4.5h10" />
      <path d="M6 4.5V3h4v1.5" />
      <path d="M4.5 4.5l.6 8.5h5.8l.6-8.5" />
    </>
  ),
  print: (
    <>
      <path d="M5 5V2.5h6V5" />
      <path d="M3 5h10v5h-2" />
      <path d="M5 8.5h6V13H5z" />
    </>
  ),
  book: (
    <>
      <path d="M3 3h4.5a1.5 1.5 0 011.5 1.5V13a1.2 1.2 0 00-1.2-1.2H3z" />
      <path d="M13 3H8.5A1.5 1.5 0 007 4.5V13a1.2 1.2 0 011.2-1.2H13z" />
    </>
  ),
  scales: (
    <>
      <path d="M8 2.5V13" />
      <path d="M4 13h8" />
      <path d="M3 5.5h10" />
      <path d="M3 5.5L1.5 9h3z" />
      <path d="M13 5.5L11.5 9h3z" />
    </>
  ),
  cog: (
    <>
      <circle cx="8" cy="8" r="2.2" />
      <path d="M8 1.6v1.8M8 12.6v1.8M1.6 8h1.8M12.6 8h1.8M3.5 3.5l1.3 1.3M11.2 11.2l1.3 1.3M12.5 3.5l-1.3 1.3M4.8 11.2l-1.3 1.3" />
    </>
  ),
  warning: (
    <>
      <path d="M8 2.5l6 10.5H2z" />
      <path d="M8 6.5v3.2" />
      <path d="M8 11.3v.4" />
    </>
  ),
  info: (
    <>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 7.2v4M8 5.1v.4" />
    </>
  ),
  signout: (
    <>
      <path d="M10 11.5V13H3V3h7v1.5" />
      <path d="M7 8h7" />
      <path d="M11.5 5.5L14 8l-2.5 2.5" />
    </>
  ),
  reset: (
    <>
      <path d="M13 8a5 5 0 11-1.8-3.85" />
      <path d="M13 2.5V5h-2.5" />
    </>
  ),
}

export function Icon({
  name,
  className = '',
  size = 16,
}: {
  name: keyof typeof PATHS | string
  className?: string
  size?: number
}) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      {PATHS[name] ?? null}
    </svg>
  )
}
