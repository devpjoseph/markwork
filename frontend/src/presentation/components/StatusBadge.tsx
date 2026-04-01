import { useTheme } from '@application/theme/useTheme'
import type { AssignmentStatus } from '@domain/models'

const STATUS_LABELS: Record<AssignmentStatus, string> = {
  DRAFT: 'Draft',
  PENDING_REVIEW: 'Pending Review',
  IN_REVIEW: 'In Review',
  REQUIRES_CHANGES: 'Requires Changes',
  APPROVED: 'Approved',
}

interface StatusBadgeProps {
  status: AssignmentStatus
  size?: 'sm' | 'md'
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const colors = useTheme()
  const isSmall = size === 'sm'

  const statusMap: Record<AssignmentStatus, { bg: string; text: string; dot: string }> = {
    DRAFT: colors.statusDraft,
    PENDING_REVIEW: colors.statusPending,
    IN_REVIEW: colors.statusInReview,
    REQUIRES_CHANGES: colors.statusRequiresChanges,
    APPROVED: colors.statusApproved,
  }

  const style = statusMap[status]

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        background: style.bg,
        color: style.text,
        fontSize: isSmall ? '0.6875rem' : '0.75rem',
        fontWeight: 600,
        padding: isSmall ? '0.1875rem 0.5rem' : '0.25rem 0.625rem',
        borderRadius: '9999px',
        letterSpacing: '0.03em',
        fontFamily: "'Geist', 'Inter', sans-serif",
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: isSmall ? '5px' : '6px',
          height: isSmall ? '5px' : '6px',
          borderRadius: '9999px',
          background: style.dot,
          flexShrink: 0,
        }}
      />
      {STATUS_LABELS[status]}
    </span>
  )
}
