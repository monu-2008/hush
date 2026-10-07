'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

type ColorMode = 'light' | 'dark'
type ThemeName = 'default' | 'aurora' | 'sunset' | 'rose' | 'ocean'

interface ThemeState {
  colorMode: ColorMode
  themeName: ThemeName
  setColorMode: (m: ColorMode) => void
  toggleColorMode: () => void
  setThemeName: (t: ThemeName) => void
}

const ThemeContext = createContext<ThemeState | null>(null)

function getInitialMode(): ColorMode {
  if (typeof window === 'undefined') return 'light'
  try {
    const saved = localStorage.getItem('hush-color-mode') as ColorMode | null
    if (saved === 'dark' || saved === 'light') return saved
  } catch {}
  return 'light'
}

function getInitialTheme(): ThemeName {
  if (typeof window === 'undefined') return 'default'
  try {
    const saved = localStorage.getItem('hush-theme-name') as ThemeName | null
    if (saved && ['default', 'aurora', 'sunset', 'rose', 'ocean'].includes(saved)) return saved
  } catch {}
  return 'default'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorMode, setColorModeState] = useState<ColorMode>(getInitialMode)
  const [themeName, setThemeNameState] = useState<ThemeName>(getInitialTheme)

  // Apply to <html> whenever state changes (side-effect, not derived state)
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', colorMode === 'dark')
    root.setAttribute('data-theme', themeName)
    try {
      localStorage.setItem('hush-color-mode', colorMode)
      localStorage.setItem('hush-theme-name', themeName)
    } catch {}
  }, [colorMode, themeName])

  const setColorMode = useCallback((m: ColorMode) => setColorModeState(m), [])
  const toggleColorMode = useCallback(
    () => setColorModeState((m) => (m === 'dark' ? 'light' : 'dark')),
    []
  )
  const setThemeName = useCallback((t: ThemeName) => setThemeNameState(t), [])

  return (
    <ThemeContext.Provider value={{ colorMode, themeName, setColorMode, toggleColorMode, setThemeName }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

export type { ThemeName }
