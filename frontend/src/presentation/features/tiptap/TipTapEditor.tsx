import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect, useRef } from 'react'
import {
  CommentHighlightExtension,
  refreshCommentDecorations,
} from './CommentExtension'
import { useTheme } from '@application/theme/useTheme'
import type { ThemeColors } from '@application/theme/themeTokens'
import type { Comment, TipTapNode } from '@domain/models'

// ── Toolbar ───────────────────────────────────────────────────────────────────

interface ToolbarButtonProps {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}

function ToolbarButton({ onClick, active, title, children }: ToolbarButtonProps) {
  const colors = useTheme()

  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault() // keep editor focus
        onClick()
      }}
      title={title}
      style={{
        width: '28px',
        height: '28px',
        borderRadius: '5px',
        border: 'none',
        background: active ? colors.toolbarActiveBg : 'transparent',
        color: active ? colors.toolbarActiveText : colors.toolbarText,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.8125rem',
        fontWeight: 600,
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  )
}

function Divider() {
  const colors = useTheme()

  return (
    <div
      style={{ width: '1px', height: '18px', background: colors.toolbarDivider, margin: '0 4px', flexShrink: 0 }}
    />
  )
}

function Toolbar({ editor }: { editor: Editor | null }) {
  const colors = useTheme()

  if (!editor) return null
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        padding: '6px 10px',
        borderBottom: `1px solid ${colors.toolbarDivider}`,
        flexWrap: 'wrap',
      }}
    >
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive('bold')}
        title="Bold (Ctrl+B)"
      >
        <strong>B</strong>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive('italic')}
        title="Italic (Ctrl+I)"
      >
        <em>I</em>
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive('underline')}
        title="Underline (Ctrl+U)"
      >
        <span style={{ textDecoration: 'underline' }}>U</span>
      </ToolbarButton>

      <Divider />

      {([1, 2, 3] as const).map((level) => (
        <ToolbarButton
          key={level}
          onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
          active={editor.isActive('heading', { level })}
          title={`Heading ${level}`}
        >
          H{level}
        </ToolbarButton>
      ))}

      <Divider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive('bulletList')}
        title="Bullet list"
      >
        ≡
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive('orderedList')}
        title="Ordered list"
      >
        1.
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive('blockquote')}
        title="Blockquote"
      >
        "
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive('code')}
        title="Inline code"
      >
        {'</>'}
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        title="Undo (Ctrl+Z)"
      >
        ↩
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        title="Redo (Ctrl+Y)"
      >
        ↪
      </ToolbarButton>
    </div>
  )
}

// ── Editor styles injected via <style> tag ────────────────────────────────────

function getEditorCSS(c: ThemeColors): string {
  return `
.tiptap-editor .ProseMirror {
  outline: none;
  padding: 1.25rem 1.5rem;
  min-height: 100%;
  font-family: 'Newsreader', Georgia, serif;
  font-size: 1.0625rem;
  line-height: 1.75;
  color: ${c.editorText};
  caret-color: ${c.editorCaret};
}
.tiptap-editor .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: ${c.editorPlaceholder};
  pointer-events: none;
  height: 0;
  font-style: italic;
}
.tiptap-editor .ProseMirror h1 { font-size: 1.75rem; font-weight: 700; margin: 1.5rem 0 0.75rem; letter-spacing: -0.02em; }
.tiptap-editor .ProseMirror h2 { font-size: 1.375rem; font-weight: 700; margin: 1.25rem 0 0.625rem; }
.tiptap-editor .ProseMirror h3 { font-size: 1.125rem; font-weight: 600; margin: 1rem 0 0.5rem; }
.tiptap-editor .ProseMirror p { margin: 0 0 0.75rem; }
.tiptap-editor .ProseMirror ul, .tiptap-editor .ProseMirror ol { padding-left: 1.5rem; margin: 0 0 0.75rem; }
.tiptap-editor .ProseMirror li { margin: 0.25rem 0; }
.tiptap-editor .ProseMirror blockquote { border-left: 3px solid ${c.primary}; padding-left: 1rem; margin: 1rem 0; color: ${c.editorBlockquote}; font-style: italic; }
.tiptap-editor .ProseMirror code { background: ${c.editorCodeBg}; border-radius: 4px; padding: 1px 5px; font-size: 0.875em; font-family: 'JetBrains Mono', monospace; }
.tiptap-editor .ProseMirror pre { background: ${c.editorPreBg}; color: ${c.editorPreText}; border-radius: 8px; padding: 1rem; overflow-x: auto; margin: 1rem 0; }
.tiptap-editor .ProseMirror pre code { background: none; padding: 0; color: inherit; }
.tiptap-editor .ProseMirror .tiptap-comment-highlight:hover { background-color: var(--comment-highlight-hover, ${c.commentHighlightHover}) !important; }
`
}

// ── Main component ────────────────────────────────────────────────────────────

export interface TipTapEditorProps {
  content: TipTapNode
  comments?: Comment[]
  onChange?: (content: TipTapNode) => void
  editable?: boolean
  placeholder?: string
  onCommentClick?: (commentId: string) => void
}

export default function TipTapEditor({
  content,
  comments = [],
  onChange,
  editable = true,
  placeholder = 'Start writing your assignment here…',
  onCommentClick,
}: TipTapEditorProps) {
  const commentsRef = useRef<Comment[]>(comments)
  const colors = useTheme()

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder }),
      CommentHighlightExtension.configure({
        getComments: () => commentsRef.current,
      }),
    ],
    content,
    editable,
    onUpdate({ editor: ed }) {
      onChange?.(ed.getJSON() as TipTapNode)
    },
  })

  // Sync comment list → refresh decorations
  useEffect(() => {
    commentsRef.current = comments
    if (editor && !editor.isDestroyed) {
      refreshCommentDecorations(editor.view)
    }
  }, [editor, comments])

  // Sync content when it changes externally (e.g. after save)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const currentJson = JSON.stringify(editor.getJSON())
    const newJson = JSON.stringify(content)
    if (currentJson !== newJson) {
      editor.commands.setContent(content, false)
    }
  }, [editor, content])

  // Forward comment-click events
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

  return (
    <div
      className="tiptap-editor"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: colors.editorBg,
        borderRadius: '8px',
        border: editable ? `1.5px solid ${colors.border}` : 'none',
        overflow: 'hidden',
        // CSS custom properties for ProseMirror decorations
        '--comment-highlight-bg': colors.commentHighlightBg,
        '--comment-highlight-border': colors.commentHighlightBorder,
        '--comment-highlight-hover': colors.commentHighlightHover,
      } as React.CSSProperties}
    >
      <style>{getEditorCSS(colors)}</style>
      {editable && <Toolbar editor={editor} />}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <EditorContent editor={editor} style={{ height: '100%' }} />
      </div>
    </div>
  )
}
