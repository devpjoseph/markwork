import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { Node as ProsemirrorNode } from '@tiptap/pm/model'
import type { Comment } from '@domain/models'

// ── Plugin key (used to trigger re-decorations from outside) ──────────────────
export const COMMENT_PLUGIN_KEY = new PluginKey<DecorationSet>('markworkComments')

// ── Build decorations from current comments ───────────────────────────────────
function buildDecorations(doc: ProsemirrorNode, comments: Comment[]): DecorationSet {
  const decorations: Decoration[] = []

  const openComments = comments.filter((c) => c.selected_text && c.status === 'OPEN')

  for (const comment of openComments) {
    const target = comment.selected_text

    doc.descendants((node, pos) => {
      if (!node.isText || !node.text) return

      let searchFrom = 0
      while (searchFrom < node.text.length) {
        const idx = node.text.indexOf(target, searchFrom)
        if (idx === -1) break

        decorations.push(
          Decoration.inline(
            pos + idx,
            pos + idx + target.length,
            {
              style: [
                'background-color: var(--comment-highlight-bg, #fde68a)',
                'border-radius: 2px',
                'cursor: pointer',
                'padding: 1px 0',
                'border-bottom: 2px solid var(--comment-highlight-border, #f59e0b)',
              ].join('; '),
              'data-comment-id': comment.id,
              title: comment.content,
              class: 'tiptap-comment-highlight',
            }
          )
        )
        searchFrom = idx + 1
      }
    })
  }

  return DecorationSet.create(doc, decorations)
}

// ── Custom event dispatched when a highlight is clicked ───────────────────────
export const COMMENT_CLICK_EVENT = 'markwork:comment-click'

export interface CommentClickDetail {
  commentId: string
}

// ── Extension options ─────────────────────────────────────────────────────────
export interface CommentHighlightOptions {
  /**
   * A function that returns the current list of comments.
   * Use a ref-based getter so the plugin always reads fresh data.
   */
  getComments: () => Comment[]
}

// ── Extension ─────────────────────────────────────────────────────────────────
export const CommentHighlightExtension = Extension.create<CommentHighlightOptions>({
  name: 'commentHighlight',

  addOptions() {
    return {
      getComments: () => [],
    }
  },

  addProseMirrorPlugins() {
    const getComments = this.options.getComments

    return [
      new Plugin<DecorationSet>({
        key: COMMENT_PLUGIN_KEY,

        state: {
          init(_, { doc }) {
            return buildDecorations(doc, getComments())
          },
          apply(tr, old, _prev, newState) {
            // Re-build if the document changed OR if we explicitly signal a refresh
            if (tr.docChanged || tr.getMeta(COMMENT_PLUGIN_KEY)) {
              return buildDecorations(newState.doc, getComments())
            }
            return old
          },
        },

        props: {
          decorations(state) {
            return COMMENT_PLUGIN_KEY.getState(state) ?? DecorationSet.empty
          },

          // Bubble a custom DOM event when a highlighted span is clicked
          handleClick(view, _pos, event) {
            const target = event.target as HTMLElement
            const el = target.closest('[data-comment-id]') as HTMLElement | null
            if (!el) return false

            const commentId = el.dataset.commentId
            if (!commentId) return false

            view.dom.dispatchEvent(
              new CustomEvent<CommentClickDetail>(COMMENT_CLICK_EVENT, {
                bubbles: true,
                detail: { commentId },
              })
            )
            return true
          },
        },
      }),
    ]
  },
})

// ── Helper: force the plugin to re-build decorations ─────────────────────────
export function refreshCommentDecorations(editorView: { dispatch: (tr: any) => void; state: any }) {
  const tr = editorView.state.tr.setMeta(COMMENT_PLUGIN_KEY, true)
  editorView.dispatch(tr)
}
