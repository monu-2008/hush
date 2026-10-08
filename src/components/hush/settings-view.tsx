'use client'

import { motion } from 'framer-motion'
import { Moon, Sun, Globe, Download, Palette, BarChart3, Trophy, Info, Github, Instagram, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTheme, type ThemeName } from '@/components/theme-provider'
import { useI18n } from '@/components/i18n-provider'
import { LANGUAGES, type Lang } from '@/lib/i18n'
import { usePwaInstall } from '@/hooks/use-pwa'
import { useStats } from '@/hooks/use-stats'
import { Check } from 'lucide-react'

const THEME_OPTIONS: { code: ThemeName; emoji: string; gradient: string; key: string }[] = [
  { code: 'default', emoji: '🟣', gradient: 'from-violet-500 to-fuchsia-500', key: 'themes.default' },
  { code: 'aurora', emoji: '🟢', gradient: 'from-emerald-400 to-teal-500', key: 'themes.aurora' },
  { code: 'sunset', emoji: '🟠', gradient: 'from-amber-400 to-orange-500', key: 'themes.sunset' },
  { code: 'rose', emoji: '🔴', gradient: 'from-rose-400 to-pink-500', key: 'themes.rose' },
  { code: 'ocean', emoji: '🔵', gradient: 'from-sky-400 to-indigo-500', key: 'themes.ocean' },
]

export function SettingsView() {
  const { colorMode, toggleColorMode, themeName, setThemeName } = useTheme()
  const { lang, setLang, t } = useI18n()
  const { canInstall, promptInstall, installed } = usePwaInstall()
  const { stats, achievementIds } = useStats()

  const unlockedCount = achievementIds.filter((id) => stats.achievements[id]).length

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold">⚙️ Settings</h1>
        <p className="text-muted-foreground mt-2 text-sm">Apne hisaab se customize kar bhai</p>
      </motion.div>

      {/* Appearance */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass rounded-2xl p-5 sm:p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Palette className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Appearance</h2>
        </div>

        {/* Dark/Light */}
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="text-sm font-medium">Theme mode</div>
            <div className="text-xs text-muted-foreground">{colorMode === 'dark' ? 'Dark' : 'Light'} mode</div>
          </div>
          <Button onClick={toggleColorMode} variant="outline" size="sm" className="gap-2 rounded-full">
            {colorMode === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {colorMode === 'dark' ? 'Light' : 'Dark'}
          </Button>
        </div>

        <div className="h-px bg-border my-3" />

        {/* Theme picker */}
        <div className="text-sm font-medium mb-2">Color theme</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {THEME_OPTIONS.map((th) => {
            const active = themeName === th.code
            return (
              <button
                key={th.code}
                onClick={() => setThemeName(th.code)}
                className={`relative flex items-center gap-2 rounded-xl border p-3 text-left transition-all ${
                  active ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:bg-muted/30'
                }`}
              >
                <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${th.gradient}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{t(th.key)}</div>
                </div>
                {active && <Check className="h-4 w-4 text-primary shrink-0" />}
              </button>
            )
          })}
        </div>
      </motion.section>

      {/* Language */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-5 sm:p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Language</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((l) => {
            const active = lang === l.code
            return (
              <button
                key={l.code}
                onClick={() => setLang(l.code as Lang)}
                className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-all ${
                  active ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:bg-muted/30'
                }`}
              >
                <span className="text-xl">{l.code === 'en' ? '🇬🇧' : l.code === 'hi' ? '🇮🇳' : l.code === 'es' ? '🇪🇸' : '🇸🇦'}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{l.name}</div>
                  <div className="text-xs text-muted-foreground">{l.dir.toUpperCase()}</div>
                </div>
                {active && <Check className="h-4 w-4 text-primary shrink-0" />}
              </button>
            )
          })}
        </div>
      </motion.section>

      {/* Stats summary */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass rounded-2xl p-5 sm:p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Your activity</h2>
          </div>
          <Badge variant="secondary" className="gap-1">
            <Trophy className="h-3 w-3" /> {unlockedCount}/{achievementIds.length}
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Encoded</div>
            <div className="text-2xl font-bold mt-1">{stats.encoded}</div>
          </div>
          <div className="rounded-xl bg-muted/30 p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Decoded</div>
            <div className="text-2xl font-bold mt-1">{stats.decoded}</div>
          </div>
        </div>
      </motion.section>

      {/* PWA Install */}
      {canInstall && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-5 sm:p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Download className="h-4 w-4 text-primary" />
                <h2 className="font-semibold">Install app</h2>
              </div>
              <p className="text-xs text-muted-foreground">Offline access, native feel</p>
            </div>
            <Button onClick={promptInstall} size="sm" className="gap-1.5 rounded-full">
              <Download className="h-3.5 w-3.5" /> Install
            </Button>
          </div>
        </motion.section>
      )}

      {installed && (
        <div className="text-center text-xs text-muted-foreground">
          ✳ App installed — thanks bhai!
        </div>
      )}

      {/* About */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass rounded-2xl p-5 sm:p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Info className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">About</h2>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">App</span>
            <span className="font-medium">Hush — Private Messages</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Version</span>
            <span className="font-medium">2.0.0</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Made by</span>
            <a href="https://aqerionx.in" target="_blank" rel="noopener noreferrer" className="font-medium gradient-text hover:underline">
              AQERIONX
            </a>
          </div>
          <div className="h-px bg-border my-2" />
          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href="https://www.instagram.com/aqerionx?stkn=MTR0MjhnbGgxNDJnNQ%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #f09433, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888)' }}
            >
              <Instagram className="h-3.5 w-3.5" /> Instagram
            </a>
            <a
              href="https://github.com/monu-2008/hush"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <Github className="h-3.5 w-3.5" /> GitHub
            </a>
          </div>
        </div>
      </motion.section>

      <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
        Made with <Heart className="h-3 w-3 text-pink-500 fill-pink-500" /> in India
      </div>
    </div>
  )
}
