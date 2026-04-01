import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'
import { useTheme } from '@application/theme/useTheme'
import { useThemeStore } from '@application/theme/themeStore'
import type { AssignmentVersion } from '@domain/models'

// ── Plain-text extractor from TipTap JSON ─────────────────────────────────────

function extractText(node: AssignmentVersion['content'], depth = 0): string {
  if (!node) return ''

  const lines: string[] = []

  if (node.text) {
    lines.push(node.text)
  }

  if (node.content && Array.isArray(node.content)) {
    const childTexts = node.content.map((child) => extractText(child, depth + 1))

    switch (node.type) {
      case 'doc':
        return childTexts.join('\n')

      case 'paragraph':
        return childTexts.join('') || ''

      case 'heading': {
        const level = (node.attrs?.level as number) ?? 1
        const prefix = '#'.repeat(level)
        return `${prefix} ${childTexts.join('')}`
      }

      case 'bulletList':
      case 'orderedList':
        return childTexts.join('\n')

      case 'listItem':
        return `• ${childTexts.join('')}`

      case 'blockquote':
        return childTexts.map((t) => `> ${t}`).join('\n')

      case 'codeBlock':
        return `\`\`\`\n${childTexts.join('')}\n\`\`\``

      case 'hardBreak':
        return '\n'

      default:
        return childTexts.join('')
    }
  }

  return lines.join('')
}

function versionToText(version: AssignmentVersion | undefined): string {
  if (!version) return ''
  return extractText(version.content)
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l, i, arr) => !(l === '' && arr[i - 1] === ''))
    .join('\n')
    .trim()
}

// ── Component ─────────────────────────────────────────────────────────────────

const DIFF_CSS = `
.diff-viewer-wrap .variable-inline { font-size: 0.8125rem; }
.diff-viewer-wrap pre { font-family: 'Newsreader', Georgia, serif !important; font-size: 1rem; line-height: 1.7; }
`

interface DiffViewerProps {
  versions: AssignmentVersion[]
  /** Which two version numbers to compare. Defaults to last two. */
  versionA?: number
  versionB?: number
  splitView?: boolean
}

export default function DiffViewer({
  versions,
  versionA,
  versionB,
  splitView = true,
}: DiffViewerProps) {
  const colors = useTheme()
  const mode = useThemeStore((s) => s.mode)
  const isDark = mode === 'dark'

  if (versions.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '200px',
          color: colors.textMuted,
          fontSize: '0.9375rem',
          fontFamily: "'Geist', 'Inter', sans-serif",
        }}
      >
        No versions to compare yet.
      </div>
    )
  }

  const sorted = [...versions].sort((a, b) => a.version_number - b.version_number)

  const numA = versionA ?? (sorted.length >= 2 ? sorted[sorted.length - 2].version_number : sorted[0].version_number)
  const numB = versionB ?? sorted[sorted.length - 1].version_number

  const verA = sorted.find((v) => v.version_number === numA)
  const verB = sorted.find((v) => v.version_number === numB)

  const oldText = versionToText(verA)
  const newText = versionToText(verB)

  return (
    <div className="diff-viewer-wrap">
      <style>{DIFF_CSS}</style>

      {/* Version selector header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          borderBottom: `1px solid ${colors.diffHeaderBorder}`,
          background: colors.diffHeaderBg,
          fontFamily: "'Geist', 'Inter', sans-serif",
          fontSize: '0.8125rem',
          color: colors.diffHeaderText,
          flexShrink: 0,
        }}
      >
        <span>Comparing</span>
        <span
          style={{
            fontWeight: 600,
            color: colors.diffRemovedText,
            background: colors.diffRemovedBg,
            padding: '1px 8px',
            borderRadius: '4px',
          }}
        >
          v{numA}
        </span>
        <span>→</span>
        <span
          style={{
            fontWeight: 600,
            color: colors.diffAddedText,
            background: colors.diffAddedBg,
            padding: '1px 8px',
            borderRadius: '4px',
          }}
        >
          v{numB}
        </span>

        {sorted.length > 2 && (
          <span style={{ marginLeft: 'auto', color: colors.textMuted }}>
            {sorted.length} versions total
          </span>
        )}
      </div>

      {oldText === newText ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '3rem',
            color: colors.textMuted,
            fontFamily: "'Geist', 'Inter', sans-serif",
            fontSize: '0.9375rem',
          }}
        >
          No differences between these versions.
        </div>
      ) : (
        <ReactDiffViewer
          oldValue={oldText}
          newValue={newText}
          splitView={splitView}
          compareMethod={DiffMethod.WORDS}
          leftTitle={`Version ${numA}`}
          rightTitle={splitView ? `Version ${numB}` : undefined}
          useDarkTheme={isDark}
          styles={{
            variables: {
              light: {
                diffViewerBackground: colors.diffBg,
                diffViewerColor: colors.diffText,
                addedBackground: colors.diffAddedBg,
                addedColor: colors.diffAddedText,
                removedBackground: colors.diffRemovedBg,
                removedColor: colors.diffRemovedText,
                wordAddedBackground: colors.diffWordAdded,
                wordRemovedBackground: colors.diffWordRemoved,
                addedGutterBackground: colors.diffWordAdded,
                removedGutterBackground: colors.diffWordRemoved,
                gutterBackground: colors.diffGutter,
                gutterBackgroundDark: colors.diffHeaderBg,
                highlightBackground: colors.highlight,
                highlightGutterBackground: colors.commentHighlightBg,
                codeFoldGutterBackground: colors.diffHeaderBg,
                codeFoldBackground: colors.diffGutter,
                emptyLineBackground: colors.diffGutter,
                gutterColor: colors.diffGutterText,
                addedGutterColor: colors.diffAddedText,
                removedGutterColor: colors.diffRemovedText,
                codeFoldContentColor: colors.diffHeaderText,
                diffViewerTitleBackground: colors.diffHeaderBg,
                diffViewerTitleColor: colors.diffText,
                diffViewerTitleBorderColor: colors.diffHeaderBorder,
              },
              dark: {
                diffViewerBackground: colors.diffBg,
                diffViewerColor: colors.diffText,
                addedBackground: colors.diffAddedBg,
                addedColor: colors.diffAddedText,
                removedBackground: colors.diffRemovedBg,
                removedColor: colors.diffRemovedText,
                wordAddedBackground: colors.diffWordAdded,
                wordRemovedBackground: colors.diffWordRemoved,
                addedGutterBackground: colors.diffWordAdded,
                removedGutterBackground: colors.diffWordRemoved,
                gutterBackground: colors.diffGutter,
                gutterBackgroundDark: colors.diffHeaderBg,
                highlightBackground: colors.highlight,
                highlightGutterBackground: colors.commentHighlightBg,
                codeFoldGutterBackground: colors.diffHeaderBg,
                codeFoldBackground: colors.diffGutter,
                emptyLineBackground: colors.diffGutter,
                gutterColor: colors.diffGutterText,
                addedGutterColor: colors.diffAddedText,
                removedGutterColor: colors.diffRemovedText,
                codeFoldContentColor: colors.diffHeaderText,
                diffViewerTitleBackground: colors.diffHeaderBg,
                diffViewerTitleColor: colors.diffText,
                diffViewerTitleBorderColor: colors.diffHeaderBorder,
              },
            },
          }}
        />
      )}
    </div>
  )
}
