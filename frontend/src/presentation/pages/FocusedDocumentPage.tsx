import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { assignmentRepository } from '@infrastructure/repositories/assignmentRepository'
import { useComments } from '@application/hooks/useComments'
import { useTheme } from '@application/theme/useTheme'
import { useIsMobile } from '@application/hooks/useIsMobile'
import TipTapReadOnly from '@presentation/features/tiptap/TipTapReadOnly'
import StatusBadge from '@presentation/components/StatusBadge'
import type { Assignment, Comment, TipTapNode } from '@domain/models'

const EMPTY_DOC: TipTapNode = { type: 'doc', content: [{ type: 'paragraph' }] }

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)
  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface CommentItemProps {
  comment: Comment
  isHighlighted: boolean
  onClick: () => void
}

function CommentItem({ comment, isHighlighted, onClick }: CommentItemProps) {
  const colors = useTheme()

  return (
    <div
      onClick={onClick}
      style={{
        padding: '0.875rem',
        borderRadius: '0.5rem',
        background: isHighlighted ? colors.focusedSidebarActiveBg : 'transparent',
        border: `1px solid ${isHighlighted ? colors.focusedSidebarActiveOutline : colors.focusedSidebarBorder}`,
        cursor: 'pointer',
        transition: 'background 0.1s',
        marginBottom: '0.5rem',
      }}
    >
      {comment.selected_text && (
        <p
          style={{
            margin: '0 0 0.5rem',
            fontSize: '0.75rem',
            color: colors.focusedSidebarMuted,
            fontStyle: 'italic',
            borderLeft: `2px solid ${colors.primary}`,
            paddingLeft: '0.5rem',
            lineHeight: 1.4,
          }}
        >
          "{comment.selected_text}"
        </p>
      )}
      <p
        style={{
          margin: '0 0 0.5rem',
          fontSize: '0.8125rem',
          color: colors.focusedSidebarText,
          lineHeight: 1.5,
        }}
      >
        {comment.content}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.6875rem', color: colors.focusedSidebarMuted }}>
          {formatDate(comment.created_at)}
        </span>
        <span
          style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            padding: '0.0625rem 0.4375rem',
            borderRadius: '9999px',
            background:
              comment.status === 'RESOLVED'
                ? '#064e3b'
                : comment.status === 'REJECTED'
                ? '#450a0a'
                : '#451a03',
            color:
              comment.status === 'RESOLVED'
                ? '#6ee7b7'
                : comment.status === 'REJECTED'
                ? '#fca5a5'
                : '#fde68a',
          }}
        >
          {comment.status}
        </span>
      </div>
    </div>
  )
}

export default function FocusedDocumentPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const colors = useTheme()
  const isMobile = useIsMobile()

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [content, setContent] = useState<TipTapNode>(EMPTY_DOC)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile)

  const { comments, isLoading: commentsLoading } = useComments(id ?? '')

  const fetchAssignment = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const [data, versions] = await Promise.all([
        assignmentRepository.getById(id),
        assignmentRepository.getVersions(id),
      ])
      setAssignment(data)
      if (versions.length > 0) {
        setContent(versions[versions.length - 1].content)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignment')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchAssignment()
  }, [fetchAssignment])

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: colors.backgroundAlt,
          fontFamily: "'Geist', 'Inter', sans-serif",
          color: colors.textMuted,
        }}
      >
        Loading…
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: colors.backgroundAlt,
          fontFamily: "'Geist', 'Inter', sans-serif",
          gap: '1rem',
        }}
      >
        <p style={{ color: colors.error }}>{error}</p>
        <button
          onClick={fetchAssignment}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            background: colors.primary,
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  const openComments = comments.filter(c => c.status === 'OPEN').length

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        fontFamily: "'Geist', 'Inter', sans-serif",
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9 }}
        />
      )}

      {/* Dark sidebar — comment list (always dark) */}
      <div
        style={{
          ...(isMobile ? {
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: '80%',
            maxWidth: '320px',
            zIndex: 10,
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.25s ease',
            boxShadow: sidebarOpen ? `4px 0 16px rgba(0,0,0,0.3)` : 'none',
          } : {
            width: '300px',
            minWidth: '300px',
          }),
          background: colors.focusedSidebarBg,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          borderRight: `1px solid ${colors.focusedSidebarBorder}`,
        }}
      >
        {/* Sidebar header */}
        <div
          style={{
            padding: isMobile ? '0.75rem 1rem' : '1rem 1.25rem',
            borderBottom: `1px solid ${colors.focusedSidebarBorder}`,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
            <button
              onClick={() => navigate(`/assignments/${id}/review`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: colors.focusedSidebarMuted,
                fontSize: '0.8125rem',
                padding: 0,
                fontFamily: 'inherit',
              }}
            >
              ← Back to Review
            </button>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.focusedSidebarMuted, fontSize: '1.125rem', padding: '0.125rem', lineHeight: 1 }}
              >
                ✕
              </button>
            )}
          </div>
          <h2
            style={{
              margin: '0 0 0.25rem',
              fontSize: isMobile ? '0.875rem' : '0.9375rem',
              fontWeight: 700,
              color: colors.focusedSidebarText,
              fontFamily: "'Newsreader', Georgia, serif",
              lineHeight: 1.3,
            }}
          >
            {assignment?.title}
          </h2>
          {assignment && (
            <div style={{ marginTop: '0.375rem' }}>
              <StatusBadge status={assignment.status} size="sm" />
            </div>
          )}
        </div>

        {/* Comments count */}
        <div
          style={{
            padding: isMobile ? '0.5rem 1rem' : '0.75rem 1.25rem',
            borderBottom: `1px solid ${colors.focusedSidebarBorder}`,
            flexShrink: 0,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: '0.75rem',
              fontWeight: 600,
              color: colors.focusedSidebarMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Comments ({commentsLoading ? '…' : comments.length})
          </p>
        </div>

        {/* Comment list */}
        <div style={{ flex: 1, overflow: 'auto', padding: isMobile ? '0.5rem' : '0.75rem' }}>
          {commentsLoading && (
            <p style={{ color: colors.focusedSidebarMuted, fontSize: '0.8125rem', padding: '0.5rem', margin: 0 }}>
              Loading…
            </p>
          )}

          {!commentsLoading && comments.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💬</div>
              <p style={{ color: colors.focusedSidebarMuted, fontSize: '0.8125rem', margin: 0 }}>
                No comments yet
              </p>
            </div>
          )}

          {!commentsLoading &&
            comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                isHighlighted={highlightedCommentId === comment.id}
                onClick={() =>
                  setHighlightedCommentId(
                    highlightedCommentId === comment.id ? null : comment.id,
                  )
                }
              />
            ))}
        </div>
      </div>

      {/* Main document area */}
      <div
        style={{
          flex: 1,
          background: colors.backgroundAlt,
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Top bar */}
        <div
          style={{
            width: '100%',
            height: '52px',
            background: colors.surface,
            borderBottom: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '0 0.75rem' : '0 2rem',
            flexShrink: 0,
            boxSizing: 'border-box',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                title="Open comments"
                style={{
                  padding: '0.3125rem 0.5rem',
                  borderRadius: '0.5rem',
                  border: `1.5px solid ${colors.border}`,
                  background: colors.surface,
                  color: colors.text,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  position: 'relative',
                }}
              >
                💬
                {openComments > 0 && (
                  <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: colors.primary, color: '#fff', fontSize: '0.5625rem', fontWeight: 700, borderRadius: '9999px', minWidth: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                    {openComments}
                  </span>
                )}
              </button>
            )}
            <span
              style={{
                fontSize: '0.8125rem',
                color: colors.textMuted,
              }}
            >
              Focused View
            </span>
          </div>
          <button
            onClick={() => navigate(`/assignments/${id}/review`)}
            style={{
              padding: isMobile ? '0.3125rem 0.5rem' : '0.4375rem 0.875rem',
              borderRadius: '0.5rem',
              border: `1.5px solid ${colors.border}`,
              background: colors.surface,
              color: colors.text,
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {isMobile ? '←' : '← Back to Review'}
          </button>
        </div>

        {/* Document */}
        <div
          style={{
            width: '100%',
            maxWidth: '720px',
            padding: isMobile ? '1rem 0.75rem' : '3rem 2rem',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              background: colors.surface,
              borderRadius: '0.75rem',
              border: `1px solid ${colors.border}`,
              boxShadow: `0 4px 6px -1px ${colors.shadow}`,
              padding: isMobile ? '1.25rem' : '3rem',
              minHeight: isMobile ? '400px' : '600px',
            }}
          >
            {/* Document header */}
            <div
              style={{
                marginBottom: isMobile ? '1rem' : '2rem',
                paddingBottom: isMobile ? '1rem' : '1.5rem',
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <h1
                style={{
                  fontFamily: "'Cabinet Grotesk', 'Newsreader', Georgia, serif",
                  fontSize: isMobile ? '1.5rem' : '2rem',
                  fontWeight: 700,
                  color: colors.text,
                  margin: '0 0 0.5rem',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                {assignment?.title}
              </h1>
              {assignment && (
                <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '1rem', flexWrap: 'wrap' }}>
                  <p style={{ margin: 0, fontSize: isMobile ? '0.75rem' : '0.8125rem', color: colors.textMuted }}>
                    Last updated {formatDate(assignment.updated_at)}
                  </p>
                  <StatusBadge status={assignment.status} size="sm" />
                </div>
              )}
            </div>

            <div style={{ minHeight: isMobile ? '300px' : '400px', margin: isMobile ? '0 -1.25rem' : '0 -3rem' }}>
              <TipTapReadOnly
                content={content}
                comments={comments}
                focusedCommentId={highlightedCommentId}
                onCommentClick={(cid) => {
                  setHighlightedCommentId(cid === highlightedCommentId ? null : cid)
                  if (isMobile) setSidebarOpen(true)
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
