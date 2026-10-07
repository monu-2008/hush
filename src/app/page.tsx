'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { I18nProvider } from '@/components/i18n-provider'
import { Topbar } from '@/components/hush/topbar'
import { EncodePanel } from '@/components/hush/encode-panel'
import { DecodePanel } from '@/components/hush/decode-panel'
import { HowItWorks } from '@/components/hush/how-it-works'
import { StatsDialog } from '@/components/hush/stats-dialog'
import { ThemeDialog } from '@/components/hush/theme-dialog'
import { InstallBanner } from '@/components/hush/install-banner'
import { registerServiceWorker, usePwaInstall } from '@/hooks/use-pwa'
import { useStats } from '@/hooks/use-stats'
import { useI18n } from '@/components/i18n-provider'

function HushApp() {
  const { t } = useI18n()
  const { installed } = usePwaInstall()
  const { unlockPwa } = useStats()
  const [tab, setTab] = useState<'encode' | 'decode'>('encode')
  const [statsOpen, setStatsOpen] = useState(false)
  const [themesOpen, setThemesOpen] = useState(false)

  useEffect(() => {
    registerServiceWorker()
  }, [])

  useEffect(() => {
    if (installed) unlockPwa()
  }, [installed, unlockPwa])

  return (
    <>
      {/* Animated mesh background */}
      <div className="mesh-bg" aria-hidden>
        <div className="mesh-blob b1" />
        <div className="mesh-blob b2" />
        <div className="mesh-blob b3" />
      </div>
      <div className="noise-overlay" aria-hidden />

      <Topbar onOpenStats={() => setStatsOpen(true)} onOpenThemes={() => setThemesOpen(true)} />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-20 sm:pt-24 pb-12 space-y-12 sm:space-y-16 min-h-[calc(100vh-80px)]">
        {/* Hero */}
        <section className="text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border bg-background/60 backdrop-blur px-3 py-1 text-xs font-medium mb-4"
          >
            <span className="text-primary">✳</span> A little privacy goes a long way
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl sm:text-6xl font-bold tracking-tight"
          >
            Say it in <span className="gradient-text">plain sight.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground mt-4 text-base sm:text-lg max-w-xl mx-auto"
          >
            {t('app.intro')}
          </motion.p>
        </section>

        {/* Workspace */}
        <section>
          {/* Tabs */}
          <div className="flex justify-center mb-6">
            <div className="glass rounded-full p-1 inline-flex">
              <button
                onClick={() => setTab('encode')}
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all ${
                  tab === 'encode' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ArrowUpRight className="h-4 w-4" /> {t('nav.encode')}
              </button>
              <button
                onClick={() => setTab('decode')}
                className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all ${
                  tab === 'decode' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ArrowDownLeft className="h-4 w-4" /> {t('nav.decode')}
              </button>
            </div>
          </div>

          <div className="glass rounded-3xl p-5 sm:p-8">
            {tab === 'encode' ? <EncodePanel /> : <DecodePanel />}
          </div>
        </section>

        {/* How it works */}
        <HowItWorks />

        {/* Footer */}
        <footer className="text-center py-8 border-t">
          <p className="text-sm text-muted-foreground">{t('footer.made')}</p>
          <p className="text-xs text-muted-foreground mt-1">✳ &nbsp; HUSH by AQERIONX</p>
        </footer>
      </main>

      <StatsDialog open={statsOpen} onOpenChange={setStatsOpen} />
      <ThemeDialog open={themesOpen} onOpenChange={setThemesOpen} />
      <InstallBanner />
    </>
  )
}

export default function Home() {
  return (
    <I18nProvider>
      <HushApp />
    </I18nProvider>
  )
}
