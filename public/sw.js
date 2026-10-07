const CACHE = 'hush-v1'
const ASSETS = ['/', '/manifest.webmanifest', '/icon.svg']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(() => {}))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  )
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET') return
  // Network-first for navigation, cache-first for assets
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).then((res) => {
        const copy = res.clone()
        caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {})
        return res
      }).catch(() => caches.match(request).then((r) => r || caches.match('/')))
    )
    return
  }
  e.respondWith(caches.match(request).then((r) => r || fetch(request).catch(() => r)))
})
