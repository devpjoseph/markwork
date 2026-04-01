import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { assignmentRepository } from '@infrastructure/repositories/assignmentRepository'
import { submitAssignment } from '@application/use_cases/submitAssignment'
import { useComments } from '@application/hooks/useComments'
import { useTheme } from '@application/theme/useTheme'
import { useIsMobile } from '@application/hooks/useIsMobile'
import TipTapEditor from '@presentation/features/tiptap/TipTapEditor'
import StatusBadge from '@presentation/components/StatusBadge'
import type { Assignment, Comment, TipTapNode } from '@domain/models'

const EMPTY_DOC: TipTapNode = { type: 'doc', content: [{ type: 'paragraph' }] }

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffHours < 48) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Comment sidebar ───────────────────────────────────────────────────────────

function CommentItem({
  comment,
  highlighted,
  onClick,
}: {
  comment: Comment
  highlighted: boolean
  onClick: () => void
}) {
  const colors = useTheme()

  return (
    <div
      onClick={onClick}
      style={{
        background: highlighted ? colors.highlight : colors.surface,
        borderRadius: '8px',
        border: `1px solid ${highlighted ? colors.highlightBorder : colors.border}`,
        padding: '0.75rem',
        cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s',
        marginBottom: '0.5rem',
      }}
    >
      {comment.selected_text && (
        <blockquote
          style={{
            margin: '0 0 0.5rem',
            padding: '0.25rem 0.625rem',
            borderLeft: `3px solid ${colors.primary}`,
            background: colors.primaryLight,
            borderRadius: '0 4px 4px 0',
            fontSize: '0.8125rem',
            color: colors.text,
            fontStyle: 'italic',
          }}
        >
          "{comment.selected_text}"
        </blockquote>
      )}
      <p style={{ margin: '0 0 0.375rem', fontSize: '0.875rem', color: colors.text, lineHeight: 1.5 }}>
        {comment.content}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>{formatDate(comment.created_at)}</span>
        <span
          style={{
            fontSize: '0.6875rem',
            fontWeight: 600,
            padding: '1px 6px',
            borderRadius: '9999px',
            background: comment.status === 'OPEN' ? colors.warningBg : comment.status === 'RESOLVED' ? colors.successBg : colors.dangerBg,
            color: comment.status === 'OPEN' ? colors.warningText : comment.status === 'RESOLVED' ? colors.successText : colors.dangerText,
          }}
        >
          {comment.status}
        </span>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AssignmentEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const colors = useTheme()
  const isMobile = useIsMobile()

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [focusedCommentId, setFocusedCommentId] = useState<string | null>(null)
  const [commentsPanelOpen, setCommentsPanelOpen] = useState(false)

  // Live editor content tracked via ref (avoids stale closure in save handler)
  const editorContentRef = useRef<TipTapNode>(EMPTY_DOC)
  const [initialContent, setInitialContent] = useState<TipTapNode>(EMPTY_DOC)

  const { comments, isLoading: commentsLoading } = useComments(id ?? '')

  const fetchAssignment = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await assignmentRepository.getById(id)
      setAssignment(data)
      // Load latest version content
      const versions = await assignmentRepository.getVersions(id)
      if (versions.length > 0) {
        const latest = versions[versions.length - 1]
        setInitialContent(latest.content)
        editorContentRef.current = latest.content
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignment')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => { fetchAssignment() }, [fetchAssignment])

  async function handleSaveDraft() {
    if (!id) return
    setIsSaving(true)
    setSaveSuccess(false)
    setError(null)
    try {
      const updated = await assignmentRepository.update(id, { content: editorContentRef.current })
      setAssignment(updated)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSubmit() {
    if (!id) return
    setIsSubmitting(true)
    setError(null)
    try {
      await submitAssignment(id)
      await fetchAssignment()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canEdit = assignment?.status === 'DRAFT' || assignment?.status === 'REQUIRES_CHANGES'
  const canSubmit = canEdit

  // ── Loading ──
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 56px)', background: colors.backgroundAlt, color: colors.textMuted, fontFamily: "'Geist', 'Inter', sans-serif" }}>
        Loading assignment…
      </div>
    )
  }

  if (error && !assignment) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 56px)', background: colors.backgroundAlt, fontFamily: "'Geist', 'Inter', sans-serif", gap: '1rem' }}>
        <p style={{ color: colors.error }}>{error}</p>
        <button onClick={fetchAssignment} style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: colors.primary, color: '#fff', border: 'none', cursor: 'pointer' }}>Retry</button>
      </div>
    )
  }

  const openComments = comments.filter(c => c.status === 'OPEN').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)', background: colors.backgroundAlt, fontFamily: "'Geist', 'Inter', sans-serif", overflow: 'hidden' }}>

      {/* Toolbar */}
      <div style={{ minHeight: '52px', background: colors.surface, borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '0 0.75rem' : '0 1.25rem', flexShrink: 0, gap: isMobile ? '0.375rem' : '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.375rem' : '0.75rem', minWidth: 0 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, fontSize: '1.125rem', padding: '0.25rem', lineHeight: 1 }}>←</button>
          {!isMobile && (
            <h1 style={{ margin: 0, fontSize: '0.9375rem', fontWeight: 600, color: colors.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '320px', fontFamily: "'Newsreader', Georgia, serif" }}>
              {assignment?.title ?? 'Assignment'}
            </h1>
          )}
          {assignment && <StatusBadge status={assignment.status} size="sm" />}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.375rem' : '0.625rem', flexShrink: 0 }}>
          {saveSuccess && <span style={{ fontSize: isMobile ? '0.75rem' : '0.8125rem', color: colors.success, fontWeight: 500 }}>✓</span>}
          {error && !isMobile && <span style={{ fontSize: '0.8125rem', color: colors.error }}>{error}</span>}

          {/* Comments toggle (mobile) */}
          {isMobile && (
            <button
              onClick={() => setCommentsPanelOpen((v) => !v)}
              title="Toggle comments"
              style={{ padding: '0.3125rem 0.5rem', borderRadius: '8px', border: `1.5px solid ${commentsPanelOpen ? colors.primary : colors.border}`, background: commentsPanelOpen ? colors.primaryLight : colors.surface, color: commentsPanelOpen ? colors.primary : colors.text, fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'inherit', position: 'relative' }}
            >
              💬
              {openComments > 0 && (
                <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: colors.primary, color: '#fff', fontSize: '0.5625rem', fontWeight: 700, borderRadius: '9999px', minWidth: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                  {openComments}
                </span>
              )}
            </button>
          )}

          {canEdit && (
            <button
              onClick={handleSaveDraft}
              disabled={isSaving}
              title="Save Draft"
              style={{ padding: isMobile ? '0.3125rem 0.5rem' : '0.4375rem 0.875rem', borderRadius: '8px', border: `1.5px solid ${colors.border}`, background: colors.surface, color: colors.text, fontSize: '0.8125rem', fontWeight: 500, cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.6 : 1, fontFamily: 'inherit' }}
            >
              {isMobile ? (isSaving ? '…' : '💾') : (isSaving ? 'Saving…' : 'Save Draft')}
            </button>
          )}

          {canSubmit && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              title="Submit for Review"
              style={{ padding: isMobile ? '0.3125rem 0.5rem' : '0.4375rem 0.875rem', borderRadius: '8px', border: 'none', background: colors.primary, color: '#fff', fontSize: '0.8125rem', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.6 : 1, fontFamily: 'inherit' }}
            >
              {isMobile ? (isSubmitting ? '…' : '📤') : (isSubmitting ? 'Submitting…' : 'Submit for Review')}
            </button>
          )}

          {!canEdit && assignment && (
            <span style={{ fontSize: isMobile ? '0.75rem' : '0.8125rem', color: colors.textMuted, fontStyle: 'italic' }}>
              {assignment.status === 'APPROVED' ? '✓ Approved' : 'Read only'}
            </span>
          )}
        </div>
      </div>

      {/* Body: editor + comments */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* Editor pane */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: isMobile ? '0.5rem' : '1rem', overflow: 'hidden' }}>
          <TipTapEditor
            content={initialContent}
            comments={comments}
            editable={canEdit}
            onChange={(content) => { editorContentRef.current = content }}
            onCommentClick={(commentId) => {
              setFocusedCommentId(commentId)
              if (isMobile) setCommentsPanelOpen(true)
            }}
          />
        </div>

        {/* Mobile backdrop */}
        {isMobile && commentsPanelOpen && (
          <div
            onClick={() => setCommentsPanelOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 9 }}
          />
        )}

        {/* Comments panel */}
        <div style={{
          ...(isMobile ? {
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '85%',
            maxWidth: '360px',
            zIndex: 10,
            transform: commentsPanelOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.25s ease',
            boxShadow: commentsPanelOpen ? `-4px 0 16px ${colors.shadow}` : 'none',
          } : {
            width: '300px',
            minWidth: '300px',
          }),
          background: colors.sidebarBg,
          borderLeft: `1px solid ${colors.border}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: colors.text }}>
              Teacher Comments
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {comments.length > 0 && (
                <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>{openComments} open</span>
              )}
              {isMobile && (
                <button
                  onClick={() => setCommentsPanelOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, fontSize: '1.125rem', padding: '0.125rem', lineHeight: 1 }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
            {commentsLoading ? (
              <p style={{ color: colors.textMuted, fontSize: '0.875rem', textAlign: 'center', margin: '2rem 0' }}>Loading…</p>
            ) : comments.length === 0 ? (
              <p style={{ color: colors.textMuted, fontSize: '0.875rem', textAlign: 'center', margin: '2rem 0', lineHeight: 1.5 }}>
                No comments yet.{'\n'}
                {assignment?.status === 'DRAFT' && 'Submit your assignment to receive feedback.'}
              </p>
            ) : (
              comments.map((c) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  highlighted={focusedCommentId === c.id}
                  onClick={() => setFocusedCommentId(c.id === focusedCommentId ? null : c.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
