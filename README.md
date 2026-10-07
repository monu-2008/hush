# Vercel 404 Fix

## Problem
Vercel pe 404 aa raha tha kyunki:
1. `next.config.ts` me `output: "standalone"` tha — Vercel ke liye nahi chahiye
2. `package.json` me self-hosting wala build script tha

## Fix
1. `next.config.ts` ko is file se replace kar (output: standalone hata diya)
2. `package.json` ko is file se replace kar (simple build script)
3. Delete `bun.lock` (Vercel npm use karega)
4. Commit + push

## Commands
```bash
rm bun.lock
git add -A
git commit -m "fix: Vercel build — remove standalone output, simplify build script"
git push origin main
```

5 min wait kar, Vercel auto-redeploy hoga. Site live ho jayegi.
