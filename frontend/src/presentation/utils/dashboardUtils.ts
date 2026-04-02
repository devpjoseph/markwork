import type { AssignmentStatus } from '@domain/models'
import type { ThemeColors } from '@application/theme/themeTokens'

// ── Date formatting ──────────────────────────────────────────────────────────

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Badge styles ─────────────────────────────────────────────────────────────

export function getBadgeStyle(
  status: AssignmentStatus,
  colors: ThemeColors,
): { bg: string; color: string; label: string } {
  const map: Record<AssignmentStatus, { bg: string; color: string; label: string }> = {
    REQUIRES_CHANGES: { bg: colors.statusRequiresChanges.bg, color: colors.statusRequiresChanges.text, label: 'Returned' },
    PENDING_REVIEW:   { bg: colors.statusPending.bg, color: colors.statusPending.text, label: 'Pending Review' },
    IN_REVIEW:        { bg: colors.statusInReview.bg, color: colors.statusInReview.text, label: 'In Review' },
    DRAFT:            { bg: colors.statusDraft.bg, color: colors.statusDraft.text, label: 'Draft' },
    APPROVED:         { bg: colors.statusApproved.bg, color: colors.statusApproved.text, label: 'Approved' },
  }
  return map[status]
}

// ── Status groups ────────────────────────────────────────────────────────────

export interface StatusGroup {
  status: AssignmentStatus
  label: string
  useAccent?: boolean
}

const ALL_STATUS_GROUPS: StatusGroup[] = [
  { status: 'REQUIRES_CHANGES', label: 'Returned for Revision', useAccent: true },
  { status: 'PENDING_REVIEW', label: 'Pending Review' },
  { status: 'IN_REVIEW', label: 'In Review' },
  { status: 'DRAFT', label: 'Drafts' },
  { status: 'APPROVED', label: 'Approved' },
]

export const STUDENT_STATUS_ORDER: AssignmentStatus[] = [
  'REQUIRES_CHANGES', 'PENDING_REVIEW', 'IN_REVIEW', 'DRAFT', 'APPROVED',
]

export const TEACHER_STATUS_ORDER: AssignmentStatus[] = [
  'PENDING_REVIEW', 'IN_REVIEW', 'REQUIRES_CHANGES', 'APPROVED',
]

export function getStatusGroups(order: AssignmentStatus[]): StatusGroup[] {
  return order.map((s) => ALL_STATUS_GROUPS.find((g) => g.status === s)!).filter(Boolean)
}
