# Hush v2 Update — Files to add

## What's new in v2

1. **4 pills** — Encode | Decode | Encryption | Settings
2. **Encryption page** — Hinglish savage roast + actual code snippets + English toggle
3. **AI Chatbot** — Savage roast, 4 languages, "roast me" easter egg
4. **Settings page** — Theme picker, language, dark/light, stats, install, about, social links
5. **New Footer** — Gradient AQERIONX (→ aqerionx.in), Instagram + GitHub pill buttons
6. **Enhanced Aurora background** — 4 blobs, smoother animation, mix-blend-mode

## Files to add/update

### New files (add kar)
- `src/app/api/chat/route.ts` — AI chatbot backend
- `src/components/hush/encryption-view.tsx` — Encryption explanation page
- `src/components/hush/settings-view.tsx` — Settings page
- `src/components/hush/chatbot.tsx` — Chatbot frontend widget
- `src/components/hush/footer.tsx` — New footer

### Modified files (overwrite kar)
- `src/app/page.tsx` — 4-pill tab system
- `src/app/globals.css` — Aurora background enhance

## After paste — verify

```bash
bun run dev
# http://localhost:3000 khol
# Try: Encryption tab → Hinglish toggle → Chatbot → "roast me"
# Try: Settings tab → theme/lang switch
# Try: Encode → Decode (purana flow still works)
```

## Push kar

```bash
git add -A
git commit -m "feat: v2 — encryption page, AI chatbot, settings page, new footer, aurora bg"
git push origin main
```

Vercel auto-deploy hoga. 2-3 min me live.
