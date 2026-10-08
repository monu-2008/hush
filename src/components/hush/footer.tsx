'use client'

import { Instagram, Github, Heart } from 'lucide-react'
import { useI18n } from '@/components/i18n-provider'

export function Footer() {
  const { t } = useI18n()

  return (
    <footer className="text-center py-10 border-t mt-8">
      <p className="text-sm text-muted-foreground">{t('footer.made')}</p>

      <div className="mt-4 flex items-center justify-center gap-2 text-sm">
        <span className="font-semibold tracking-tight">hush</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">by</span>
        <a
          href="https://aqerionx.in"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold gradient-text hover:opacity-80 transition-opacity"
        >
          AQERIONX
        </a>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <a
          href="https://www.instagram.com/aqerionx?stkn=MTR0MjhnbGgxNDJnNQ%3D%3D"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium text-white shadow-md hover:scale-105 transition-transform"
          style={{ background: 'linear-gradient(135deg, #f09433, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888)' }}
        >
          <Instagram className="h-3.5 w-3.5" />
          Follow us on Instagram
        </a>
        <a
          href="https://github.com/monu-2008/hush"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium text-white bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-md hover:scale-105 transition-transform"
        >
          <Github className="h-3.5 w-3.5" />
          GitHub
        </a>
      </div>

      <div className="mt-5 text-xs text-muted-foreground flex items-center justify-center gap-1">
        Made with <Heart className="h-3 w-3 text-pink-500 fill-pink-500" /> in India
      </div>
    </footer>
  )
}
