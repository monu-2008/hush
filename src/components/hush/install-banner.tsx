'use client'

import { useState } from 'react'
import { Download, X, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePwaInstall } from '@/hooks/use-pwa'
import { useI18n } from '@/components/i18n-provider'

function getInitialDismissed(): boolean {
  if (typeof window === 'undefined') return false
  try { return localStorage.getItem('hush-install-dismissed') === '1' } catch { return false }
}

export function InstallBanner() {
  const { canInstall, promptInstall } = usePwaInstall()
  const { t } = useI18n()
  const [dismissed, setDismissed] = useState<boolean>(getInitialDismissed)

  if (!canInstall || dismissed) return null

  const dismiss = () => {
    setDismissed(true)
    try { localStorage.setItem('hush-install-dismissed', '1') } catch {}
  }

  const install = async () => {
    const ok = await promptInstall()
    if (ok) dismiss()
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 banner-slide-up">
      <div className="glass rounded-2xl p-4 shadow-2xl glow-ring">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 text-white shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">{t('install.title')}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{t('install.body')}</div>
            <div className="flex gap-2 mt-3">
              <Button onClick={install} size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" /> {t('install.action')}</Button>
              <Button onClick={dismiss} variant="ghost" size="sm">{t('install.dismiss')}</Button>
            </div>
          </div>
          <button onClick={dismiss} className="text-muted-foreground hover:text-foreground shrink-0" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
