'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Sun, Palette, Globe, Download, BarChart3, Menu, X, Settings, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useTheme, type ThemeName } from '@/components/theme-provider'
import { useI18n } from '@/components/i18n-provider'
import { LANGUAGES, type Lang } from '@/lib/i18n'
import { usePwaInstall } from '@/hooks/use-pwa'

interface TopbarProps {
  onOpenStats: () => void
  onOpenThemes: () => void
}

const THEME_OPTIONS: { code: ThemeName; emoji: string; key: string }[] = [
  { code: 'default', emoji: '🟣', key: 'themes.default' },
  { code: 'aurora', emoji: '🟢', key: 'themes.aurora' },
  { code: 'sunset', emoji: '🟠', key: 'themes.sunset' },
  { code: 'rose', emoji: '🔴', key: 'themes.rose' },
  { code: 'ocean', emoji: '🔵', key: 'themes.ocean' },
]

export function Topbar({ onOpenStats, onOpenThemes }: TopbarProps) {
  const { colorMode, toggleColorMode, themeName, setThemeName } = useTheme()
  const { lang, setLang, t } = useI18n()
  const { canInstall, promptInstall } = usePwaInstall()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full px-3 sm:px-4 pt-3">
      {/* Floating pill navbar */}
      <div className="glass rounded-full px-2 py-2 flex items-center justify-between gap-2 max-w-7xl mx-auto shadow-lg">
        {/* Brand */}
        <a href="#" className="flex items-center gap-2 pl-2 pr-3 group shrink-0" aria-label="Hush home">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-violet-500 via-pink-500 to-cyan-400 text-white font-bold text-sm shadow-md shadow-violet-500/30 group-hover:scale-105 transition-transform">
            h
          </span>
          <span className="text-lg font-semibold tracking-tight hidden sm:inline">
            {t('app.brand')}
            <span className="text-primary">.</span>
          </span>
        </a>

        {/* Center: AQERIONX badge (desktop only) */}
        <span className="hidden lg:inline text-[11px] px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
          ✳ AQERIONX
        </span>

        {/* Desktop quick actions (inline) */}
        <div className="hidden md:flex items-center gap-0.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" aria-label="Switch language">
                <Globe className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Language</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {LANGUAGES.map((l) => (
                <DropdownMenuItem
                  key={l.code}
                  onClick={() => setLang(l.code as Lang)}
                  className={lang === l.code ? 'bg-accent' : ''}
                >
                  <span className="mr-2">{l.code === 'en' ? '🇬🇧' : l.code === 'hi' ? '🇮🇳' : l.code === 'es' ? '🇪🇸' : '🇸🇦'}</span>
                  {l.name}
                  {lang === l.code && <Check className="h-3.5 w-3.5 ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" onClick={toggleColorMode} aria-label="Toggle dark mode">
            {colorMode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {canInstall && (
            <Button size="sm" onClick={promptInstall} className="gap-1.5 rounded-full ml-1 h-9">
              <Download className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">{t('nav.install')}</span>
            </Button>
          )}

          {/* Burger → settings menu */}
          <Button variant="ghost" size="icon" className="rounded-full h-9 w-9" onClick={() => setMenuOpen(true)} aria-label="Settings menu">
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile: just burger */}
        <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 md:hidden" onClick={() => setMenuOpen(true)} aria-label="Settings menu">
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Settings drawer (slide-down) */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="fixed left-1/2 -translate-x-1/2 top-20 z-50 w-[calc(100%-1.5rem)] sm:w-96 max-w-md"
            >
              <div className="glass rounded-3xl p-5 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-sm">Settings</span>
                  </div>
                  <button onClick={() => setMenuOpen(false)} className="text-muted-foreground hover:text-foreground rounded-full p-1" aria-label="Close">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Quick toggles row */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <Button variant="outline" size="sm" onClick={toggleColorMode} className="gap-2 rounded-xl">
                    {colorMode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    {colorMode === 'dark' ? 'Light' : 'Dark'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { onOpenStats(); setMenuOpen(false) }} className="gap-2 rounded-xl">
                    <BarChart3 className="h-4 w-4" /> {t('nav.stats')}
                  </Button>
                </div>

                {/* Language */}
                <div className="mb-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Globe className="h-3 w-3" /> Language
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => setLang(l.code as Lang)}
                        className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-all ${
                          lang === l.code ? 'bg-primary text-primary-foreground' : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span>{l.code === 'en' ? '🇬🇧' : l.code === 'hi' ? '🇮🇳' : l.code === 'es' ? '🇪🇸' : '🇸🇦'}</span>
                        {l.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Themes */}
                <div className="mb-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Palette className="h-3 w-3" /> {t('nav.themes')}
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {THEME_OPTIONS.map((opt) => (
                      <button
                        key={opt.code}
                        onClick={() => setThemeName(opt.code)}
                        className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                          themeName === opt.code ? 'bg-primary text-primary-foreground' : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{opt.emoji}</span>
                          {t(opt.key)}
                        </span>
                        {themeName === opt.code && <Check className="h-3.5 w-3.5" />}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => { onOpenThemes(); setMenuOpen(false) }}
                    className="text-xs text-primary hover:underline mt-2"
                  >
                    Preview all themes →
                  </button>
                </div>

                {/* Install */}
                {canInstall && (
                  <Button onClick={() => { promptInstall(); setMenuOpen(false) }} size="sm" className="w-full gap-1.5 rounded-xl">
                    <Download className="h-3.5 w-3.5" /> {t('install.title')}
                  </Button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
