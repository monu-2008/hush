# Vercel Web Analytics — Add to Hush

## Files in this ZIP

1. `README.md` — analytics section added
2. `src/app/layout.tsx` — `<Analytics />` component added
3. `package.json` — `@vercel/analytics` dependency added
4. `bun.lock` — updated lockfile

## Steps

### 1. Files paste kar
- `README.md` → root overwrite
- `src/app/layout.tsx` → overwrite
- `package.json` → overwrite
- `bun.lock` → overwrite (or delete, npm will regenerate)

### 2. Install
```bash
npm install
# or
bun install
```

### 3. Local test
```bash
npm run dev
# http://localhost:3000 — page load pe analytics script load hoga
# Check Network tab — `va.vercel-scripts.com/v1/script.debug.js` dikhega
# Local pe data track nahi hota, sirf production pe
```

### 4. Push
```bash
git add -A
git commit -m "feat: add Vercel Web Analytics"
git push origin main
```

### 5. Vercel dashboard pe enable
1. https://vercel.com/dashboard → apne `hush` project khol
2. Left sidebar me **Analytics** tab click kar
3. **"Enable"** button dabao
4. Done! 24 hours me data aana shuru hoga

## Kya track hoga:
- Page views (per route)
- Unique visitors
- Referrers
- Browser, OS, device, country
- NO cookies, NO personal data — privacy-friendly
