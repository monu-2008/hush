'use client'

import { useCallback, useState } from 'react'

export type CarrierKind = 'emoji' | 'image' | 'lsb' | 'qr' | 'audio'

export interface HushStats {
  encoded: number
  decoded: number
  byCarrier: Record<CarrierKind, number>
  achievements: Record<string, boolean>
}

const KEY = 'hush-stats-v1'
const ACHIEVEMENT_IDS = [
  'first_encode', 'encode_10', 'encode_50',
  'first_decode', 'decode_10',
  'used_decoy', 'used_lsb', 'used_audio', 'used_qr',
  'love_letter', 'time_capsule', 'installed_pwa',
] as const

const DEFAULT: HushStats = {
  encoded: 0,
  decoded: 0,
  byCarrier: { emoji: 0, image: 0, lsb: 0, qr: 0, audio: 0 },
  achievements: {},
}

function load(): HushStats {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT, achievements: {} }
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT,
      ...parsed,
      byCarrier: { ...DEFAULT.byCarrier, ...(parsed.byCarrier || {}) },
      achievements: { ...(parsed.achievements || {}) },
    }
  } catch {
    return { ...DEFAULT, achievements: {} }
  }
}

export function useStats() {
  const [stats, setStats] = useState<HushStats>(() => {
    if (typeof window === 'undefined') return { ...DEFAULT, achievements: {} }
    return load()
  })

  const persist = useCallback((next: HushStats) => {
    setStats(next)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
  }, [])

  const recordEncode = useCallback((carrier: CarrierKind, opts: { decoy?: boolean; lsb?: boolean; audio?: boolean; qr?: boolean; love?: boolean; capsule?: boolean } = {}) => {
    setStats((prev) => {
      const next = { ...prev, encoded: prev.encoded + 1, byCarrier: { ...prev.byCarrier, [carrier]: prev.byCarrier[carrier] + 1 } }
      const a = { ...prev.achievements }
      a.first_encode = true
      if (next.encoded >= 10) a.encode_10 = true
      if (next.encoded >= 50) a.encode_50 = true
      if (opts.decoy) a.used_decoy = true
      if (opts.lsb) a.used_lsb = true
      if (opts.audio) a.used_audio = true
      if (opts.qr) a.used_qr = true
      if (opts.love) a.love_letter = true
      if (opts.capsule) a.time_capsule = true
      next.achievements = a
      persist(next)
      return next
    })
  }, [persist])

  const recordDecode = useCallback(() => {
    setStats((prev) => {
      const next = { ...prev, decoded: prev.decoded + 1 }
      const a = { ...prev.achievements }
      a.first_decode = true
      if (next.decoded >= 10) a.decode_10 = true
      next.achievements = a
      persist(next)
      return next
    })
  }, [persist])

  const unlockPwa = useCallback(() => {
    setStats((prev) => {
      const next = { ...prev, achievements: { ...prev.achievements, installed_pwa: true } }
      persist(next)
      return next
    })
  }, [persist])

  const reset = useCallback(() => {
    const fresh = { ...DEFAULT, achievements: {} }
    persist(fresh)
  }, [persist])

  return { stats, recordEncode, recordDecode, unlockPwa, reset, achievementIds: ACHIEVEMENT_IDS }
}
