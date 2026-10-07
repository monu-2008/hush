# Hush — Premium Private Messages PWA

By AQERIONX. Next.js 16 + TypeScript + Tailwind 4 + shadcn/ui + Framer Motion.

## Quick Start

```bash
bun install
bun run dev
```

Open http://localhost:3000

## Features

- **5 Carriers**: Emoji (Variation Selectors, Instagram-safe), PNG chunk, Pixel LSB, QR code, WAV audio
- **Security**: AES-256-GCM + PBKDF2-SHA-256 (310k iterations), decoy messages, auto-expiry, burn-after-read, password hint
- **Fun**: Love letter mode (hearts animation), Time capsule (date-locked)
- **PWA**: Installable, offline-capable, install banner
- **i18n**: English, Hindi, Spanish, Arabic (with RTL)
- **Themes**: 5 premium themes (Violet, Aurora, Sunset, Rose, Ocean) + dark/light mode
- **Stats**: Local-only activity tracking with 12 achievements
- **Chrome Extension**: Manifest V3, files in /public/extension/

## Deploy

Works on Vercel, Netlify, or any Next.js host. No backend, no database.

```bash
vercel
```

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- React 19
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui (New York)
- Framer Motion
- qrcode + jsqr
- Web Crypto API

By AQERIONX
