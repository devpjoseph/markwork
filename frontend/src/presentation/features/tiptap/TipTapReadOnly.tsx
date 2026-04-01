import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import { useEffect, useRef } from 'react'
import {
  CommentHighlightExtension,
  refreshCommentDecorations,
} from './CommentExtension'
import { useTheme } from '@application/theme/useTheme'
import type { ThemeColors } from '@application/theme/themeTokens'
import type { Comment, TipTapNode } from '@domain/models'

export interface TextSelection {
  text: string
  from: number
  to: number
}

export interface TipTapReadOnlyProps {
  content: TipTapNode
  comments?: Comment[]
  onTextSelect?: (selection: TextSelection | null) => void
  onCommentClick?: (commentId: string) => void
  /** ID of the comment to visually focus (scroll into view, ring highlight) */
  focusedCommentId?: string | null
}

function getReadOnlyCSS(c: ThemeColors): string {
  return `
.tiptap-readonly .ProseMirror {
  outline: none;
  padding: 2rem 2.5rem;
  font-family: 'Newsreader', Georgia, serif;
  font-size: 1.0625rem;
  line-height: 1.8;
  color: ${c.editorText};
  user-select: text;
  -webkit-user-select: text;
}
.tiptap-readonly .ProseMirror h1 { font-size: 1.75rem; font-weight: 700; margin: 1.5rem 0 0.75rem; letter-spacing: -0.02em; }
.tiptap-readonly .ProseMirror h2 { font-size: 1.375rem; font-weight: 700; margin: 1.25rem 0 0.625rem; }
.tiptap-readonly .ProseMirror h3 { font-size: 1.125rem; font-weight: 600; margin: 1rem 0 0.5rem; }
.tiptap-readonly .ProseMirror p { margin: 0 0 0.75rem; }
.tiptap-readonly .ProseMirror ul, .tiptap-readonly .ProseMirror ol { padding-left: 1.5rem; margin: 0 0 0.75rem; }
.tiptap-readonly .ProseMirror li { margin: 0.25rem 0; }
.tiptap-readonly .ProseMirror blockquote { border-left: 3px solid ${c.primary}; padding-left: 1rem; margin: 1rem 0; color: ${c.editorBlockquote}; font-style: italic; }
.tiptap-readonly .ProseMirror code { background: ${c.editorCodeBg}; border-radius: 4px; padding: 1px 5px; font-size: 0.875em; font-family: 'JetBrains Mono', monospace; }
.tiptap-readonly .ProseMirror pre { background: ${c.editorPreBg}; color: ${c.editorPreText}; border-radius: 8px; padding: 1rem; overflow-x: auto; margin: 1rem 0; }
.tiptap-readonly .ProseMirror pre code { background: none; padding: 0; color: inherit; }
.tiptap-readonly .ProseMirror ::selection { background: ${c.editorSelection}; }
.tiptap-readonly .ProseMirror .tiptap-comment-highlight { transition: background-color 0.15s; }
.tiptap-readonly .ProseMirror .tiptap-comment-highlight:hover { background-color: var(--comment-highlight-hover, ${c.commentHighlightHover}) !important; }
.tiptap-readonly .ProseMirror .tiptap-comment-focused { background-color: ${c.commentHighlightBorder} !important; border-bottom-color: ${c.highlightBorder} !important; box-shadow: 0 0 0 2px ${c.commentHighlightBg}; border-radius: 3px; }
`
}

export default function TipTapReadOnly({
  content,
  comments = [],
  onTextSelect,
  onCommentClick,
  focusedCommentId,
}: TipTapReadOnlyProps) {
  const commentsRef = useRef<Comment[]>(comments)
  const containerRef = useRef<HTMLDivElement>(null)
  const colors = useTheme()

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      CommentHighlightExtension.configure({
        getComments: () => commentsRef.current,
      }),
    ],
    content,
    editable: false,
    onSelectionUpdate({ editor: ed }) {
      if (!onTextSelect) return
      const { from, to } = ed.state.selection
      if (from === to) {
        onTextSelect(null)
        return
      }
      const text = ed.state.doc.textBetween(from, to, ' ')
      if (text.trim()) {
        onTextSelect({ text: text.trim(), from, to })
      } else {
        onTextSelect(null)
      }
    },
  })

  // Sync comments → refresh decorations
  useEffect(() => {
    commentsRef.current = comments
    if (editor && !editor.isDestroyed) {
      refreshCommentDecorations(editor.view)
    }
  }, [editor, comments])

  // Sync content externally
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const currentJson = JSON.stringify(editor.getJSON())
    const newJson = JSON.stringify(content)
    if (currentJson !== newJson) {
      editor.commands.setContent(content, false)
    }
  }, [editor, content])

  // Forward comment-click
  useEffect(() => {
    if (!editor || !onCommentClick) return
    const el = editor.view.dom
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { commentId: string }
      onCommentClick(detail.commentId)
    }
    el.addEventListener('markwork:comment-click', handler)
    return () => el.removeEventListener('markwork:comment-click', handler)
  }, [editor, onCommentClick])

  // Scroll focused comment highlight into view
  useEffect(() => {
    if (!focusedCommentId || !containerRef.current) return
    const el = containerRef.current.querySelector(
      `[data-comment-id="${focusedCommentId}"]`
    ) as HTMLElement | null
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // Temporarily add focused class
    if (el) {
      el.classList.add('tiptap-comment-focused')
      const timer = setTimeout(() => el.classList.remove('tiptap-comment-focused'), 1500)
      return () => clearTimeout(timer)
    }
  }, [focusedCommentId])

  return (
    <div
      ref={containerRef}
      className="tiptap-readonly"
      style={{
        background: colors.editorBg,
        // CSS custom properties for ProseMirror decorations
        '--comment-highlight-bg': colors.commentHighlightBg,
        '--comment-highlight-border': colors.commentHighlightBorder,
        '--comment-highlight-hover': colors.commentHighlightHover,
      } as React.CSSProperties}
    >
      <style>{getReadOnlyCSS(colors)}</style>
      <EditorContent editor={editor} />
    </div>
  )
}
