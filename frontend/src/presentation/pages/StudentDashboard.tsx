import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { assignmentRepository } from '@infrastructure/repositories/assignmentRepository'
import { userRepository } from '@infrastructure/repositories/userRepository'
import { useAssignmentStore } from '@application/store/assignmentStore'
import { useTheme } from '@application/theme/useTheme'
import type { Assignment, AssignmentStatus, TipTapNode } from '@domain/models'
import type { ThemeColors } from '@application/theme/themeTokens'

const STATUS_GROUPS: { status: AssignmentStatus; label: string; useAccent?: boolean }[] = [
  { status: 'REQUIRES_CHANGES', label: 'Returned for Revision', useAccent: true },
  { status: 'PENDING_REVIEW', label: 'Pending Review' },
  { status: 'IN_REVIEW', label: 'In Review' },
  { status: 'DRAFT', label: 'Drafts' },
  { status: 'APPROVED', label: 'Approved' },
]

function formatDate(dateStr: string): string {
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

function getBadgeStyle(status: AssignmentStatus, colors: ThemeColors): { bg: string; color: string; label: string } {
  const map: Record<AssignmentStatus, { bg: string; color: string; label: string }> = {
    REQUIRES_CHANGES: { bg: colors.statusRequiresChanges.bg, color: colors.statusRequiresChanges.text, label: 'Returned' },
    PENDING_REVIEW:   { bg: colors.statusPending.bg, color: colors.statusPending.text, label: 'Pending Review' },
    IN_REVIEW:        { bg: colors.statusInReview.bg, color: colors.statusInReview.text, label: 'In Review' },
    DRAFT:            { bg: colors.statusDraft.bg, color: colors.statusDraft.text, label: 'Draft' },
    APPROVED:         { bg: colors.statusApproved.bg, color: colors.statusApproved.text, label: 'Approved' },
  }
  return map[status]
}

interface AssignmentCardProps {
  assignment: Assignment
  onClick: () => void
  onDelete?: (id: string) => void
}

function StudentCard({ assignment, onClick, onDelete }: AssignmentCardProps) {
  const colors = useTheme()
  const isReturned = assignment.status === 'REQUIRES_CHANGES'
  const isDraft = assignment.status === 'DRAFT'
  const badge = getBadgeStyle(assignment.status, colors)

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
        <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: colors.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          &nbsp;
        </span>
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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.8125rem', color: colors.textMuted, display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          {isReturned ? `Modified ${formatDate(assignment.updated_at)}` : `Updated ${formatDate(assignment.updated_at)}`}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isReturned && (
            <span style={{ fontSize: '0.8125rem', color: colors.primary, fontWeight: 500 }}>
              View Comments →
            </span>
          )}
          {isDraft && onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(assignment.id) }}
              style={{ fontSize: '0.75rem', color: colors.error, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

interface NewAssignmentModalProps {
  onClose: () => void
  onCreated: () => void
}

function NewAssignmentModal({ onClose, onCreated }: NewAssignmentModalProps) {
  const colors = useTheme()
  const [title, setTitle] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [teachers, setTeachers] = useState<{ id: string; full_name: string }[]>([])
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    userRepository
      .listTeachers()
      .then((list) => {
        setTeachers(list)
        if (list.length > 0) setTeacherId(list[0].id)
      })
      .catch(() => setError('Could not load teachers'))
      .finally(() => setIsLoadingTeachers(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !teacherId) return
    setIsSubmitting(true)
    setError(null)
    try {
      const emptyDoc: TipTapNode = { type: 'doc', content: [{ type: 'paragraph' }] }
      await assignmentRepository.create({ teacher_id: teacherId, title: title.trim(), initial_content: emptyDoc })
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create assignment')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: colors.overlay,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        fontFamily: "'Geist', 'Inter', sans-serif",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: colors.surface,
          borderRadius: '0.75rem',
          border: `1px solid ${colors.border}`,
          boxShadow: `0 20px 40px ${colors.shadow}`,
          padding: '2rem',
          width: '100%',
          maxWidth: '460px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2
            style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: 700,
              color: colors.text,
              fontFamily: "'Newsreader', Georgia, serif",
            }}
          >
            New Assignment
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: colors.textMuted,
              fontSize: '1.25rem',
              padding: '0.25rem',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: colors.text,
                marginBottom: '0.375rem',
              }}
            >
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The Industrial Revolution — Essay"
              required
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                borderRadius: '0.5rem',
                border: `1.5px solid ${colors.border}`,
                fontSize: '0.9375rem',
                color: colors.text,
                background: colors.surface,
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: colors.text,
                marginBottom: '0.375rem',
              }}
            >
              Teacher
            </label>
            {isLoadingTeachers ? (
              <p style={{ color: colors.textMuted, fontSize: '0.875rem', margin: 0 }}>Loading teachers…</p>
            ) : (
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.625rem 0.875rem',
                  borderRadius: '0.5rem',
                  border: `1.5px solid ${colors.border}`,
                  fontSize: '0.9375rem',
                  color: colors.text,
                  background: colors.surface,
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                }}
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {error && (
            <div
              style={{
                background: colors.errorBg,
                border: `1px solid ${colors.errorBorder}`,
                borderRadius: '0.5rem',
                padding: '0.625rem 0.875rem',
                color: colors.error,
                fontSize: '0.875rem',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '0.5rem',
                border: `1.5px solid ${colors.border}`,
                background: colors.surface,
                color: colors.text,
                fontSize: '0.9375rem',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: isSubmitting || !title.trim() ? colors.primaryDisabled : colors.primary,
                color: '#fff',
                fontSize: '0.9375rem',
                fontWeight: 600,
                cursor: isSubmitting || !title.trim() ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {isSubmitting ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface StudentDashboardProps {
  assignments: Assignment[]
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export default function StudentDashboard({ assignments, isLoading, error, refetch }: StudentDashboardProps) {
  const navigate = useNavigate()
  const { removeAssignment } = useAssignmentStore()
  const [showNewModal, setShowNewModal] = useState(false)
  const colors = useTheme()

  function handleCardClick(assignment: Assignment) {
    navigate(`/assignments/${assignment.id}/edit`)
  }

  async function handleDelete(assignmentId: string) {
    try {
      await assignmentRepository.delete(assignmentId)
      removeAssignment(assignmentId)
    } catch {
      // silently ignore — refetch will correct state
      refetch()
    }
  }

  const grouped = STATUS_GROUPS.map(({ status, label, useAccent }) => ({
    label,
    accent: useAccent ? colors.primary : undefined,
    items: assignments.filter((a) => a.status === status),
  })).filter((g) => g.items.length > 0)

  return (
    <div
      style={{
        fontFamily: "'Geist', 'Inter', sans-serif",
        width: '100%',
      }}
    >
      <div
        className="dashboard-header"
        style={{
          marginBottom: '2.5rem',
        }}
      >
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
          Your Assignments
        </h1>

        <button
          onClick={() => setShowNewModal(true)}
          style={{
            padding: '0.625rem 1.25rem',
            borderRadius: '0.5rem',
            background: colors.buttonDark,
            color: colors.buttonDarkText,
            border: 'none',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: `0 2px 6px ${colors.shadow}`,
          }}
        >
          New Draft
        </button>
      </div>

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
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
          ))}
        </div>
      )}

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
            No assignments yet
          </h3>
          <p style={{ color: colors.textMuted, margin: '0 0 1.5rem', fontSize: '0.9375rem' }}>
            Start by creating your first assignment.
          </p>
          <button
            onClick={() => setShowNewModal(true)}
            style={{
              padding: '0.625rem 1.25rem',
              borderRadius: '0.5rem',
              background: colors.primary,
              color: '#fff',
              border: 'none',
              fontSize: '0.9375rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Create Assignment
          </button>
        </div>
      )}

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
                  <StudentCard key={a.id} assignment={a} onClick={() => handleCardClick(a)} onDelete={handleDelete} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {showNewModal && (
        <NewAssignmentModal
          onClose={() => setShowNewModal(false)}
          onCreated={refetch}
        />
      )}
    </div>
  )
}
