export type RoleStatus = 'draft' | 'complete' | 'moderated'

export interface JobDescription {
  /** Where the text came from. */
  source: 'none' | 'pasted' | 'file'
  fileName?: string
  fileType?: string
  fileSize?: number
  /** Plain text used for reading and searching. */
  text: string
  /** Rich HTML, when the source format gave us structure (.docx). */
  html?: string
  /** True when text extraction produced little or nothing usable. */
  extractionFailed?: boolean
}

export interface Role {
  id: string
  organisation: string
  title: string
  /** Function / directorate, matching the workbook's "Function" column. */
  functionArea: string
  reportsTo: string
  /** The client's own grade or job level, if they have one. */
  clientGrade: string
  /** FTE salary or salary range, free text as in the workbook. */
  salary: string
  jd: JobDescription
  /** factorId -> chosen level number. Absent means not yet scored. */
  scores: Record<string, number>
  /** factorId -> the consultant's reason for that level. */
  rationale: Record<string, string>
  /** Overall note on the evaluation. */
  notes: string
  evaluator: string
  status: RoleStatus
  createdAt: number
  updatedAt: number
  /** Set the first time every factor has a score. */
  completedAt?: number
}

export interface Settings {
  evaluator: string
  /** Contribution bands - editable so a client's own structure can be used. */
  bands: import('../scheme/bands').Band[]
  /** Last sort choice on the library, so it survives a reload. */
  librarySort: 'points-desc' | 'points-asc' | 'title' | 'updated'
}

export interface StoredFile {
  roleId: string
  name: string
  type: string
  blob: Blob
}
