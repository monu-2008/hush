# 🔐 Hush — Private Messages in Plain Sight

**Hush** ek privacy-focused web app hai jo tumhare message ko encrypt karke emoji, image, QR code, ya audio file me chhupata hai. Recipient ko sirf emoji dikhta hai — andar poora encrypted payload chhupa hota hai. Bina strong password ke koi nahi padh sakta — na Instagram, na WhatsApp, na current supercomputers.

> Built by [**AQERIONX**](https://aqerionx.in) · [Instagram](https://www.instagram.com/aqerionx) · [GitHub](https://github.com/monu-2008/hush)

---

## ✨ Features

### 🔥 5 Carriers (sab Instagram-safe)

| Carrier | Kaise kaam karta | Use case |
|---------|------------------|----------|
| **Emoji + Variation Selectors** | Encrypted payload ko U+FE00–U+FE0F invisible chars me convert | Instagram/WhatsApp DM |
| **PNG chunk** | "huSH" naam ka custom chunk image metadata me | Email, file share |
| **Pixel LSB** | LSB of RGB pixels me hide (true steganography) | Stealth mode |
| **QR code** | Encrypted payload QR me encode | Scan & decrypt |
| **WAV audio** | 16-bit PCM samples ke LSB me | Audio carrier |

### 🛡️ Security

- **AES-256-GCM** — military grade encryption (banks bhi yahi use karte)
- **PBKDF2-SHA-256** — 310,000 iterations (brute force = impossible)
- **Decoy messages** — real + fake password, plausible deniability
- **Auto-expiry** — 1 hour / 1 day / 7 days
- **Burn-after-read** — 30s me clipboard auto-clear
- **Password hint** — optional, recipient ke liye
- **Password generator** — 16-char strong password one-click
- **Password strength meter** — live feedback

### 🎨 Premium UI

- Animated aurora background (5 blobs + twinkle stars)
- Glassmorphism with multi-layer blur
- 5 themes (Violet, Aurora, Sunset, Rose, Ocean) + Dark/Light mode
- Framer Motion spring animations
- Pill navbar with burger menu
- Toast notifications

### 🌍 i18n (4 languages)

- English, Hindi, Spanish, Arabic (with RTL auto-support)

### 🤖 AI Chatbot (Savage Roast Mode)

- Rule-based, no external API needed
- 4 languages me savage replies
- "roast me" likho to full savage roast 🔥
- Hinglish default, English/Spanish/Arabic support

### 📱 PWA

- Installable, offline-capable
- Service worker caching
- Native app feel

### 🎯 Fun Features

- **Love letter mode** — hearts animation on decrypt
- **Time capsule** — date-locked messages
- **12 Achievements** — local-only, privacy safe
- **Stats dashboard** — encoded/decoded count, by-carrier breakdown

### 🧩 Chrome Extension

- Manifest V3, available in `/public/extension/`
- One-click encrypt from any page
- Auto-prefills message with active tab's selection

---

## 🚀 Quick Start

### Requirements

- Node.js 20+ or Bun
- npm ya bun

### Install

```bash
git clone https://github.com/monu-2008/hush.git
cd hush
npm install
```

### Run dev

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
npm start
```

---

## 📦 Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **UI:** shadcn/ui (New York) + Lucide icons
- **Animation:** Framer Motion
- **Crypto:** Web Crypto API (browser-native)
- **QR:** qrcode + jsqr
- **Chatbot:** Rule-based (no external AI SDK)
- **PWA:** manifest + service worker

---

## 🗂 Project Structure

```
hush/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main page — 3 pills (Encode/Decode/Encryption)
│   │   ├── layout.tsx            # Metadata, PWA, fonts
│   │   ├── globals.css           # Aurora background, themes, glass
│   │   └── api/chat/route.ts     # Rule-based chatbot backend
│   ├── components/
│   │   ├── theme-provider.tsx
│   │   ├── i18n-provider.tsx
│   │   └── hush/
│   │       ├── topbar.tsx        # Pill navbar + burger settings
│   │       ├── encode-panel.tsx  # Encode flow — 5 carriers + advanced
│   │       ├── decode-panel.tsx  # Decode flow — 4 modes
│   │       ├── encryption-view.tsx  # Hinglish explanation + code
│   │       ├── settings-view.tsx # Full settings page
│   │       ├── chatbot.tsx       # Savage chatbot UI
│   │       ├── how-it-works.tsx  # 3-step guide + FAQ
│   │       ├── footer.tsx        # Gradient AQERIONX + Insta + GitHub
│   │       └── install-banner.tsx
│   ├── lib/
│   │   ├── hush-core.ts          # AES-GCM, VS encoding, LSB, WAV, decoy
│   │   ├── i18n.ts               # 4-language dictionary
│   │   └── qr.ts                 # QR encode/decode
│   └── hooks/
│       ├── use-stats.ts          # localStorage stats + achievements
│       └── use-pwa.ts            # Install prompt + SW registration
└── public/
    ├── manifest.webmanifest
    ├── sw.js
    ├── icon.svg
    └── extension/                # Chrome extension source
```

---

## 🔐 Encryption Kaise Kaam Karta Hai

### Process

```
Tumhara message + password
        ↓
  Browser me encrypt (AES-256-GCM)
        ↓
  Encrypted payload (gibberish)
        ↓
  Emoji / PNG / QR / Audio me hide
        ↓
  Recipient ke paas bhej
        ↓
  Recipient password daale
        ↓
  Browser me decrypt → original message
```

### Koi aur padh sakta?

| Scenario | Padh sakta? | Kyu? |
|----------|-------------|------|
| Instagram/WhatsApp server pe | ❌ Nahi | Sirf emoji dikhta, payload invisible chars me |
| Instagram staff scan kare | ❌ Nahi | Encrypted payload gibberish hai |
| Screenshot le | ❌ Nahi | Sirf emoji, payload nahi dikhta |
| Hacker payload extract kare | ❌ Nahi | Encrypted hai, password nahi to break nahi |
| Recipient ke paas password + emoji | ✅ Padh sakta | Tabhi decrypt hoga |

### Quantum Computer se tod sakte?

Honestly batau — quantum computers AES-256 ko **weak** karte hain (Grover's algorithm se 2²⁵⁶ → 2¹²⁸), lekin "tod" nahi sakta. 2¹²⁸ combinations bhi abhi ke quantum computers (~1000 qubits) ke liye infeasible hai — 256+ million qubits chahiye. Lekin agar tumhara password 8 char ka hai, to quantum+classical combo usse faster tod sakta hai. **Hush "quantum safe" claim nahi karta** — hum sirf itna bolte hain ki "abhi ke technology se practically infeasible". Isliye 12+ char strong password use kar, password generator use kar.

---

## 🚢 Deploy

### Vercel (recommended)

```bash
npm i -g vercel
vercel
```

Vercel automatically Next.js detect kar lega. No environment variables needed — sab kuch client-side hai.

### Other hosts

Kisi bhi Next.js supporting host pe kaam karega — Netlify, Railway, Render, etc.

---

## 📜 License

MIT — free to use, modify, distribute.

---

## 🙏 Acknowledgements

Built by **AQERIONX** using:
- Web Crypto API (browser-native cryptography)
- Next.js, React, Tailwind CSS, shadcn/ui
- Open web standards

---

## 🔗 Links

- **Website:** [hush.aqerionx.in](https://hush.aqerionx.in)
- **GitHub:** [github.com/monu-2008/hush](https://github.com/monu-2008/hush)
- **Instagram:** [@aqerionx](https://www.instagram.com/aqerionx)
- **AQERIONX:** [aqerionx.in](https://aqerionx.in)

---

Made with ❤️ in India · **Hush** by **AQERIONX**
