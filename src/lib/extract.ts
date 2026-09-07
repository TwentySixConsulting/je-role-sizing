import type { JobDescription } from './types'

export interface ExtractResult extends JobDescription {
  /** Human-readable problem, shown next to the upload when something went wrong. */
  warning?: string
}

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export function isSupported(file: File): boolean {
  const n = file.name.toLowerCase()
  return (
    file.type === DOCX ||
    file.type === 'application/pdf' ||
    /\.(docx|pdf|txt|md|rtf)$/.test(n)
  )
}

const BULLET = /^([\u2022\u00b7\u25aa\u2013\u2014*+-]|\(?\d{1,2}[.)]|[a-z][.)]|[ivxIVX]{1,4}[.)])\s/
const SENTENCE_END = /[.:;!?"\u2019\u201d)]$/

function isShouted(line: string): boolean {
  const letters = line.replace(/[^A-Za-z]/g, '')
  return letters.length > 2 && letters === letters.toUpperCase()
}

/**
 * A PDF gives one text run per visual line, so a wrapped sentence arrives as
 * several lines. Join a line onto the one before it when it is plainly a
 * continuation, and leave headings, bullets and finished sentences alone.
 */
function reflow(lines: string[]): string[] {
  const out: string[] = []
  for (const line of lines) {
    const prev = out[out.length - 1]
    const continues =
      prev !== undefined &&
      prev.length > 30 &&
      !SENTENCE_END.test(prev) &&
      !isShouted(prev) &&
      !BULLET.test(line) &&
      !isShouted(line) &&
      /^[a-z(,"\u2018\u201c]/.test(line)
    if (continues) out[out.length - 1] = `${prev} ${line}`
    else out.push(line)
  }
  return out
}

async function extractPdf(file: File): Promise<ExtractResult> {
  const pdfjs = await import('pdfjs-dist')
  // Vite resolves this to a hashed asset URL and pdf.js runs it as a module worker.
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

  const buf = await file.arrayBuffer()
  const doc = await pdfjs.getDocument({ data: buf }).promise
  const pages: string[] = []

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const content = await page.getTextContent()
    // Group items into lines by their y position, so headings and bullets
    // survive rather than collapsing into one run-on paragraph.
    const lines = new Map<number, { x: number; str: string }[]>()
    for (const item of content.items) {
      if (!('str' in item) || !item.str) continue
      const y = Math.round((item.transform[5] as number) * 2) / 2
      const arr = lines.get(y) ?? []
      arr.push({ x: item.transform[4] as number, str: item.str })
      lines.set(y, arr)
    }
    const ordered = [...lines.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, parts]) =>
        parts
          .sort((a, b) => a.x - b.x)
          .map((p) => p.str)
          .join('')
          .replace(/\s+/g, ' ')
          .trim(),
      )
      .filter(Boolean)
    pages.push(reflow(ordered).join('\n'))
    page.cleanup()
  }
  await doc.destroy()

  const text = pages.join('\n\n').trim()
  const result: ExtractResult = {
    source: 'file',
    fileName: file.name,
    fileType: file.type || 'application/pdf',
    fileSize: file.size,
    text,
  }
  if (text.replace(/\s/g, '').length < 40) {
    result.extractionFailed = true
    result.warning =
      'No readable text found. This looks like a scanned PDF, so the text layer is missing. Paste the description in instead, or run the file through OCR first.'
  }
  return result
}

async function extractDocx(file: File): Promise<ExtractResult> {
  const mammoth = (await import('mammoth/mammoth.browser.min.js')).default
  const arrayBuffer = await file.arrayBuffer()
  const [html, raw] = await Promise.all([
    mammoth.convertToHtml({ arrayBuffer }),
    mammoth.extractRawText({ arrayBuffer }),
  ])
  const text = raw.value.replace(/\r\n/g, '\n').trim()
  const result: ExtractResult = {
    source: 'file',
    fileName: file.name,
    fileType: file.type || DOCX,
    fileSize: file.size,
    text,
    html: html.value,
  }
  if (!text) {
    result.extractionFailed = true
    result.warning =
      'That Word file had no extractable text. If the content is inside images or text boxes, paste it in instead.'
  }
  return result
}

async function extractPlain(file: File): Promise<ExtractResult> {
  const text = (await file.text()).replace(/\r\n/g, '\n').trim()
  return {
    source: 'file',
    fileName: file.name,
    fileType: file.type || 'text/plain',
    fileSize: file.size,
    text,
  }
}

export async function extractJobDescription(file: File): Promise<ExtractResult> {
  const name = file.name.toLowerCase()
  try {
    if (file.type === 'application/pdf' || name.endsWith('.pdf')) return await extractPdf(file)
    if (file.type === DOCX || name.endsWith('.docx')) return await extractDocx(file)
    if (name.endsWith('.doc')) {
      return {
        source: 'file',
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        text: '',
        extractionFailed: true,
        warning:
          'Old-format .doc files cannot be read in the browser. Open it in Word and re-save as .docx or PDF, or paste the text in.',
      }
    }
    return await extractPlain(file)
  } catch (err) {
    return {
      source: 'file',
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      text: '',
      extractionFailed: true,
      warning: `Could not read that file: ${err instanceof Error ? err.message : String(err)}`,
    }
  }
}

/**
 * Best-effort guess at the job title from the top of a job description, used
 * only to pre-fill the title field so the consultant can correct it.
 */
export function guessTitle(text: string): string {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 15)

  const LABEL = /^(job\s*title|role\s*title|post\s*title|position|job|role|post|title)\s*[:\-\u2013]\s*/i
  const NOISE = /^(job description|role profile|role description|job profile|about us|person specification|introduction)$/i

  const labelled = lines.find((l) => LABEL.test(l) && l.replace(LABEL, '').trim().length > 1)
  if (labelled) {
    const v = labelled.replace(LABEL, '').trim()
    if (v.length > 1 && v.length < 90) return tidyTitle(v)
  }

  const plausible = lines.find((l) => l.length > 2 && l.length < 70 && !NOISE.test(l))
  return plausible ? tidyTitle(plausible) : ''
}

/** Job descriptions often SHOUT the title; sentence-case it for the library. */
function tidyTitle(raw: string): string {
  const t = raw.replace(/\s+/g, ' ').replace(/[:\-\u2013]\s*$/, '').trim()
  const letters = t.replace(/[^A-Za-z]/g, '')
  if (letters.length > 2 && letters === letters.toUpperCase()) {
    return t
      .toLowerCase()
      .replace(/\b([a-z])/g, (m) => m.toUpperCase())
      .replace(/\b(And|Of|The|For|To|In|A|An)\b/g, (m) => m.toLowerCase())
      .replace(/^./, (m) => m.toUpperCase())
  }
  return t
}
