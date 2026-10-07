'use client'

import { Lock, Send, KeyRound, ShieldCheck } from 'lucide-react'
import { useI18n } from '@/components/i18n-provider'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export function HowItWorks() {
  const { t } = useI18n()
  const steps = [
    { n: '01', icon: Lock, title: t('how.step1.title'), body: t('how.step1.body') },
    { n: '02', icon: Send, title: t('how.step2.title'), body: t('how.step2.body') },
    { n: '03', icon: KeyRound, title: t('how.step3.title'), body: t('how.step3.body') },
  ]

  return (
    <section className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <div className="text-xs uppercase tracking-wider text-primary font-medium">Private by design</div>
        <h2 className="text-3xl font-bold mt-2 gradient-text">{t('how.title')}</h2>
        <p className="text-muted-foreground mt-3">{t('how.subtitle')}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {steps.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.n} className="glass rounded-2xl p-5 hover:scale-[1.02] transition-transform">
              <div className="flex items-center justify-between mb-3">
                <span className="text-3xl font-bold text-primary/20">{s.n}</span>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <h3 className="font-semibold mb-1">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.body}</p>
            </div>
          )
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">{t('privacy.title')}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{t('privacy.body')}</p>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{t('faq.title')}</div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="q1">
              <AccordionTrigger className="text-sm text-left">{t('faq.q1')}</AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground">{t('faq.a1')}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger className="text-sm text-left">{t('faq.q2')}</AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground">{t('faq.a2')}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3">
              <AccordionTrigger className="text-sm text-left">{t('faq.q3')}</AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground">{t('faq.a3')}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="q4">
              <AccordionTrigger className="text-sm text-left">{t('faq.q4')}</AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground">{t('faq.a4')}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="q5">
              <AccordionTrigger className="text-sm text-left">{t('faq.q5')}</AccordionTrigger>
              <AccordionContent className="text-xs text-muted-foreground">{t('faq.a5')}</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  )
}
