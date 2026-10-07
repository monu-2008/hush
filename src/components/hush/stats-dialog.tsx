'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lock, Unlock, Trophy, RotateCcw, Award } from 'lucide-react'
import { useI18n } from '@/components/i18n-provider'
import { useStats, type CarrierKind } from '@/hooks/use-stats'

interface StatsDialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
}

const CARRIERS: { code: CarrierKind; emoji: string; label: string }[] = [
  { code: 'emoji', emoji: '😊', label: 'Emoji' },
  { code: 'image', emoji: '🖼️', label: 'PNG chunk' },
  { code: 'lsb', emoji: '🎨', label: 'Pixel LSB' },
  { code: 'qr', emoji: '🔳', label: 'QR code' },
  { code: 'audio', emoji: '🎵', label: 'Audio' },
]

export function StatsDialog({ open, onOpenChange }: StatsDialogProps) {
  const { t } = useI18n()
  const { stats, reset, achievementIds } = useStats()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto fancy-scroll">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /> {t('stats.title')}</DialogTitle>
          <DialogDescription>{t('privacy.body')}</DialogDescription>
        </DialogHeader>

        {/* Top stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
              <Lock className="h-3 w-3" /> {t('stats.encoded')}
            </div>
            <div className="text-3xl font-bold mt-1">{stats.encoded}</div>
          </div>
          <div className="rounded-xl border bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider">
              <Unlock className="h-3 w-3" /> {t('stats.decoded')}
            </div>
            <div className="text-3xl font-bold mt-1">{stats.decoded}</div>
          </div>
        </div>

        {/* By carrier */}
        <div>
          <h3 className="text-sm font-medium mb-2">{t('stats.by_carrier')}</h3>
          <div className="space-y-1.5">
            {CARRIERS.map((c) => {
              const max = Math.max(1, ...Object.values(stats.byCarrier))
              const count = stats.byCarrier[c.code] || 0
              const pct = (count / max) * 100
              return (
                <div key={c.code} className="flex items-center gap-3 text-sm">
                  <div className="w-32 flex items-center gap-2">
                    <span>{c.emoji}</span>
                    <span className="text-muted-foreground">{c.label}</span>
                  </div>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right tabular-nums">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Achievements */}
        <div>
          <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5"><Award className="h-4 w-4 text-primary" /> {t('stats.achievements')}</h3>
          {achievementIds.every((id) => !stats.achievements[id]) ? (
            <div className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-xl">{t('stats.empty')}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {achievementIds.map((id) => {
                const unlocked = !!stats.achievements[id]
                return (
                  <div
                    key={id}
                    className={`flex items-start gap-2 rounded-lg border p-3 transition-all ${
                      unlocked ? 'border-primary/40 bg-primary/5' : 'border-border opacity-50'
                    }`}
                  >
                    <div className={`grid h-8 w-8 place-items-center rounded-full ${unlocked ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                      {unlocked ? <Trophy className="h-4 w-4" /> : '🔒'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{t(`achievements.${id}`)}</div>
                      <div className="text-xs text-muted-foreground truncate">{t(`achievements.${id}.desc`)}</div>
                    </div>
                    {unlocked && <Badge variant="secondary" className="text-xs">✓</Badge>}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={reset} variant="outline" size="sm" className="gap-1.5"><RotateCcw className="h-3.5 w-3.5" /> {t('stats.reset')}</Button>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
