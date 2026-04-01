import { useThemeStore } from './themeStore'
import { lightTheme, darkTheme, type ThemeColors } from './themeTokens'

export function useTheme(): ThemeColors {
  const mode = useThemeStore((s) => s.mode)
  return mode === 'dark' ? darkTheme : lightTheme
}
