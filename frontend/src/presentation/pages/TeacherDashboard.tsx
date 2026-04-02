import { useNavigate } from 'react-router-dom'
import { useTheme } from '@application/theme/useTheme'
import type { Assignment, AssignmentStatus } from '@domain/models'
import { formatDate, getBadgeStyle, getStatusGroups, TEACHER_STATUS_ORDER } from '../utils/dashboardUtils'


interface CardProps {
  assignment: Assignment
  onClick: () => void
}

function TeacherCard({ assignment, onClick }: CardProps) {
  const colors = useTheme()
  const badge = getBadgeStyle(assignment.status, colors)

  const actionLabel: Partial<Record<AssignmentStatus, { text: string; color: string }>> = {
    PENDING_REVIEW: { text: 'Review Now →', color: colors.primary },
    IN_REVIEW: { text: 'Continue Review →', color: colors.primary },
    REQUIRES_CHANGES: { text: 'Waiting for student', color: colors.textMuted },
  }
  const action = actionLabel[assignment.status]

  const timeLabel = (assignment.status === 'PENDING_REVIEW' || assignment.status === 'IN_REVIEW')
    ? `Submitted ${formatDate(assignment.updated_at)}`
    : `Updated ${formatDate(assignment.updated_at)}`

  return (
    <div
      onClick={onClick}
      className="assignment-card"
      style={{
        background: colors.surface,
        borderRadius: '0.75rem',
        border: `1px solid ${colors.border}`,
        padding: '1.25rem 1.5rem',
        cursor: 'pointer',
      }}
    >
      {/* Badge row */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.625rem' }}>
        <span
          style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: '0.25rem 0.625rem',
            borderRadius: '9999px',
            background: badge.bg,
            color: badge.color,
          }}
        >
          {badge.label}
        </span>
      </div>

      {/* Title */}
      <h3
        style={{
          margin: '0 0 1rem',
          fontSize: '1.125rem',
          fontWeight: 600,
          color: colors.text,
          fontFamily: "'Newsreader', Georgia, serif",
          lineHeight: 1.3,
        }}
      >
        {assignment.title}
      </h3>

      {/* Bottom row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.8125rem', color: colors.textMuted, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
          {timeLabel}
        </span>
        {action && (
          <span style={{ fontSize: '0.8125rem', color: action.color, fontWeight: 500 }}>
            {action.text}
          </span>
        )}
      </div>
    </div>
  )
}

interface TeacherDashboardProps {
  assignments: Assignment[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export default function TeacherDashboard({ assignments, isLoading, error, refetch }: TeacherDashboardProps) {
  const navigate = useNavigate()
  const colors = useTheme()

  function handleCardClick(assignment: Assignment) {
    navigate(`/assignments/${assignment.id}/review`)
  }

  const grouped = getStatusGroups(TEACHER_STATUS_ORDER).map(({ status, label, useAccent }) => ({
    label,
    accent: useAccent ? colors.primary : undefined,
    items: assignments.filter((a) => a.status === status),
  })).filter((g) => g.items.length > 0)

  return (
    <div style={{ fontFamily: "'Geist', 'Inter', sans-serif", width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1
          style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontSize: '2rem',
            fontWeight: 700,
            color: colors.text,
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          Review Inbox
        </h1>
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                background: colors.surface,
                borderRadius: '0.75rem',
                border: `1px solid ${colors.border}`,
                padding: '1rem 1.25rem',
                height: '80px',
              }}
            />
          ))}
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div
          style={{
            background: colors.errorBg,
            border: `1px solid ${colors.errorBorder}`,
            borderRadius: '0.75rem',
            padding: '1rem 1.25rem',
            color: colors.error,
            fontSize: '0.9375rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{error}</span>
          <button
            onClick={refetch}
            style={{
              background: 'none',
              border: `1px solid ${colors.errorBorder}`,
              borderRadius: '0.375rem',
              padding: '0.25rem 0.75rem',
              color: colors.error,
              cursor: 'pointer',
              fontSize: '0.8125rem',
              fontFamily: 'inherit',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && assignments.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            background: colors.surface,
            borderRadius: '0.75rem',
            border: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📄</div>
          <h3
            style={{
              fontFamily: "'Newsreader', Georgia, serif",
              fontSize: '1.25rem',
              fontWeight: 600,
              color: colors.text,
              margin: '0 0 0.5rem',
            }}
          >
            No assignments to review
          </h3>
          <p style={{ color: colors.textMuted, margin: 0, fontSize: '0.9375rem' }}>
            When students submit work, it will appear here.
          </p>
        </div>
      )}

      {/* Grouped list */}
      {!isLoading && !error && assignments.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {grouped.map(({ label, items, accent }) => (
            <section key={label}>
              <div style={{ marginBottom: '1.25rem' }}>
                <p
                  style={{
                    margin: '0 0 0.625rem',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: accent ?? colors.textMuted,
                  }}
                >
                  {label}
                </p>
                <div style={{ height: '1px', background: colors.border }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {items.map((a) => (
                  <TeacherCard key={a.id} assignment={a} onClick={() => handleCardClick(a)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
