export interface StatusColors {
  bg: string
  text: string
  dot: string
}

export interface ThemeColors {
  // Core surfaces
  background: string
  backgroundAlt: string
  surface: string
  surfaceHover: string

  // Text
  text: string
  textSecondary: string
  textMuted: string

  // Brand / Primary
  primary: string
  primaryLight: string
  primaryDisabled: string
  logoAccent: string

  // Borders
  border: string
  borderFocus: string

  // Sidebar
  sidebarBg: string

  // Feedback / semantic
  error: string
  errorBg: string
  errorBorder: string
  success: string
  successBg: string
  successText: string
  dangerBg: string
  dangerText: string
  warningBg: string
  warningText: string

  // Highlights (comment sidebar, focused states)
  highlight: string
  highlightBorder: string

  // Comment highlights (ProseMirror decorations — exposed as CSS custom props)
  commentHighlightBg: string
  commentHighlightBorder: string
  commentHighlightHover: string

  // Overlay / shadow
  overlay: string
  shadow: string

  // Button dark (e.g. "New Draft")
  buttonDark: string
  buttonDarkText: string

  // Login-specific
  loginBg: string
  loginSegmentBg: string
  loginSegmentActive: string
  loginSegmentInactive: string

  // Status badges
  statusDraft: StatusColors
  statusPending: StatusColors
  statusInReview: StatusColors
  statusRequiresChanges: StatusColors
  statusApproved: StatusColors

  // Editor / toolbar
  editorBg: string
  editorText: string
  editorCaret: string
  editorPlaceholder: string
  editorBlockquote: string
  editorCodeBg: string
  editorPreBg: string
  editorPreText: string
  editorSelection: string
  toolbarActiveBg: string
  toolbarActiveText: string
  toolbarText: string
  toolbarDivider: string

  // Diff viewer
  diffBg: string
  diffText: string
  diffAddedBg: string
  diffAddedText: string
  diffRemovedBg: string
  diffRemovedText: string
  diffWordAdded: string
  diffWordRemoved: string
  diffGutter: string
  diffGutterText: string
  diffHeaderBg: string
  diffHeaderText: string
  diffHeaderBorder: string

  // Focused document page sidebar (always dark)
  focusedSidebarBg: string
  focusedSidebarText: string
  focusedSidebarMuted: string
  focusedSidebarBorder: string
  focusedSidebarActiveBg: string
  focusedSidebarActiveOutline: string
}

export const lightTheme: ThemeColors = {
  background: '#fdfcf8',
  backgroundAlt: '#f4f4f5',
  surface: '#ffffff',
  surfaceHover: '#f4f4f5',

  text: '#2d2d2b',
  textSecondary: '#27272a',
  textMuted: '#a1a1aa',

  primary: '#e05236',
  primaryLight: '#fdf1ee',
  primaryDisabled: '#f4a898',
  logoAccent: '#211411',

  border: '#e4e4e7',
  borderFocus: '#d4d0cf',

  sidebarBg: '#fafafa',

  error: '#dc2626',
  errorBg: '#fef2f2',
  errorBorder: '#fecaca',
  success: '#10b981',
  successBg: '#d1fae5',
  successText: '#065f46',
  dangerBg: '#fee2e2',
  dangerText: '#991b1b',
  warningBg: '#fef3c7',
  warningText: '#92400e',

  highlight: '#fef9c3',
  highlightBorder: '#f59e0b',

  commentHighlightBg: '#fde68a',
  commentHighlightBorder: '#f59e0b',
  commentHighlightHover: '#fbbf24',

  overlay: 'rgba(33,20,17,0.4)',
  shadow: 'rgba(0,0,0,0.15)',

  buttonDark: '#1a1a1a',
  buttonDarkText: '#ffffff',

  loginBg: '#f2f0f0',
  loginSegmentBg: '#e8e4e4',
  loginSegmentActive: '#ffffff',
  loginSegmentInactive: '#9a9490',

  statusDraft: { bg: '#f4f4f5', text: '#52525b', dot: '#a1a1aa' },
  statusPending: { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' },
  statusInReview: { bg: '#dbeafe', text: '#1e40af', dot: '#3b82f6' },
  statusRequiresChanges: { bg: '#fee2e2', text: '#991b1b', dot: '#e25336' },
  statusApproved: { bg: '#d1fae5', text: '#065f46', dot: '#10b981' },

  editorBg: '#ffffff',
  editorText: '#27272a',
  editorCaret: '#e05236',
  editorPlaceholder: '#a1a1aa',
  editorBlockquote: '#52525b',
  editorCodeBg: '#f4f4f5',
  editorPreBg: '#18181b',
  editorPreText: '#f4f4f5',
  editorSelection: '#bfdbfe',
  toolbarActiveBg: '#e4e4e7',
  toolbarActiveText: '#18181b',
  toolbarText: '#52525b',
  toolbarDivider: '#e4e4e7',

  diffBg: '#ffffff',
  diffText: '#27272a',
  diffAddedBg: '#d1fae5',
  diffAddedText: '#065f46',
  diffRemovedBg: '#fee2e2',
  diffRemovedText: '#991b1b',
  diffWordAdded: '#a7f3d0',
  diffWordRemoved: '#fecaca',
  diffGutter: '#fafafa',
  diffGutterText: '#a1a1aa',
  diffHeaderBg: '#fafafa',
  diffHeaderText: '#52525b',
  diffHeaderBorder: '#e4e4e7',

  focusedSidebarBg: '#0f172a',
  focusedSidebarText: '#f1f5f9',
  focusedSidebarMuted: '#94a3b8',
  focusedSidebarBorder: '#1e293b',
  focusedSidebarActiveBg: '#1e293b',
  focusedSidebarActiveOutline: '#334155',
}

export const darkTheme: ThemeColors = {
  background: '#1a1816',
  backgroundAlt: '#1e1c1a',
  surface: '#262420',
  surfaceHover: '#302e2a',

  text: '#e8e4df',
  textSecondary: '#d4d0cb',
  textMuted: '#8a8580',

  primary: '#e86b52',
  primaryLight: '#3a2420',
  primaryDisabled: '#8a3a2a',
  logoAccent: '#e8e4df',

  border: '#3a3835',
  borderFocus: '#4a4845',

  sidebarBg: '#222018',

  error: '#f87171',
  errorBg: '#3a1c1c',
  errorBorder: '#6b2020',
  success: '#34d399',
  successBg: '#1a3a2a',
  successText: '#6ee7b7',
  dangerBg: '#3a1c1c',
  dangerText: '#fca5a5',
  warningBg: '#3a3018',
  warningText: '#fde68a',

  highlight: '#4a4020',
  highlightBorder: '#d97706',

  commentHighlightBg: '#6b5a1a',
  commentHighlightBorder: '#d97706',
  commentHighlightHover: '#a08520',

  overlay: 'rgba(0,0,0,0.6)',
  shadow: 'rgba(0,0,0,0.4)',

  buttonDark: '#e8e4df',
  buttonDarkText: '#1a1816',

  loginBg: '#181614',
  loginSegmentBg: '#2a2826',
  loginSegmentActive: '#3a3835',
  loginSegmentInactive: '#8a8580',

  statusDraft: { bg: '#2a2826', text: '#a09a94', dot: '#8a8580' },
  statusPending: { bg: '#3a3018', text: '#fde68a', dot: '#d97706' },
  statusInReview: { bg: '#1a2a3a', text: '#93c5fd', dot: '#3b82f6' },
  statusRequiresChanges: { bg: '#3a1c1c', text: '#fca5a5', dot: '#e25336' },
  statusApproved: { bg: '#1a3a2a', text: '#6ee7b7', dot: '#10b981' },

  editorBg: '#262420',
  editorText: '#e8e4df',
  editorCaret: '#e86b52',
  editorPlaceholder: '#6a6560',
  editorBlockquote: '#a09a94',
  editorCodeBg: '#1e1c1a',
  editorPreBg: '#0f0e0d',
  editorPreText: '#e8e4df',
  editorSelection: '#2a4060',
  toolbarActiveBg: '#3a3835',
  toolbarActiveText: '#e8e4df',
  toolbarText: '#a09a94',
  toolbarDivider: '#3a3835',

  diffBg: '#262420',
  diffText: '#e8e4df',
  diffAddedBg: '#1a3a2a',
  diffAddedText: '#6ee7b7',
  diffRemovedBg: '#3a1c1c',
  diffRemovedText: '#fca5a5',
  diffWordAdded: '#2a5a3a',
  diffWordRemoved: '#5a2020',
  diffGutter: '#222018',
  diffGutterText: '#6a6560',
  diffHeaderBg: '#222018',
  diffHeaderText: '#a09a94',
  diffHeaderBorder: '#3a3835',

  focusedSidebarBg: '#0f172a',
  focusedSidebarText: '#f1f5f9',
  focusedSidebarMuted: '#94a3b8',
  focusedSidebarBorder: '#1e293b',
  focusedSidebarActiveBg: '#1e293b',
  focusedSidebarActiveOutline: '#334155',
}
