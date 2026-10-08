'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, ArrowDownLeft, Lock } from 'lucide-react'
import { I18nProvider } from '@/components/i18n-provider'
import { Topbar } from '@/components/hush/topbar'
import { EncodePanel } from '@/components/hush/encode-panel'
import { DecodePanel } from '@/components/hush/decode-panel'
import { EncryptionView } from '@/components/hush/encryption-view'
import { SettingsView } from '@/components/hush/settings-view'
import { HowItWorks } from '@/components/hush/how-it-works'
import { Footer } from '@/components/hush/footer'
import { InstallBanner } from '@/components/hush/install-banner'
import { registerServiceWorker, usePwaInstall } from '@/hooks/use-pwa'
import { useStats } from '@/hooks/use-stats'
import { useI18n } from '@/components/i18n-provider'

type Tab = 'encode' | 'decode' | 'encryption' | 'settings'

function HushApp() {
  const { t, lang } = useI18n()
  const { installed } = usePwaInstall()
  const { unlockPwa } = useStats()
  const [tab, setTab] = useState<Tab>('encode')

  useEffect(() => {
    registerServiceWorker()
  }, [])

  useEffect(() => {
    if (installed) unlockPwa()
  }, [installed, unlockPwa])

  // Sirf 3 pills — Encode | Decode | Encryption (Settings burger me hai)
  const tabs: { code: Tab; icon: any; label: string }[] = [
    { code: 'encode', icon: ArrowUpRight, label: t('nav.encode') },
    { code: 'decode', icon: ArrowDownLeft, label: t('nav.decode') },
    { code: 'encryption', icon: Lock, label: 'Encryption' },
  ]

  const openSettings = () => setTab('settings')
  const goBackFromSettings = () => setTab('encode')

  return (
    <>
      {/* Animated aurora background */}
      <div className="mesh-bg" aria-hidden>
        <div className="mesh-blob b1" />
        <div className="mesh-blob b2" />
        <div className="mesh-blob b3" />
        <div className="mesh-blob b4" />
        <div className="mesh-blob b5" />
      </div>
      <div className="mesh-stars" aria-hidden />
      <div className="noise-overlay" aria-hidden />

      <Topbar onOpenSettings={openSettings} />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 pt-20 sm:pt-24 pb-12 space-y-12 sm:space-y-16 min-h-[calc(100vh-80px)]">
        {/* Hero — only on encode/decode */}
        {(tab === 'encode' || tab === 'decode') && (
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
        )}

        {/* Settings page — full screen, back button */}
        {tab === 'settings' ? (
          <div>
            <button
              onClick={goBackFromSettings}
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back
            </button>
            <SettingsView />
          </div>
        ) : (
          <>
            {/* Pills (tabs) — sirf 3 */}
            <section>
              <div className="flex justify-center mb-6">
                <div className="glass rounded-full p-1 inline-flex flex-wrap justify-center gap-0.5 max-w-full fancy-scroll">
                  {tabs.map((tb) => {
                    const Icon = tb.icon
                    const active = tab === tb.code
                    return (
                      <button
                        key={tb.code}
                        onClick={() => setTab(tb.code)}
                        className={`flex items-center gap-2 rounded-full px-4 sm:px-6 py-2 text-sm font-medium transition-all whitespace-nowrap ${
                          active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {tb.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Tab content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={tab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {tab === 'encode' && (
                    <div className="glass rounded-3xl p-5 sm:p-8">
                      <EncodePanel />
                    </div>
                  )}
                  {tab === 'decode' && (
                    <div className="glass rounded-3xl p-5 sm:p-8">
                      <DecodePanel />
                    </div>
                  )}
                  {tab === 'encryption' && <EncryptionView lang={lang} />}
                </motion.div>
              </AnimatePresence>
            </section>

            {/* How it works — only on encode/decode */}
            {(tab === 'encode' || tab === 'decode') && <HowItWorks />}
          </>
        )}

        <Footer />
      </main>

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
