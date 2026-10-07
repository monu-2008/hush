'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Check } from 'lucide-react'
import { useTheme, type ThemeName } from '@/components/theme-provider'
import { useI18n } from '@/components/i18n-provider'

interface ThemeDialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
}

const THEMES: { code: ThemeName; emoji: string; gradient: string; key: string }[] = [
  { code: 'default', emoji: '🟣', gradient: 'from-violet-500 via-fuchsia-500 to-cyan-400', key: 'themes.default' },
  { code: 'aurora', emoji: '🟢', gradient: 'from-emerald-400 via-teal-400 to-cyan-400', key: 'themes.aurora' },
  { code: 'sunset', emoji: '🟠', gradient: 'from-amber-400 via-orange-500 to-rose-500', key: 'themes.sunset' },
  { code: 'rose', emoji: '🔴', gradient: 'from-rose-400 via-pink-500 to-red-500', key: 'themes.rose' },
  { code: 'ocean', emoji: '🔵', gradient: 'from-sky-400 via-blue-500 to-indigo-500', key: 'themes.ocean' },
]

export function ThemeDialog({ open, onOpenChange }: ThemeDialogProps) {
  const { themeName, setThemeName } = useTheme()
  const { t } = useI18n()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('themes.title')}</DialogTitle>
          <DialogDescription>{t('themes.subtitle')}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {THEMES.map((th) => {
            const active = themeName === th.code
            return (
              <button
                key={th.code}
                onClick={() => setThemeName(th.code)}
                className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                  active ? 'border-primary scale-105 shadow-lg' : 'border-transparent hover:scale-105'
                }`}
              >
                <div className={`h-20 bg-gradient-to-br ${th.gradient}`} />
                <div className="p-2 bg-background flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <span>{th.emoji}</span>
                    {t(th.key)}
                  </span>
                  {active && <Check className="h-4 w-4 text-primary" />}
                </div>
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
