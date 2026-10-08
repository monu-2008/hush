# Hush v2 — Full Files (FIXED — no z-ai-web-dev-sdk)

## ⚠️ Build Error Fix
Pehle `z-ai-web-dev-sdk` use kar raha tha jo Z.ai ka internal SDK hai — Vercel pe install nahi hota.
Ab chatbot **rule-based** hai — koi external AI SDK nahi chahiye. Pattern matching + savage responses.

## Files in this ZIP

### src/app/
- `page.tsx` — 4-pill system (Encode/Decode/Encryption/Settings)
- `globals.css` — Aurora background
- `layout.tsx` — metadata, PWA, fonts
- `api/chat/route.ts` — Rule-based chatbot backend (NO z-ai-web-dev-sdk)

### src/components/
- `theme-provider.tsx` — theme context
- `i18n-provider.tsx` — language context
- `hush/topbar.tsx` — pill navbar + settings drawer
- `hush/encode-panel.tsx` — encode flow
- `hush/decode-panel.tsx` — decode flow
- `hush/how-it-works.tsx` — guide + FAQ
- `hush/stats-dialog.tsx` — stats dialog (optional, not used in v2 but kept)
- `hush/theme-dialog.tsx` — theme dialog (optional, not used in v2 but kept)
- `hush/install-banner.tsx` — PWA install banner
- `hush/encryption-view.tsx` — NEW — Encryption explanation page (Hinglish/English)
- `hush/settings-view.tsx` — NEW — Settings page (4th pill)
- `hush/chatbot.tsx` — NEW — Chatbot frontend
- `hush/footer.tsx` — NEW — Footer with AQERIONX + Insta + GitHub

## Install steps

1. Unzip
2. Files paste kar apne repo me (overwrite existing)
3. `npm install` (ya `bun install`)
4. `npm run dev` (ya `bun run dev`)
5. Test:
   - http://localhost:3000 khol
   - Encryption tab → Hinglish toggle → Chatbot → "roast me"
   - Settings tab → theme/lang switch
6. Push:
   ```bash
   git add -A
   git commit -m "feat: v2 — encryption page, rule-based chatbot, settings, footer, aurora"
   git push origin main
   ```

## Verify chatbot works
- "Bhai ye Instagram pe chalega?" → savage reply
- "roast me" → full savage roast
- "quantum computer?" → quantum roast

No external API key needed. No AI SDK needed. Pure rule-based. Works on Vercel out of box.
