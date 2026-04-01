import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { assignmentRepository } from '@infrastructure/repositories/assignmentRepository'
import { commentRepository } from '@infrastructure/repositories/commentRepository'
import { useComments } from '@application/hooks/useComments'
import { useAssignmentStore } from '@application/store/assignmentStore'
import { useTheme } from '@application/theme/useTheme'
import { useIsMobile } from '@application/hooks/useIsMobile'
import TipTapReadOnly, { type TextSelection } from '@presentation/features/tiptap/TipTapReadOnly'
import DiffViewer from '@presentation/features/DiffViewer'
import StatusBadge from '@presentation/components/StatusBadge'
import type { Assignment, AssignmentVersion, Comment, CommentStatus, TipTapNode } from '@domain/models'

const EMPTY_DOC: TipTapNode = { type: 'doc', content: [{ type: 'paragraph' }] }

type Tab = 'review' | 'diff'

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const diffHours = Math.floor((Date.now() - date.getTime()) / 3_600_000)
  if (diffHours < 1) return 'Just now'
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffHours < 48) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ── Comment card in sidebar ───────────────────────────────────────────────────

function CommentCard({
  comment,
  replies,
  highlighted,
  onUpdateStatus,
  onEdit,
  onDelete,
  onReply,
  onClick,
  isReply,
  compact,
}: {
  comment: Comment
  replies?: Comment[]
  highlighted: boolean
  onUpdateStatus: (id: string, status: CommentStatus) => Promise<void>
  onEdit: (id: string, content: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onReply: (parentId: string, content: string) => Promise<void>
  onClick: () => void
  isReply?: boolean
  compact?: boolean
}) {
  const colors = useTheme()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [isReplying, setIsReplying] = useState(false)
  const [replyContent, setReplyContent] = useState('')

  async function handleStatus(status: CommentStatus) {
    setIsUpdating(true)
    try { await onUpdateStatus(comment.id, status) }
    finally { setIsUpdating(false) }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!editContent.trim()) return
    setIsUpdating(true)
    try {
      await onEdit(comment.id, editContent.trim())
      setIsEditing(false)
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!replyContent.trim()) return
    setIsUpdating(true)
    try {
      await onReply(comment.id, replyContent.trim())
      setReplyContent('')
      setIsReplying(false)
    } finally {
      setIsUpdating(false)
    }
  }

  const statusBg = comment.status === 'RESOLVED' ? colors.successBg : comment.status === 'REJECTED' ? colors.dangerBg : colors.warningBg
  const statusColor = comment.status === 'RESOLVED' ? colors.successText : comment.status === 'REJECTED' ? colors.dangerText : colors.warningText

  return (
    <div style={{ marginBottom: isReply ? 0 : '0.5rem' }}>
      <div
        onClick={onClick}
        style={{
          background: highlighted ? colors.highlight : colors.surface,
          borderRadius: '8px',
          border: `1px solid ${highlighted ? colors.highlightBorder : colors.border}`,
          padding: '0.75rem',
          cursor: 'pointer',
          transition: 'border-color 0.15s, background 0.15s',
          marginLeft: isReply ? '1rem' : 0,
          borderLeft: isReply ? `3px solid ${colors.border}` : undefined,
        }}
      >
        {!isReply && comment.selected_text && (
          <blockquote style={{ margin: '0 0 0.5rem', padding: '0.25rem 0.625rem', borderLeft: `3px solid ${colors.primary}`, background: colors.primaryLight, borderRadius: '0 4px 4px 0', fontSize: '0.8125rem', color: colors.text, fontStyle: 'italic' }}>
            "{comment.selected_text}"
          </blockquote>
        )}

        {isEditing ? (
          <form onSubmit={handleEdit} onClick={(e) => e.stopPropagation()} style={{ marginBottom: '0.5rem' }}>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              autoFocus
              style={{ width: '100%', padding: '0.375rem 0.5rem', borderRadius: '6px', border: `1.5px solid ${colors.primary}`, fontSize: '0.8125rem', fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box', background: colors.surface, color: colors.text }}
            />
            <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.375rem' }}>
              <button type="submit" disabled={isUpdating || !editContent.trim()} style={{ padding: '2px 8px', borderRadius: '4px', border: 'none', background: colors.primary, color: '#fff', fontSize: '0.6875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
              <button type="button" onClick={(e) => { e.stopPropagation(); setIsEditing(false); setEditContent(comment.content) }} style={{ padding: '2px 8px', borderRadius: '4px', border: `1px solid ${colors.border}`, background: colors.surface, color: colors.textMuted, fontSize: '0.6875rem', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            </div>
          </form>
        ) : (
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: colors.text, lineHeight: 1.5 }}>
            {comment.content}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.375rem' }}>
          <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>{formatDate(comment.created_at)}</span>
          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '1px 6px', borderRadius: '9999px', background: statusBg, color: statusColor }}>
              {comment.status}
            </span>
            {comment.status === 'OPEN' && (
              <>
                <button onClick={(e) => { e.stopPropagation(); handleStatus('RESOLVED') }} disabled={isUpdating} style={{ padding: '1px 6px', borderRadius: '4px', border: `1px solid ${colors.border}`, background: colors.surface, color: colors.successText, fontSize: '0.6875rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', opacity: isUpdating ? 0.5 : 1 }}>
                  ✓
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleStatus('REJECTED') }} disabled={isUpdating} style={{ padding: '1px 6px', borderRadius: '4px', border: `1px solid ${colors.border}`, background: colors.surface, color: colors.dangerText, fontSize: '0.6875rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', opacity: isUpdating ? 0.5 : 1 }}>
                  ✕
                </button>
              </>
            )}
            {!isReply && (
              <button onClick={(e) => { e.stopPropagation(); setIsReplying((v) => !v) }} title="Reply" style={{ padding: '1px 6px', borderRadius: '4px', border: `1px solid ${colors.border}`, background: colors.surface, color: colors.textMuted, fontSize: '0.6875rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                {compact ? '↩' : '↩ Reply'}
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); setIsEditing(true) }} title="Edit" style={{ padding: '1px 6px', borderRadius: '4px', border: `1px solid ${colors.border}`, background: colors.surface, color: colors.textMuted, fontSize: '0.6875rem', cursor: 'pointer', fontFamily: 'inherit' }}>
              {compact ? '✎' : 'Edit'}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(comment.id) }}
              disabled={isUpdating}
              title="Delete"
              style={{ padding: '1px 6px', borderRadius: '4px', border: `1px solid ${colors.errorBorder}`, background: colors.errorBg, color: colors.dangerText, fontSize: '0.6875rem', cursor: 'pointer', fontFamily: 'inherit', opacity: isUpdating ? 0.5 : 1 }}
            >
              {compact ? '✕' : 'Delete'}
            </button>
          </div>
        </div>

        {/* Reply form */}
        {isReplying && (
          <form onSubmit={handleReply} onClick={(e) => e.stopPropagation()} style={{ marginTop: '0.5rem', borderTop: `1px solid ${colors.border}`, paddingTop: '0.5rem' }}>
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply…"
              rows={2}
              autoFocus
              style={{ width: '100%', padding: '0.375rem 0.5rem', borderRadius: '6px', border: `1.5px solid ${colors.border}`, fontSize: '0.8125rem', fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box', background: colors.surface, color: colors.text }}
            />
            <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.375rem' }}>
              <button type="submit" disabled={isUpdating || !replyContent.trim()} style={{ padding: '2px 8px', borderRadius: '4px', border: 'none', background: colors.primary, color: '#fff', fontSize: '0.6875rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Reply</button>
              <button type="button" onClick={(e) => { e.stopPropagation(); setIsReplying(false); setReplyContent('') }} style={{ padding: '2px 8px', borderRadius: '4px', border: `1px solid ${colors.border}`, background: colors.surface, color: colors.textMuted, fontSize: '0.6875rem', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            </div>
          </form>
        )}
      </div>

      {/* Replies */}
      {replies && replies.length > 0 && (
        <div style={{ marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              highlighted={false}
              onUpdateStatus={onUpdateStatus}
              onEdit={onEdit}
              onDelete={onDelete}
              onReply={onReply}
              onClick={() => { }}
              isReply
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Add comment form ──────────────────────────────────────────────────────────

function AddCommentForm({
  assignmentId,
  selection,
  onCreated,
  onClear,
}: {
  assignmentId: string
  selection: TextSelection | null
  onCreated: (comment: Comment) => void
  onClear: () => void
}) {
  const colors = useTheme()
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-fill selected text from editor selection
  const selectedText = selection?.text ?? ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || !selectedText) return
    setIsSubmitting(true)
    setError(null)
    try {
      const comment = await commentRepository.create(assignmentId, {
        tiptap_node_id: crypto.randomUUID(),
        selected_text: selectedText,
        content: content.trim(),
      })
      onCreated(comment)
      setContent('')
      onClear()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ borderTop: `1px solid ${colors.border}`, padding: '0.75rem', background: colors.surface }}>
      <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', fontWeight: 600, color: colors.text }}>
        Add Comment
      </p>

      {selectedText ? (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.375rem', marginBottom: '0.5rem' }}>
          <blockquote style={{ flex: 1, margin: 0, padding: '0.25rem 0.5rem', borderLeft: `3px solid ${colors.primary}`, background: colors.primaryLight, borderRadius: '0 4px 4px 0', fontSize: '0.75rem', color: colors.text, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            "{selectedText}"
          </blockquote>
          <button type="button" onClick={onClear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, fontSize: '0.875rem', padding: '0 2px', lineHeight: 1 }}>×</button>
        </div>
      ) : (
        <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: colors.textMuted, fontStyle: 'italic' }}>
          Select text in the document to anchor a comment.
        </p>
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your feedback…"
        rows={3}
        disabled={!selectedText}
        style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: `1.5px solid ${colors.border}`, fontSize: '0.8125rem', color: colors.text, resize: 'vertical', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: selectedText ? colors.surface : colors.backgroundAlt, cursor: selectedText ? 'text' : 'not-allowed' }}
      />

      {error && <p style={{ margin: '0.375rem 0 0', fontSize: '0.75rem', color: colors.error }}>{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting || !content.trim() || !selectedText}
        style={{ marginTop: '0.5rem', width: '100%', padding: '0.5rem', borderRadius: '6px', border: 'none', background: colors.primary, color: '#fff', fontSize: '0.8125rem', fontWeight: 600, cursor: isSubmitting || !content.trim() || !selectedText ? 'not-allowed' : 'pointer', opacity: isSubmitting || !content.trim() || !selectedText ? 0.5 : 1, fontFamily: 'inherit' }}
      >
        {isSubmitting ? 'Adding…' : 'Add Comment'}
      </button>
    </form>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AssignmentReviewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { updateAssignment } = useAssignmentStore()
  const colors = useTheme()
  const isMobile = useIsMobile()

  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [docContent, setDocContent] = useState<TipTapNode>(EMPTY_DOC)
  const [versions, setVersions] = useState<AssignmentVersion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('review')
  const [textSelection, setTextSelection] = useState<TextSelection | null>(null)
  const [focusedCommentId, setFocusedCommentId] = useState<string | null>(null)
  const [commentsPanelOpen, setCommentsPanelOpen] = useState(false)

  const { comments, isLoading: commentsLoading, addComment: addCommentToStore, changeCommentStatus, editCommentContent, deleteComment } = useComments(id ?? '')

  const fetchAssignment = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const [data, vers] = await Promise.all([
        assignmentRepository.getById(id),
        assignmentRepository.getVersions(id),
      ])
      setVersions(vers)

      // Load latest version content
      if (vers.length > 0) {
        setDocContent(vers[vers.length - 1].content)
      }

      // Auto-start review when PENDING_REVIEW
      if (data.status === 'PENDING_REVIEW') {
        try {
          const started = await assignmentRepository.startReview(id)
          setAssignment(started)
          updateAssignment(started)
        } catch {
          setAssignment(data)
        }
      } else {
        setAssignment(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignment')
    } finally {
      setIsLoading(false)
    }
  }, [id, updateAssignment])

  useEffect(() => { fetchAssignment() }, [fetchAssignment])

  async function handleFinalize(decision: 'APPROVE' | 'REQUEST_CHANGES') {
    if (!id) return
    setIsFinalizing(true)
    setError(null)
    try {
      const updated = await assignmentRepository.finalizeReview(id, decision)
      setAssignment(updated)
      updateAssignment(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to finalize review')
    } finally {
      setIsFinalizing(false)
    }
  }

  function handleCommentCreated(comment: Comment) {
    addCommentToStore(comment)
    setFocusedCommentId(comment.id)
  }

  async function handleReply(parentId: string, content: string) {
    const reply = await commentRepository.create(id ?? '', {
      tiptap_node_id: crypto.randomUUID(),
      selected_text: '',
      content,
      parent_id: parentId,
    })
    addCommentToStore(reply)
  }

  // Group comments: top-level + their replies
  const topLevelComments = comments.filter((c) => c.parent_id === null)
  const repliesByParent = comments.reduce<Record<string, Comment[]>>((acc, c) => {
    if (c.parent_id) {
      acc[c.parent_id] = [...(acc[c.parent_id] ?? []), c]
    }
    return acc
  }, {})

  const canFinalize = assignment?.status === 'IN_REVIEW'
  const isFinalized = assignment?.status === 'APPROVED' || assignment?.status === 'REQUIRES_CHANGES'

  // ── Loading / Error ──
  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 56px)', background: colors.background, color: colors.textMuted, fontFamily: "'Geist', 'Inter', sans-serif" }}>
        Loading…
      </div>
    )
  }
  if (error && !assignment) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 56px)', gap: '1rem', fontFamily: "'Geist', 'Inter', sans-serif" }}>
        <p style={{ color: colors.error }}>{error}</p>
        <button onClick={fetchAssignment} style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: colors.primary, color: '#fff', border: 'none', cursor: 'pointer' }}>Retry</button>
      </div>
    )
  }

  const openComments = comments.filter(c => c.status === 'OPEN').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 56px)', background: colors.background, fontFamily: "'Geist', 'Inter', sans-serif", overflow: 'hidden', width: isMobile ? '100%' : '80%', margin: 'auto' }}>

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
          {error && !isMobile && <span style={{ fontSize: '0.8125rem', color: colors.error }}>{error}</span>}

          {/* Tab toggle */}
          {versions.length >= 2 && (
            <div style={{ display: 'flex', background: colors.backgroundAlt, borderRadius: '8px', padding: '2px', gap: '2px' }}>
              {(['review', 'diff'] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  title={tab === 'review' ? 'Review' : 'Diff'}
                  style={{ padding: isMobile ? '0.3125rem 0.5rem' : '0.3125rem 0.75rem', borderRadius: '6px', border: 'none', background: activeTab === tab ? colors.surface : 'transparent', color: activeTab === tab ? colors.text : colors.textMuted, fontSize: '0.8125rem', fontWeight: activeTab === tab ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', boxShadow: activeTab === tab ? `0 1px 3px ${colors.shadow}` : 'none', transition: 'all 0.1s' }}
                >
                  {isMobile ? (tab === 'review' ? '📄' : '⊕') : (tab === 'review' ? '📄 Review' : '⊕ Diff')}
                </button>
              ))}
            </div>
          )}

          {/* Comments panel toggle (mobile only) */}
          {isMobile && activeTab === 'review' && (
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

          <button
            onClick={() => navigate(`/assignments/${id}/focused`)}
            title="Open focused view"
            style={{ padding: isMobile ? '0.3125rem 0.5rem' : '0.4375rem 0.75rem', borderRadius: '8px', border: `1.5px solid ${colors.border}`, background: colors.surface, color: colors.text, fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {isMobile ? '⛶' : '⛶ Focus'}
          </button>

          {canFinalize && (
            <>
              <button
                onClick={() => handleFinalize('REQUEST_CHANGES')}
                disabled={isFinalizing}
                title="Request Changes"
                style={{ padding: isMobile ? '0.3125rem 0.5rem' : '0.4375rem 0.875rem', borderRadius: '8px', border: `1.5px solid ${colors.border}`, background: colors.surface, color: colors.dangerText, fontSize: '0.8125rem', fontWeight: 600, cursor: isFinalizing ? 'not-allowed' : 'pointer', opacity: isFinalizing ? 0.6 : 1, fontFamily: 'inherit' }}
              >
                {isMobile ? '↩' : 'Request Changes'}
              </button>
              <button
                onClick={() => handleFinalize('APPROVE')}
                disabled={isFinalizing}
                title="Approve"
                style={{ padding: isMobile ? '0.3125rem 0.5rem' : '0.4375rem 0.875rem', borderRadius: '8px', border: 'none', background: colors.success, color: '#fff', fontSize: '0.8125rem', fontWeight: 600, cursor: isFinalizing ? 'not-allowed' : 'pointer', opacity: isFinalizing ? 0.6 : 1, fontFamily: 'inherit' }}
              >
                {isMobile ? '✓' : (isFinalizing ? 'Saving…' : '✓ Approve')}
              </button>
            </>
          )}

          {isFinalized && (
            <span style={{ fontSize: isMobile ? '0.75rem' : '0.8125rem', color: colors.textMuted, fontStyle: 'italic' }}>
              {assignment?.status === 'APPROVED' ? '✓ Approved' : 'Changes requested'}
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      {activeTab === 'diff' ? (
        // ── Diff tab ──
        <div style={{ flex: 1, overflowY: 'auto', background: colors.surface }}>
          <DiffViewer versions={versions} />
        </div>
      ) : (
        // ── Review tab: document + comments panel ──
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

          {/* Document pane */}
          <div style={{ flex: 1, overflow: 'auto', minWidth: 0, background: colors.surface }}>
            <style>{`.review-doc-pane .tiptap-readonly .ProseMirror { padding-left: 1.25rem; padding-right: 1.25rem; }`}</style>
            <div className="review-doc-pane">
              <TipTapReadOnly
                content={docContent}
                comments={comments}
                focusedCommentId={focusedCommentId}
                onTextSelect={setTextSelection}
                onCommentClick={(commentId) => {
                  setFocusedCommentId(commentId === focusedCommentId ? null : commentId)
                  if (isMobile) setCommentsPanelOpen(true)
                }}
              />
            </div>
          </div>

          {/* Mobile backdrop */}
          {isMobile && commentsPanelOpen && (
            <div
              onClick={() => setCommentsPanelOpen(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 9 }}
            />
          )}

          {/* Comments sidebar / panel */}
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
              width: '320px',
              minWidth: '320px',
            }),
            background: colors.sidebarBg,
            borderLeft: `1px solid ${colors.border}`,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Header */}
            <div style={{ padding: '0.75rem 1rem', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 1, background: colors.sidebarBg }}>
              <h2 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: colors.text }}>Comments</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {topLevelComments.length > 0 && (
                  <span style={{ fontSize: '0.75rem', color: colors.textMuted }}>
                    {openComments} open
                  </span>
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

            {/* Comment list */}
            <div style={{ padding: '0.75rem', flex: 1, overflowY: 'auto' }}>
              {commentsLoading ? (
                <p style={{ color: colors.textMuted, fontSize: '0.875rem', textAlign: 'center', margin: '2rem 0' }}>Loading…</p>
              ) : topLevelComments.length === 0 ? (
                <p style={{ color: colors.textMuted, fontSize: '0.875rem', textAlign: 'center', margin: '2rem 0', lineHeight: 1.6 }}>
                  No comments yet.{'\n'}
                  Select text in the document and add a comment below.
                </p>
              ) : (
                topLevelComments.map((c) => (
                  <CommentCard
                    key={c.id}
                    comment={c}
                    replies={repliesByParent[c.id]}
                    highlighted={focusedCommentId === c.id}
                    onUpdateStatus={changeCommentStatus}
                    onEdit={editCommentContent}
                    onDelete={deleteComment}
                    onReply={handleReply}
                    onClick={() => setFocusedCommentId(c.id === focusedCommentId ? null : c.id)}
                    compact={isMobile}
                  />
                ))
              )}
            </div>

            {/* Add comment form — only while in review */}
            {(canFinalize || assignment?.status === 'IN_REVIEW') && (
              <AddCommentForm
                assignmentId={id ?? ''}
                selection={textSelection}
                onCreated={handleCommentCreated}
                onClear={() => setTextSelection(null)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
