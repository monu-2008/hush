# Hush Premium PWA — Full Project Files

## Installation

1. **Setup Next.js project** (agar pehle se nahi hai):
```bash
bun create next-app hush --typescript --tailwind --app
cd hush
```

2. **Install dependencies**:
```bash
bun add qrcode jsqr framer-motion next-themes sonner lucide-react
bun add -d @types/qrcode
```

3. **Add shadcn/ui components**:
```bash
bunx shadcn@latest init
bunx shadcn@latest add button input textarea label switch select badge dialog accordion dropdown-menu tooltip progress tabs toast sonner
```

4. **Copy files** from this ZIP into your project (overwrite existing):
```
src/app/page.tsx
src/app/layout.tsx
src/app/globals.css
src/components/theme-provider.tsx
src/components/i18n-provider.tsx
src/components/hush/topbar.tsx
src/components/hush/encode-panel.tsx
src/components/hush/decode-panel.tsx
src/components/hush/how-it-works.tsx
src/components/hush/stats-dialog.tsx
src/components/hush/theme-dialog.tsx
src/components/hush/install-banner.tsx
src/lib/hush-core.ts
src/lib/i18n.ts
src/lib/qr.ts
src/hooks/use-stats.ts
src/hooks/use-pwa.ts
public/manifest.webmanifest
public/sw.js
public/icon.svg
public/extension/ (folder)
public/hush-extension.zip
```

5. **Run**:
```bash
bun run dev
```

Open http://localhost:3000

## Features
- 5 carriers: emoji (VS), PNG chunk, Pixel LSB, QR, WAV audio
- Decoy messages, auto-expiry, burn-after-read
- Love letter mode, time capsule
- 4 languages (en/hi/es/ar) with RTL
- 5 themes
- PWA installable
- Stats + 12 achievements
- Chrome extension in /extension folder

By AQERIONX
