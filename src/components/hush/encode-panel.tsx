'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Sparkles, Lock, ArrowUpRight, Download, Copy, Check, RotateCcw, Settings2, Heart, Clock, Flame, FileImage, QrCode, Music, Smile, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { useI18n } from '@/components/i18n-provider'
import {
  encryptMessage, isSingleEmoji, passwordStrength, generatePassword,
  makeEmojiMessage, addPayloadToPng, encodeLsb,
  encodeWavLsb, type EnvelopeOptions,
} from '@/lib/hush-core'
import { makeQrDataUrl } from '@/lib/qr'
import { type CarrierKind, useStats } from '@/hooks/use-stats'

type Carrier = CarrierKind

const EMOJI_PRESETS = ['😊', '🌙', '❤️', '🔥', '✨', '🍀', '💜', '🤫', '🌈', '⭐']

export function EncodePanel() {
  const { t } = useI18n()
  const { recordEncode } = useStats()

  const [message, setMessage] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [emoji, setEmoji] = useState('😊')

  const [carrier, setCarrier] = useState<Carrier>('emoji')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [imageName, setImageName] = useState('')
  const [audioName, setAudioName] = useState('')

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [decoyMessage, setDecoyMessage] = useState('')
  const [decoyPassword, setDecoyPassword] = useState('')
  const [expiry, setExpiry] = useState('never')
  const [burnAfterRead, setBurnAfterRead] = useState(false)
  const [hint, setHint] = useState('')

  const [loveMode, setLoveMode] = useState(false)
  const [capsuleMode, setCapsuleMode] = useState(false)
  const [capsuleDate, setCapsuleDate] = useState('')

  const [encrypting, setEncrypting] = useState(false)
  const [output, setOutput] = useState<{
    kind: Carrier
    emojiMessage?: string
    pngBlob?: Blob
    pngName?: string
    audioBlob?: Blob
    audioName?: string
    qrDataUrl?: string
  } | null>(null)
  const [statusText, setStatusText] = useState('')
  const [copiedEmoji, setCopiedEmoji] = useState(false)
  const [copiedImage, setCopiedImage] = useState(false)

  const imageInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)

  const strength = passwordStrength(password)

  const handleImageSelect = useCallback((file: File | null) => {
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
      toast.error('Please choose a PNG, JPG, WebP or GIF image.')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Image is over 20 MB. Choose a smaller image.')
      return
    }
    setImageFile(file)
    setImageName(file.name)
  }, [])

  const handleAudioSelect = useCallback((file: File | null) => {
    if (!file) return
    if (file.type !== 'audio/wav' && !file.name.toLowerCase().endsWith('.wav')) {
      toast.error('Please choose a 16-bit WAV file.')
      return
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error('Audio is over 25 MB.')
      return
    }
    setAudioFile(file)
    setAudioName(file.name)
  }, [])

  const reset = () => {
    setMessage('')
    setPassword('')
    setDecoyMessage('')
    setDecoyPassword('')
    setHint('')
    setExpiry('never')
    setBurnAfterRead(false)
    setLoveMode(false)
    setCapsuleMode(false)
    setCapsuleDate('')
    setImageFile(null)
    setImageName('')
    setAudioFile(null)
    setAudioName('')
    setOutput(null)
    setStatusText('')
  }

  const handleEncode = async () => {
    setEncrypting(true)
    setStatusText(t('encode.status.encrypting'))
    setOutput(null)
    try {
      const trimmed = message.trim()
      if (!trimmed) throw new Error(t('encode.message.label') + ' is required.')
      const msgBytes = new TextEncoder().encode(trimmed).length
      if (msgBytes > 700000) throw new Error('Message too large. Keep under 700 KB.')
      if (carrier === 'emoji' && msgBytes > 4000) throw new Error('For emoji chat, keep under 4 KB. Use image/QR/audio for longer messages.')
      if (password.length < 8) throw new Error('Password must be at least 8 characters.')
      if (decoyMessage && !decoyPassword) throw new Error('Decoy password is required when using a decoy message.')
      if (carrier === 'image' && !imageFile) throw new Error('Choose an image.')
      if (carrier === 'lsb' && !imageFile) throw new Error('Choose an image for pixel LSB.')
      if (carrier === 'audio' && !audioFile) throw new Error('Choose a WAV file.')
      if (carrier === 'emoji' && !isSingleEmoji(emoji)) throw new Error('Enter one emoji or emoji sequence.')

      // Build options
      const options: EnvelopeOptions = { hint: hint || undefined, burnAfterRead }
      if (expiry === '1h') options.expiresAt = Date.now() + 3600_000
      else if (expiry === '1d') options.expiresAt = Date.now() + 86400_000
      else if (expiry === '7d') options.expiresAt = Date.now() + 7 * 86400_000
      if (capsuleMode && capsuleDate) {
        const unlockAt = new Date(capsuleDate).getTime()
        if (!isNaN(unlockAt)) options.expiresAt = -(unlockAt) // negative = not-before marker
      }
      if (decoyMessage && decoyPassword) {
        // We use decoyPassword as the password for the decoy envelope.
        // The real password protects the real message. We pass decoy text as `decoy` option.
        // But our core uses single password; for two-password decoy we need to encrypt decoy with decoyPassword.
        // Simplification: encrypt decoy with decoyPassword here, embed as options.decoy.
        // We'll do this manually below.
        const decoyEnvelope = await encryptMessage(decoyMessage, decoyPassword)
        ;(options as any)._decoyEnvelope = decoyEnvelope
      }

      // Encrypt main message with main password
      let envelope = await encryptMessage(trimmed, password, undefined, { hint: options.hint, expiresAt: options.expiresAt, burnAfterRead: options.burnAfterRead })
      // If decoy envelope exists, splice it in
      if ((options as any)._decoyEnvelope) {
        const env = JSON.parse(envelope)
        env.decoy = (options as any)._decoyEnvelope
        envelope = JSON.stringify(env)
      }

      // Apply mode tags in hint
      if (loveMode || capsuleMode) {
        const env = JSON.parse(envelope)
        const tags: string[] = []
        if (loveMode) tags.push('♡love')
        if (capsuleMode) tags.push('⏱capsule')
        env.hint = (env.hint ? env.hint + ' · ' : '') + tags.join(' · ')
        envelope = JSON.stringify(env)
      }

      if (carrier === 'emoji') {
        const emojiMessage = makeEmojiMessage(emoji, envelope)
        setOutput({ kind: 'emoji', emojiMessage })
        setStatusText(t('encode.status.done.emoji'))
      } else if (carrier === 'image' || carrier === 'lsb') {
        if (!imageFile) throw new Error('Choose an image.')
        const bitmap = await createImageBitmap(imageFile)
        const scale = Math.min(1, 4096 / Math.max(bitmap.width, bitmap.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(bitmap.width * scale)
        canvas.height = Math.round(bitmap.height * scale)
        const ctx = canvas.getContext('2d', { alpha: true })!
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
        bitmap.close()
        let pngBlob: Blob
        if (carrier === 'lsb') {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const modified = encodeLsb(imageData, envelope)
          ctx.putImageData(modified, 0, 0)
          pngBlob = await new Promise((r, rej) => canvas.toBlob((b) => b ? r(b) : rej(new Error('toBlob failed')), 'image/png'))
        } else {
          pngBlob = await new Promise((r, rej) => canvas.toBlob((b) => b ? r(b) : rej(new Error('toBlob failed')), 'image/png'))
          const pngBytes = new Uint8Array(await pngBlob.arrayBuffer())
          const withPayload = addPayloadToPng(pngBytes, envelope)
          pngBlob = new Blob([withPayload], { type: 'image/png' })
        }
        const name = `${(imageFile.name.replace(/\.[^.]+$/, '') || 'image').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 40)}-hush.png`
        setOutput({ kind: carrier, pngBlob, pngName: name })
        setStatusText(t('encode.status.done.image'))
      } else if (carrier === 'qr') {
        const dataUrl = await makeQrDataUrl(envelope, 600)
        setOutput({ kind: 'qr', qrDataUrl: dataUrl })
        setStatusText(t('encode.status.done.qr'))
      } else if (carrier === 'audio') {
        if (!audioFile) throw new Error('Choose a WAV file.')
        const audioBytes = new Uint8Array(await audioFile.arrayBuffer())
        const modified = encodeWavLsb(audioBytes, envelope)
        const blob = new Blob([modified], { type: 'audio/wav' })
        const name = `${audioFile.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 40)}-hush.wav`
        setOutput({ kind: 'audio', audioBlob: blob, audioName: name })
        setStatusText(t('encode.status.done.audio'))
      }

      recordEncode(carrier, {
        decoy: !!decoyMessage,
        lsb: carrier === 'lsb',
        audio: carrier === 'audio',
        qr: carrier === 'qr',
        love: loveMode,
        capsule: capsuleMode,
      })

      toast.success(t('encode.output.ready'))
    } catch (e: any) {
      setStatusText(e.message || 'Something went wrong.')
      toast.error(e.message || 'Something went wrong.')
    } finally {
      setEncrypting(false)
    }
  }

  const copyEmoji = async () => {
    if (!output?.emojiMessage) return
    try {
      await navigator.clipboard.writeText(output.emojiMessage)
      setCopiedEmoji(true)
      toast.success(t('encode.output.copy.emoji.done'))
      setTimeout(() => setCopiedEmoji(false), 2600)
    } catch {
      toast.error('Clipboard unavailable. Try HTTPS.')
    }
  }

  const copyImage = async () => {
    if (!output?.pngBlob) return
    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') throw new Error('Image copy not supported. Download instead.')
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': output.pngBlob })])
      setCopiedImage(true)
      setTimeout(() => setCopiedImage(false), 1800)
      toast.success('Image copied to clipboard.')
    } catch (e: any) {
      toast.error(e.message || 'Could not copy image.')
    }
  }

  const download = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = name
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 30000)
  }

  const downloadQr = () => {
    if (!output?.qrDataUrl) return
    const a = document.createElement('a')
    a.href = output.qrDataUrl
    a.download = 'hush-qr.png'
    a.click()
  }

  const carrierOptions: { code: Carrier; icon: any; label: string; desc: string }[] = [
    { code: 'emoji', icon: Smile, label: t('encode.carrier.emoji'), desc: t('encode.carrier.emoji.desc') },
    { code: 'image', icon: ImageIcon, label: t('encode.carrier.image'), desc: t('encode.carrier.image.desc') },
    { code: 'lsb', icon: FileImage, label: t('encode.carrier.lsb'), desc: t('encode.carrier.lsb.desc') },
    { code: 'qr', icon: QrCode, label: t('encode.carrier.qr'), desc: t('encode.carrier.qr.desc') },
    { code: 'audio', icon: Music, label: t('encode.carrier.audio'), desc: t('encode.carrier.audio.desc') },
  ]

  const buttonText = carrier === 'emoji' ? t('encode.button.emoji')
    : carrier === 'qr' ? t('encode.button.qr')
    : carrier === 'audio' ? t('encode.button.audio')
    : t('encode.button.image')

  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-6">
      {/* Form column */}
      <div className="space-y-5">
        {/* Message */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="message" className="text-sm font-medium">{t('encode.message.label')}</Label>
            <span className="text-xs text-muted-foreground">{message.length.toLocaleString()} / 10,000</span>
          </div>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 10000))}
            placeholder={t('encode.message.placeholder')}
            rows={4}
            className="resize-none fancy-scroll"
          />
          <p className="text-xs text-muted-foreground">{t('encode.message.help')}</p>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="password" className="text-sm font-medium">{t('encode.password.label')}</Label>
            <button onClick={() => setPassword(generatePassword(16))} className="text-xs text-primary hover:underline flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> {t('encode.password.generate')}
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('encode.password.placeholder')}
              className="pr-10"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {/* Strength meter */}
          {password && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{t('encode.password.strength')}:</span>
              <div className="flex gap-1 flex-1">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`strength-seg h-1.5 flex-1 rounded-full ${
                      i < strength.score
                        ? strength.score <= 1 ? 'bg-red-500' : strength.score <= 2 ? 'bg-amber-500' : strength.score <= 3 ? 'bg-yellow-500' : 'bg-green-500'
                        : 'bg-muted'
                    } ${i < strength.score ? 'active' : ''}`}
                  />
                ))}
              </div>
              <span className="text-xs font-medium">{strength.label}</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">{t('encode.password.help')}</p>
        </div>

        {/* Carrier picker */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">{t('encode.carrier.label')}</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {carrierOptions.map((opt) => {
              const Icon = opt.icon
              const active = carrier === opt.code
              return (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => setCarrier(opt.code)}
                  className={`relative flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                    active ? 'border-primary bg-primary/5 shadow-sm glow-ring' : 'border-border hover:border-primary/40 hover:bg-muted/30'
                  }`}
                >
                  <span className={`grid h-9 w-9 place-items-center rounded-lg ${active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{opt.label}</div>
                    <div className="text-xs text-muted-foreground truncate">{opt.desc}</div>
                  </div>
                  {active && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>

        {/* Emoji input */}
        {carrier === 'emoji' && (
          <div className="space-y-2">
            <Label htmlFor="emoji" className="text-sm font-medium">{t('encode.emoji.input')}</Label>
            <div className="flex items-center gap-3">
              <Input
                id="emoji"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value.slice(0, 24))}
                className="text-2xl w-20 text-center"
                maxLength={24}
              />
              <div className="flex flex-wrap gap-1">
                {EMOJI_PRESETS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className="grid h-9 w-9 place-items-center rounded-lg hover:bg-muted text-xl"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{t('encode.emoji.hint')}</p>
          </div>
        )}

        {/* Image input */}
        {(carrier === 'image' || carrier === 'lsb') && (
          <div className="space-y-2">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              hidden
              onChange={(e) => handleImageSelect(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleImageSelect(e.dataTransfer.files[0]) }}
              className="w-full rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 p-5 text-center transition-all"
            >
              <ImageIcon className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              <div className="font-medium text-sm">{imageName || t('encode.image.drop')}</div>
              <div className="text-xs text-muted-foreground mt-1">{t('encode.image.help')}</div>
            </button>
            {carrier === 'lsb' && (
              <Badge variant="secondary" className="text-xs">True pixel steganography — modifies LSB of RGB channels</Badge>
            )}
          </div>
        )}

        {/* Audio input */}
        {carrier === 'audio' && (
          <div className="space-y-2">
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/wav,audio/wave,.wav"
              hidden
              onChange={(e) => handleAudioSelect(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              onClick={() => audioInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleAudioSelect(e.dataTransfer.files[0]) }}
              className="w-full rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 p-5 text-center transition-all"
            >
              <Music className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
              <div className="font-medium text-sm">{audioName || t('encode.audio.drop')}</div>
              <div className="text-xs text-muted-foreground mt-1">{t('encode.audio.help')}</div>
            </button>
          </div>
        )}

        {/* Advanced options toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <Settings2 className="h-4 w-4" />
          {t('encode.advanced')}
          <Badge variant="outline" className="text-xs">
            {[decoyMessage && 'decoy', expiry !== 'never' && 'expiry', burnAfterRead && 'burn', hint && 'hint', loveMode && 'love', capsuleMode && 'capsule'].filter(Boolean).length}
          </Badge>
        </button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-4 rounded-xl border bg-muted/20 p-4"
            >
              {/* Decoy */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  {t('encode.decoy.label')}
                </Label>
                <Input
                  value={decoyPassword}
                  onChange={(e) => setDecoyPassword(e.target.value)}
                  placeholder={t('encode.decoy.password')}
                  type="password"
                />
                <Textarea
                  value={decoyMessage}
                  onChange={(e) => setDecoyMessage(e.target.value)}
                  placeholder={t('encode.decoy.placeholder')}
                  rows={2}
                  className="resize-none fancy-scroll"
                />
              </div>

              {/* Expiry */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  {t('encode.expiry.label')}
                </Label>
                <Select value={expiry} onValueChange={setExpiry}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">{t('encode.expiry.never')}</SelectItem>
                    <SelectItem value="1h">{t('encode.expiry.1h')}</SelectItem>
                    <SelectItem value="1d">{t('encode.expiry.1d')}</SelectItem>
                    <SelectItem value="7d">{t('encode.expiry.7d')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Burn */}
              <div className="flex items-center justify-between gap-3">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-primary" />
                  {t('encode.burn.label')}
                </Label>
                <Switch checked={burnAfterRead} onCheckedChange={setBurnAfterRead} />
              </div>

              {/* Hint */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('encode.hint.label')}</Label>
                <Input
                  value={hint}
                  onChange={(e) => setHint(e.target.value.slice(0, 80))}
                  placeholder={t('encode.hint.placeholder')}
                />
              </div>

              {/* Fun modes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
                <label className={`flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer transition-all ${loveMode ? 'border-pink-500 bg-pink-500/5' : 'border-border hover:bg-muted/30'}`}>
                  <Switch checked={loveMode} onCheckedChange={setLoveMode} />
                  <div>
                    <div className="text-sm font-medium flex items-center gap-1.5"><Heart className="h-3.5 w-3.5 text-pink-500" /> {t('modes.love')}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t('modes.love.desc')}</div>
                  </div>
                </label>
                <label className={`flex items-start gap-2.5 rounded-lg border p-3 cursor-pointer transition-all ${capsuleMode ? 'border-violet-500 bg-violet-500/5' : 'border-border hover:bg-muted/30'}`}>
                  <Switch checked={capsuleMode} onCheckedChange={setCapsuleMode} />
                  <div>
                    <div className="text-sm font-medium flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-violet-500" /> {t('modes.capsule')}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{t('modes.capsule.desc')}</div>
                    {capsuleMode && (
                      <Input
                        type="date"
                        value={capsuleDate}
                        onChange={(e) => setCapsuleDate(e.target.value)}
                        className="mt-2 h-8 text-xs"
                      />
                    )}
                  </div>
                </label>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Encrypt button */}
        <Button
          onClick={handleEncode}
          disabled={encrypting}
          size="lg"
          className="w-full gap-2 text-base"
        >
          {encrypting ? (
            <><span className="h-4 w-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" /> {t('encode.status.encrypting')}</>
          ) : (
            <><Lock className="h-4 w-4" /> {buttonText} <ArrowUpRight className="h-4 w-4" /></>
          )}
        </Button>
        {statusText && <p className="text-sm text-center text-muted-foreground">{statusText}</p>}
      </div>

      {/* Preview column */}
      <div className="space-y-4">
        <div className="glass rounded-2xl p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Your container</div>
          <h2 className="text-lg font-semibold mb-4">A little something to pass along.</h2>

          <AnimatePresence mode="wait">
            {output ? (
              <motion.div
                key="output"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <strong>{t('encode.output.ready')}</strong>
                </div>
                <div className="text-xs text-muted-foreground">{t('encode.output.encrypted')}</div>

                {/* Output preview */}
                {output.kind === 'emoji' && (
                  <div className="rounded-xl bg-muted/40 p-6 text-center">
                    <div className="text-6xl emoji-breathe mb-3">{emoji}</div>
                    <Badge variant="secondary" className="text-xs">Variation Selectors payload · Instagram-safe</Badge>
                  </div>
                )}
                {output.pngBlob && (
                  <div className="rounded-xl bg-muted/40 p-4 text-center">
                    {output.pngUrl ? <img src={output.pngUrl} alt="preview" className="max-h-40 mx-auto rounded" /> : <FileImage className="h-12 w-12 mx-auto text-muted-foreground" />}
                    <div className="text-xs mt-2 font-medium">{output.pngName}</div>
                  </div>
                )}
                {output.qrDataUrl && (
                  <div className="rounded-xl bg-white p-4 text-center">
                    <img src={output.qrDataUrl} alt="QR code" className="mx-auto" style={{ width: 220, height: 220 }} />
                  </div>
                )}
                {output.audioBlob && (
                  <div className="rounded-xl bg-muted/40 p-4 text-center">
                    <Music className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div className="text-xs mt-2 font-medium">{output.audioName}</div>
                    <audio controls src={URL.createObjectURL(output.audioBlob)} className="mt-2 w-full h-8" />
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2">
                  {output.emojiMessage && (
                    <Button onClick={copyEmoji} variant="default" className="w-full gap-2">
                      {copiedEmoji ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copiedEmoji ? t('encode.output.copy.emoji.done') : t('encode.output.copy.emoji')}
                    </Button>
                  )}
                  {output.pngBlob && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={() => download(output.pngBlob!, output.pngName!)} variant="default" className="gap-1.5"><Download className="h-4 w-4" /> {t('encode.output.download')}</Button>
                      <Button onClick={copyImage} variant="outline" className="gap-1.5">{copiedImage ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {t('encode.output.copy.image')}</Button>
                    </div>
                  )}
                  {output.qrDataUrl && (
                    <Button onClick={downloadQr} variant="default" className="w-full gap-2"><Download className="h-4 w-4" /> {t('encode.output.download')}</Button>
                  )}
                  {output.audioBlob && (
                    <Button onClick={() => download(output.audioBlob!, output.audioName!)} variant="default" className="w-full gap-2"><Download className="h-4 w-4" /> {t('encode.output.download')}</Button>
                  )}
                </div>
                {output.emojiMessage && (
                  <p className="text-xs text-muted-foreground">{t('encode.output.warning')}</p>
                )}
                <Button onClick={reset} variant="ghost" size="sm" className="w-full gap-1.5"><RotateCcw className="h-3.5 w-3.5" /> {t('encode.output.reset')}</Button>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <div className="rounded-xl bg-gradient-to-br from-primary/10 to-accent/30 p-8 text-center">
                  <div className="text-6xl emoji-breathe">{carrier === 'emoji' ? emoji : carrier === 'qr' ? '🔳' : carrier === 'audio' ? '🎵' : carrier === 'lsb' ? '🖼️' : '🖼️'}</div>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  {carrier === 'emoji' ? 'Looks like a regular emoji. Survives Instagram, WhatsApp, Messenger.'
                    : carrier === 'image' ? 'Your image, ready to wrap with an encrypted chunk.'
                    : carrier === 'lsb' ? 'Pixel-level steganography — payload hidden in the least significant bits.'
                    : carrier === 'qr' ? 'A scannable QR code carrying your encrypted payload.'
                    : 'A WAV audio file with your encrypted payload hidden in the samples.'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="glass rounded-2xl p-4 flex items-start gap-3">
          <Lock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">Your secret stays yours.</strong> Encryption happens in your browser. Hush never receives or stores your message or password.
          </p>
        </div>
      </div>
    </div>
  )
}
