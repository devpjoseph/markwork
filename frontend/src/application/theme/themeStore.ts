import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark'

interface ThemeState {
  mode: ThemeMode
  toggle: () => void
}

function syncHtmlAttribute(mode: ThemeMode) {
  if (mode === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'light',
      toggle: () =>
        set((s) => {
          const next = s.mode === 'light' ? 'dark' : 'light'
          syncHtmlAttribute(next)
          return { mode: next }
        }),
    }),
    {
      name: 'markwork-theme',
      onRehydrateStorage: () => (state) => {
        if (state) syncHtmlAttribute(state.mode)
      },
    },
  ),
)
