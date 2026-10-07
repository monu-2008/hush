'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { Lang, LANGUAGES, translate } from '@/lib/i18n'

interface I18nState {
  lang: Lang
  dir: 'ltr' | 'rtl'
  setLang: (l: Lang) => void
  t: (key: string, fallback?: string) => string
}

const I18nContext = createContext<I18nState | null>(null)

function getInitialLang(): Lang {
  if (typeof window === 'undefined') return 'en'
  try {
    const saved = localStorage.getItem('hush-lang') as Lang | null
    if (saved && LANGUAGES.some((l) => l.code === saved)) return saved
  } catch {}
  return 'en'
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(getInitialLang)

  const dir = LANGUAGES.find((l) => l.code === lang)?.dir ?? 'ltr'

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
    try { localStorage.setItem('hush-lang', lang) } catch {}
  }, [lang, dir])

  const setLang = useCallback((l: Lang) => setLangState(l), [])
  const t = useCallback((key: string, fallback?: string) => translate(lang, key, fallback), [lang])

  return (
    <I18nContext.Provider value={{ lang, dir, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
