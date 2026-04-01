export type AssignmentStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'IN_REVIEW'
  | 'REQUIRES_CHANGES'
  | 'APPROVED'

export interface Assignment {
  id: string
  student_id: string
  teacher_id: string
  title: string
  status: AssignmentStatus
  created_at: string
  updated_at: string
}

export interface AssignmentVersion {
  id: string
  assignment_id: string
  version_number: number
  content: TipTapNode
  created_at: string
}

export interface TipTapNode {
  type: string
  content?: TipTapNode[]
  text?: string
  attrs?: Record<string, unknown>
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>
}
