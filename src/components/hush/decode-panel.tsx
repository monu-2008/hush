'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Lock, Copy, Check, Flame, Clock, AlertTriangle, Heart, Upload, QrCode, Music, Smile, Image as ImageIcon, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useI18n } from '@/components/i18n-provider'
import { readEmojiMessage, findPayload, decodeLsb, decodeWavLsb, decryptMessage } from '@/lib/hush-core'
import { decodeQrFromFile } from '@/lib/qr'
import { useStats } from '@/hooks/use-stats'

type DecodeMode = 'emoji' | 'image' | 'audio' | 'qr'

export function DecodePanel() {
  const { t } = useI18n()
  const { recordDecode } = useStats()

  const [mode, setMode] = useState<DecodeMode>('emoji')
  const [emojiText, setEmojiText] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [imageName, setImageName] = useState('')
  const [audioName, setAudioName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [decrypting, setDecrypting] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [result, setResult] = useState<{ message: string; hint?: string; expired: boolean; burn: boolean; isDecoy: boolean; loveMode: boolean } | null>(null)
  const [hearts, setHearts] = useState<number[]>([])

  const imageInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const qrVideoRef = useRef<HTMLVideoElement>(null)
  const qrStreamRef = useRef<MediaStream | null>(null)
  const qrScanRef = useRef<number | null>(null)
  const [qrScanning, setQrScanning] = useState(false)

  const modes: { code: DecodeMode; icon: any; label: string }[] = [
    { code: 'emoji', icon: Smile, label: t('decode.mode.emoji') },
    { code: 'image', icon: ImageIcon, label: t('decode.mode.image') },
    { code: 'audio', icon: Music, label: t('decode.mode.audio') },
    { code: 'qr', icon: QrCode, label: t('decode.mode.qr') },
  ]

  const handleImageSelect = useCallback((file: File | null) => {
    if (!file) return
    if (file.type !== 'image/png' && !file.name.toLowerCase().endsWith('.png')) {
      toast.error('Choose the original PNG container.')
      return
    }
    if (file.size > 25 * 1024 * 1024) { toast.error('File over 25 MB.'); return }
    setImageFile(file)
    setImageName(file.name)
  }, [])

  const handleAudioSelect = useCallback((file: File | null) => {
    if (!file) return
    if (file.type !== 'audio/wav' && !file.name.toLowerCase().endsWith('.wav')) {
      toast.error('Choose a WAV file.')
      return
    }
    if (file.size > 25 * 1024 * 1024) { toast.error('File over 25 MB.'); return }
    setAudioFile(file)
    setAudioName(file.name)
  }, [])

  // QR scanning
  const stopQrScan = useCallback(() => {
    if (qrScanRef.current) { cancelAnimationFrame(qrScanRef.current); qrScanRef.current = null }
    if (qrStreamRef.current) { qrStreamRef.current.getTracks().forEach((t) => t.stop()); qrStreamRef.current = null }
    setQrScanning(false)
  }, [])

  const startQrScan = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      qrStreamRef.current = stream
      setQrScanning(true)
      if (qrVideoRef.current) {
        qrVideoRef.current.srcObject = stream
        qrVideoRef.current.play()
      }
      const scan = () => {
        if (!qrVideoRef.current || !qrStreamRef.current) return
        const v = qrVideoRef.current
        if (v.readyState === v.HAVE_ENOUGH_DATA) {
          const canvas = document.createElement('canvas')
          canvas.width = v.videoWidth
          canvas.height = v.videoHeight
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(v, 0, 0)
          // Use dynamic import to avoid SSR
          import('jsqr').then(({ default: jsQR }) => {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            const code = jsQR(imageData.data, imageData.width, imageData.height)
            if (code?.data) {
              setEmojiText(code.data) // reuse as envelope carrier
              stopQrScan()
              toast.success('QR code scanned.')
              return
            }
            qrScanRef.current = requestAnimationFrame(scan)
          })
          return
        }
        qrScanRef.current = requestAnimationFrame(scan)
      }
      qrScanRef.current = requestAnimationFrame(scan)
    } catch (e: any) {
      toast.error('Camera access denied or unavailable. Upload a QR image instead.')
    }
  }, [stopQrScan])

  useEffect(() => () => stopQrScan(), [stopQrScan])

  const handleDecode = async () => {
    setDecrypting(true)
    setStatusText(t('decode.status.reading'))
    setResult(null)
    try {
      if (!password) throw new Error(t('decode.password.label') + ' is required.')
      let envelope: string
      let usedLsb = false
      if (mode === 'emoji') {
        if (!emojiText.trim()) throw new Error(t('decode.emoji.label') + ' is required.')
        envelope = readEmojiMessage(emojiText)
      } else if (mode === 'image') {
        if (!imageFile) throw new Error('Choose the PNG.')
        const bytes = new Uint8Array(await imageFile.arrayBuffer())
        // Try chunk first, fall back to LSB
        try { envelope = findPayload(bytes) }
        catch {
          // Try LSB: draw to canvas
          const bitmap = await createImageBitmap(imageFile)
          const canvas = document.createElement('canvas')
          canvas.width = bitmap.width
          canvas.height = bitmap.height
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(bitmap, 0, 0)
          bitmap.close()
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          envelope = decodeLsb(imageData)
          usedLsb = true
        }
      } else if (mode === 'audio') {
        if (!audioFile) throw new Error('Choose the WAV.')
        const bytes = new Uint8Array(await audioFile.arrayBuffer())
        envelope = decodeWavLsb(bytes)
      } else {
        // QR — emojiText holds the envelope after scan/upload
        if (!emojiText) throw new Error('Scan or upload a QR code first.')
        envelope = emojiText
      }

      const res = await decryptMessage(envelope, password)
      const loveMode = res.hint?.includes('♡love') || false
      const isCapsule = res.hint?.includes('⏱capsule') || false
      // Check capsule not-before
      if (isCapsule && res.expired) {
        // expired marker for capsule is negative; check negative expiry
        const env = JSON.parse(envelope)
        if (env.expiresAt && env.expiresAt < 0) {
          const unlockAt = -env.expiresAt
          if (Date.now() < unlockAt) {
            const until = new Date(unlockAt).toLocaleString()
            setResult({ message: '', hint: res.hint, expired: true, burn: res.burnAfterRead, isDecoy: res.isDecoy, loveMode })
            setStatusText(`Time capsule: unlocks at ${until}`)
            setDecrypting(false)
            return
          }
        }
      }

      setResult({
        message: res.message,
        hint: res.hint?.replace(/ · [♡⏱].*/g, ''),
        expired: res.expired && !isCapsule,
        burn: res.burnAfterRead,
        isDecoy: res.isDecoy,
        loveMode,
      })
      setStatusText(t('decode.status.done'))
      recordDecode()

      if (loveMode) {
        // Spawn hearts
        const ids = Array.from({ length: 12 }, (_, i) => Date.now() + i)
        setHearts(ids)
        setTimeout(() => setHearts([]), 4000)
      }

      // Burn after read
      if (res.burnAfterRead) {
        try {
          await navigator.clipboard.writeText(res.message)
          toast.success('Copied to clipboard. Will clear in 30 seconds.')
          setTimeout(() => {
            navigator.clipboard.writeText('').catch(() => {})
            toast.info('Clipboard cleared (burn-after-read).')
          }, 30000)
        } catch {}
      }

      toast.success(res.isDecoy ? t('decode.result.decoy') : t('decode.status.done'))
    } catch (e: any) {
      setStatusText(e.message || 'Could not open this message.')
      toast.error(e.message || 'Could not open this message.')
    } finally {
      setDecrypting(false)
    }
  }

  const copyMessage = async () => {
    if (!result?.message) return
    try {
      await navigator.clipboard.writeText(result.message)
      toast.success('Copied.')
    } catch { toast.error('Could not copy.') }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-6 relative">
      {/* Floating hearts for love mode */}
      <AnimatePresence>
        {hearts.length > 0 && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {hearts.map((id, i) => (
              <motion.div
                key={id}
                className="absolute text-3xl"
                style={{ left: `${10 + i * 7}%`, bottom: '20%' }}
                initial={{ opacity: 0, y: 0, scale: 0.5 }}
                animate={{ opacity: 1, y: -300, scale: 1.4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 3, delay: i * 0.1 }}
              >
                {['❤️', '💜', '💖', '💕', '💗'][i % 5]}
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <div className="space-y-5">
        <div className="text-center lg:text-left">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Open a message</div>
          <h2 className="text-2xl font-semibold">Have a secret?</h2>
          <p className="text-sm text-muted-foreground mt-1">{t('decode.subtitle')}</p>
        </div>

        {/* Mode tabs */}
        <div className="flex flex-wrap gap-2">
          {modes.map((m) => {
            const Icon = m.icon
            const active = mode === m.code
            return (
              <button
                key={m.code}
                onClick={() => { setMode(m.code); setResult(null); setStatusText('') }}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  active ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {m.label}
              </button>
            )
          })}
        </div>

        {/* Emoji paste */}
        {mode === 'emoji' && (
          <div className="space-y-2">
            <Label htmlFor="decode-emoji" className="text-sm font-medium">{t('decode.emoji.label')}</Label>
            <Textarea
              id="decode-emoji"
              value={emojiText}
              onChange={(e) => setEmojiText(e.target.value)}
              placeholder={t('decode.emoji.placeholder')}
              rows={3}
              className="resize-none fancy-scroll"
            />
            <p className="text-xs text-muted-foreground">{t('decode.emoji.help')}</p>
          </div>
        )}

        {/* Image upload */}
        {mode === 'image' && (
          <div className="space-y-2">
            <input ref={imageInputRef} type="file" accept="image/png" hidden onChange={(e) => handleImageSelect(e.target.files?.[0] || null)} />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleImageSelect(e.dataTransfer.files[0]) }}
              className="w-full rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 p-5 text-center transition-all"
            >
              <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              <div className="font-medium text-sm">{imageName || t('decode.image.drop')}</div>
              <div className="text-xs text-muted-foreground mt-1">{t('decode.image.format')}</div>
            </button>
          </div>
        )}

        {/* Audio upload */}
        {mode === 'audio' && (
          <div className="space-y-2">
            <input ref={audioInputRef} type="file" accept="audio/wav,.wav" hidden onChange={(e) => handleAudioSelect(e.target.files?.[0] || null)} />
            <button
              type="button"
              onClick={() => audioInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleAudioSelect(e.dataTransfer.files[0]) }}
              className="w-full rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 p-5 text-center transition-all"
            >
              <Music className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              <div className="font-medium text-sm">{audioName || t('decode.audio.drop')}</div>
              <div className="text-xs text-muted-foreground mt-1">{t('decode.audio.format')}</div>
            </button>
          </div>
        )}

        {/* QR scan / upload */}
        {mode === 'qr' && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{t('decode.qr.help')}</p>
            {qrScanning ? (
              <div className="rounded-xl overflow-hidden border">
                <video ref={qrVideoRef} className="w-full h-48 object-cover" playsInline muted />
                <div className="p-2 bg-muted/40">
                  <Button onClick={stopQrScan} variant="outline" size="sm" className="w-full">Stop camera</Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={startQrScan} variant="default" className="gap-2"><Camera className="h-4 w-4" /> Scan with camera</Button>
                <Button
                  onClick={() => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.onchange = async () => {
                    const f = inp.files?.[0]
                    if (f) {
                      const data = await decodeQrFromFile(f)
                      if (data) { setEmojiText(data); toast.success('QR decoded from image.') }
                      else toast.error('No QR code found in image.')
                    }
                  }; inp.click() }}
                  variant="outline" className="gap-2"
                >
                  <Upload className="h-4 w-4" /> Upload QR image
                </Button>
              </div>
            )}
            {emojiText && <Badge variant="secondary" className="text-xs">QR payload loaded ({emojiText.length} chars)</Badge>}
          </div>
        )}

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="decode-password" className="text-sm font-medium">{t('decode.password.label')}</Label>
          <div className="relative">
            <Input
              id="decode-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('decode.password.placeholder')}
              className="pr-10"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              type="button"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          onClick={handleDecode}
          disabled={decrypting || !password}
          size="lg"
          className="w-full gap-2 text-base"
        >
          {decrypting ? (
            <><span className="h-4 w-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" /> {t('decode.status.reading')}</>
          ) : (
            <><Lock className="h-4 w-4" /> {t('decode.button')}</>
          )}
        </Button>
        {statusText && <p className="text-sm text-center text-muted-foreground">{statusText}</p>}

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border bg-muted/20 p-4 space-y-3"
            >
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <strong>{t('decode.result.title')}</strong>
                {result.isDecoy && <Badge variant="outline" className="text-xs">{t('decode.result.decoy')}</Badge>}
                {result.loveMode && <Badge variant="outline" className="text-xs text-pink-500"><Heart className="h-3 w-3" /> Love letter</Badge>}
              </div>
              {result.hint && <div className="text-xs text-muted-foreground">Hint: {result.hint}</div>}
              {result.expired ? (
                <div className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  {t('decode.result.expired')}
                </div>
              ) : result.message ? (
                <>
                  <div className="rounded-lg bg-background p-3 text-sm whitespace-pre-wrap break-words fancy-scroll max-h-72 overflow-y-auto">
                    {result.message}
                  </div>
                  <Button onClick={copyMessage} variant="outline" size="sm" className="gap-1.5"><Copy className="h-3.5 w-3.5" /> {t('decode.result.copy')}</Button>
                  {result.burn && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                      <Flame className="h-3 w-3" /> {t('decode.result.burn')}
                    </div>
                  )}
                </>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="hidden lg:block space-y-4">
        <div className="glass rounded-2xl p-5">
          <div className="relative h-48 mb-3 grid place-items-center">
            <div className="absolute inset-0 grid place-items-center">
              <div className="h-32 w-32 rounded-full border-2 border-dashed border-primary/40 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
            <Lock className="h-10 w-10 text-primary relative" />
          </div>
          <div className="text-sm font-medium text-center">Only the right password works.</div>
          <p className="text-xs text-muted-foreground text-center mt-1">Each message is encrypted with AES-256-GCM. Your password is never sent anywhere.</p>
        </div>
      </div>
    </div>
  )
}
