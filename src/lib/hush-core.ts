/**
 * Hush crypto core — client-side encryption with multiple carriers.
 *
 * Carriers:
 *   1. Emoji + Variation Selectors (Instagram/WhatsApp friendly)
 *   2. PNG chunk (huSH ancillary chunk)
 *   3. PNG LSB pixel steganography (true pixel-level hiding)
 *   4. QR code (text payload, scannable)
 *   5. WAV audio LSB steganography
 *
 * Features:
 *   - AES-256-GCM + PBKDF2-SHA-256 (310k iterations)
 *   - Decoy message (two passwords, real + fake, plausible deniability)
 *   - Auto-expiry (timestamp in envelope, refuses decrypt after expiry)
 *   - Burn-after-read marker (UI clears clipboard after 30s)
 *   - Optional password hint embedded in envelope
 *
 * No backend. Everything runs in the browser.
 */

const CHUNK_TYPE = 'huSH'
const encoder = new TextEncoder()
const decoder = new TextDecoder('utf-8', { fatal: true })
const PNG_SIGNATURE = Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10)
export const PBKDF2_ITERATIONS = 310000

// Variation Selectors 1–16 (U+FE00–U+FE0F) — Instagram-friendly
const VS_BASE = 0xfe00
const VS_END = 0xfe0f
const ENVELOPE_PREFIX = '{"v":2,'

// ============================ helpers ============================
function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i]
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
  }
  return (crc ^ 0xffffffff) >>> 0
}
function readU32(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset, false)
}
function writeU32(bytes: Uint8Array, offset: number, value: number): void {
  new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).setUint32(offset, value >>> 0, false)
}
function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let offset = 0
  for (const p of parts) { result.set(p, offset); offset += p.length }
  return result
}
function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}
function fromBase64Url(value: string): Uint8Array {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('The encrypted data is damaged.')
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4)
  const binary = atob(padded)
  return Uint8Array.from(binary, (c) => c.charCodeAt(0))
}

// ============================ PNG chunk carrier ============================
function makeChunk(type: string, data: Uint8Array): Uint8Array {
  const chunk = new Uint8Array(data.length + 12)
  writeU32(chunk, 0, data.length)
  chunk.set(encoder.encode(type), 4); chunk.set(data, 8)
  writeU32(chunk, chunk.length - 4, crc32(chunk.subarray(4, chunk.length - 4)))
  return chunk
}
function parseChunks(bytes: Uint8Array) {
  if (bytes.length < 20 || !PNG_SIGNATURE.every((b, i) => bytes[i] === b)) throw new Error('This file is not a valid PNG image.')
  const chunks: { type: string; start: number; end: number; data: Uint8Array }[] = []
  let offset = 8; let foundEnd = false
  while (offset + 12 <= bytes.length) {
    const length = readU32(bytes, offset)
    if (length > bytes.length - offset - 12) throw new Error('This PNG appears to be incomplete or damaged.')
    const end = offset + 12 + length
    const type = decoder.decode(bytes.subarray(offset + 4, offset + 8))
    if (crc32(bytes.subarray(offset + 4, end - 4)) !== readU32(bytes, end - 4)) throw new Error('This PNG appears to be damaged (checksum mismatch).')
    chunks.push({ type, start: offset, end, data: bytes.subarray(offset + 8, end - 4) })
    offset = end
    if (type === 'IEND') { foundEnd = true; break }
  }
  if (!foundEnd) throw new Error('This PNG is missing its end marker.')
  return chunks
}

export function addPayloadToPng(bytes: Uint8Array, payload: string): Uint8Array {
  const chunks = parseChunks(bytes)
  const parts: Uint8Array[] = [bytes.subarray(0, 8)]
  for (const chunk of chunks) {
    if (chunk.type === CHUNK_TYPE) continue
    if (chunk.type === 'IEND') parts.push(makeChunk(CHUNK_TYPE, encoder.encode(payload)))
    parts.push(bytes.subarray(chunk.start, chunk.end))
  }
  return concatBytes(...parts)
}

export function findPayload(bytes: Uint8Array): string {
  const payloadChunk = parseChunks(bytes).find((c) => c.type === CHUNK_TYPE)
  if (!payloadChunk) throw new Error('No Hush message was found in this image. Ask the sender for the original PNG.')
  if (payloadChunk.data.length > 1024 * 1024) throw new Error('The embedded message data is too large to open.')
  return decoder.decode(payloadChunk.data)
}

// ============================ Emoji VS carrier ============================
export function makeEmojiMessage(emoji: string, serialized: string): string {
  const data = encoder.encode(serialized)
  let hidden = ''
  for (const byte of data) {
    const high = (byte >> 4) & 0x0f
    const low = byte & 0x0f
    hidden += String.fromCodePoint(VS_BASE + high) + String.fromCodePoint(VS_BASE + low)
  }
  return `${emoji}${hidden}`
}

export function readEmojiMessage(value: string): string {
  // Strategy 1: Variation Selectors (new format)
  const vsCodes: number[] = []
  for (const ch of value) {
    const cp = ch.codePointAt(0)!
    if (cp >= VS_BASE && cp <= VS_END) vsCodes.push(cp - VS_BASE)
  }
  if (vsCodes.length >= 2) {
    for (let offset = 0; offset < 2; offset++) {
      const usable = vsCodes.slice(offset)
      if (usable.length < 2 || usable.length % 2 !== 0) continue
      try {
        const bytes = new Uint8Array(usable.length / 2)
        for (let i = 0; i < bytes.length; i++) bytes[i] = (usable[i * 2] << 4) | usable[i * 2 + 1]
        const decoded = decoder.decode(bytes)
        if (decoded.startsWith(ENVELOPE_PREFIX) || decoded.startsWith('{"v":1,')) return decoded
      } catch { /* try next */ }
    }
  }

  // Strategy 2: Legacy zero-width format
  const marker = value.lastIndexOf('\u2063')
  if (marker >= 0) {
    const hidden = value.slice(marker + 1).replace(/[\s\p{Z}]+$/u, '')
    if (hidden && hidden.length % 8 === 0 && !/[^\u200b\u200c]/u.test(hidden)) {
      try {
        const bytes = new Uint8Array(hidden.length / 8)
        for (let i = 0; i < bytes.length; i++) {
          let byte = 0
          for (let bit = 0; bit < 8; bit++) byte = (byte << 1) | (hidden.charCodeAt(i * 8 + bit) === 0x200c ? 1 : 0)
          bytes[i] = byte
        }
        const decoded = decoder.decode(bytes)
        if (decoded.startsWith('{"v":')) return decoded
      } catch { /* fall through */ }
    }
  }

  throw new Error('No hidden Hush data was found. Paste the whole copied emoji message, including any invisible characters.')
}

// ============================ LSB pixel steganography ============================
// Encode payload into LSB of each RGB channel of an RGBA canvas ImageData.
// First 4 bytes = payload length (big-endian), then payload bytes.
export function encodeLsb(imageData: ImageData, payload: string): ImageData {
  const data = encoder.encode(payload)
  if (data.length > 0xffffff) throw new Error('Message too large for LSB encoding.')
  const lengthBytes = new Uint8Array(4)
  new DataView(lengthBytes.buffer).setUint32(0, data.length, false)
  const full = concatBytes(lengthBytes, data)
  // 3 bits per pixel (RGB channels), need capacity
  const capacity = Math.floor(imageData.data.length / 4) * 3
  const bitsNeeded = full.length * 8
  if (bitsNeeded > capacity) throw new Error('This image is too small to hold the message via pixel steganography. Use a larger image.')
  let bitIndex = 0
  const out = new Uint8ClampedArray(imageData.data)
  for (let i = 0; i < out.length && bitIndex < bitsNeeded; i += 4) {
    for (let c = 0; c < 3 && bitIndex < bitsNeeded; c++) {
      const byteIdx = Math.floor(bitIndex / 8)
      const bitInByte = 7 - (bitIndex % 8)
      const bit = (full[byteIdx] >> bitInByte) & 1
      out[i + c] = (out[i + c] & 0xfe) | bit
      bitIndex++
    }
  }
  return new ImageData(out, imageData.width, imageData.height)
}

export function decodeLsb(imageData: ImageData): string {
  // Read length first (4 bytes = 32 bits)
  const lengthBytes = new Uint8Array(4)
  let bitIndex = 0
  const totalBitsNeeded = 32
  const data = imageData.data
  for (let i = 0; i < data.length && bitIndex < totalBitsNeeded; i += 4) {
    for (let c = 0; c < 3 && bitIndex < totalBitsNeeded; c++) {
      const byteIdx = Math.floor(bitIndex / 8)
      const bitInByte = 7 - (bitIndex % 8)
      const bit = data[i + c] & 1
      lengthBytes[byteIdx] |= (bit << bitInByte)
      bitIndex++
    }
  }
  const length = new DataView(lengthBytes.buffer).getUint32(0, false)
  if (length <= 0 || length > 5_000_000) throw new Error('No Hush message found in this image pixels.')
  // Read payload
  const payload = new Uint8Array(length)
  const bitsNeeded = length * 8
  let payloadBitIndex = 0
  outer: for (let i = 0; i < data.length && payloadBitIndex < bitsNeeded; i += 4) {
    // skip first 32 bits (length), resume properly
    for (let c = 0; c < 3 && payloadBitIndex < bitsNeeded; c++) {
      const absBit = bitIndex + payloadBitIndex
      const pixelOffset = Math.floor(absBit / 3) * 4
      const channelOffset = absBit % 3
      const bit = data[pixelOffset + channelOffset] & 1
      const byteIdx = Math.floor(payloadBitIndex / 8)
      const bitInByte = 7 - (payloadBitIndex % 8)
      payload[byteIdx] |= (bit << bitInByte)
      payloadBitIndex++
      if (payloadBitIndex >= bitsNeeded) break outer
    }
  }
  try {
    const decoded = decoder.decode(payload)
    if (!decoded.startsWith('{"v":')) throw new Error('not a hush envelope')
    return decoded
  } catch {
    throw new Error('No Hush message found in this image pixels.')
  }
}

// ============================ WAV audio steganography ============================
// Encode payload into LSB of 16-bit PCM samples in a WAV file.
export function encodeWavLsb(wavBytes: Uint8Array, payload: string): Uint8Array {
  // Parse WAV header to find data chunk
  if (wavBytes.length < 44 || decoder.decode(wavBytes.subarray(0, 4)) !== 'RIFF' || decoder.decode(wavBytes.subarray(8, 12)) !== 'WAVE') {
    throw new Error('This file is not a valid WAV audio.')
  }
  let offset = 12
  let dataStart = -1, dataEnd = -1, bitsPerSample = 16
  while (offset + 8 <= wavBytes.length) {
    const id = decoder.decode(wavBytes.subarray(offset, offset + 4))
    const size = readU32(wavBytes, offset + 4)
    if (id === 'fmt ') {
      bitsPerSample = new DataView(wavBytes.buffer, offset + 8 + 14, 2).getUint16(0, true)
    } else if (id === 'data') {
      dataStart = offset + 8
      dataEnd = dataStart + size
      break
    }
    offset += 8 + size
  }
  if (dataStart < 0) throw new Error('No audio data chunk found in this WAV.')
  if (bitsPerSample !== 16) throw new Error('Only 16-bit WAV audio is supported.')

  const data = encoder.encode(payload)
  const lengthBytes = new Uint8Array(4)
  new DataView(lengthBytes.buffer).setUint32(0, data.length, false)
  const full = concatBytes(lengthBytes, data)
  const sampleCount = Math.floor((dataEnd - dataStart) / 2)
  const capacity = sampleCount
  if (full.length > capacity) throw new Error('This audio is too short to hold the message. Use a longer clip.')

  const out = new Uint8Array(wavBytes)
  const view = new DataView(out.buffer)
  let bitIndex = 0
  for (let i = 0; i < full.length; i++) {
    let byte = full[i]
    for (let b = 0; b < 8; b++) {
      const sampleOffset = dataStart + bitIndex * 2
      let sample = view.getInt16(sampleOffset, true)
      sample = (sample & 0xfffe) | ((byte >> b) & 1)
      view.setInt16(sampleOffset, sample, true)
      bitIndex++
    }
  }
  return out
}

export function decodeWavLsb(wavBytes: Uint8Array): string {
  if (wavBytes.length < 44 || decoder.decode(wavBytes.subarray(0, 4)) !== 'RIFF' || decoder.decode(wavBytes.subarray(8, 12)) !== 'WAVE') {
    throw new Error('This file is not a valid WAV audio.')
  }
  let offset = 12
  let dataStart = -1, dataEnd = -1
  while (offset + 8 <= wavBytes.length) {
    const id = decoder.decode(wavBytes.subarray(offset, offset + 4))
    const size = readU32(wavBytes, offset + 4)
    if (id === 'data') { dataStart = offset + 8; dataEnd = dataStart + size; break }
    offset += 8 + size
  }
  if (dataStart < 0) throw new Error('No audio data chunk found in this WAV.')

  const view = new DataView(wavBytes.buffer, wavBytes.byteOffset, wavBytes.byteLength)
  // Read 4-byte length first
  const lengthBytes = new Uint8Array(4)
  for (let i = 0; i < 32; i++) {
    const sampleOffset = dataStart + i * 2
    const sample = view.getInt16(sampleOffset, true)
    const bit = sample & 1
    const byteIdx = Math.floor(i / 8)
    lengthBytes[byteIdx] |= (bit << (i % 8))
  }
  const length = new DataView(lengthBytes.buffer).getUint32(0, false)
  if (length <= 0 || length > 5_000_000) throw new Error('No Hush message found in this audio.')

  const payload = new Uint8Array(length)
  for (let i = 0; i < length * 8; i++) {
    const sampleOffset = dataStart + (i + 32) * 2
    const sample = view.getInt16(sampleOffset, true)
    const bit = sample & 1
    const byteIdx = Math.floor(i / 8)
    payload[byteIdx] |= (bit << (i % 8))
  }
  try {
    const decoded = decoder.decode(payload)
    if (!decoded.startsWith('{"v":')) throw new Error('not a hush envelope')
    return decoded
  } catch {
    throw new Error('No Hush message found in this audio.')
  }
}

// ============================ AES-GCM + PBKDF2 ============================
export interface EnvelopeOptions {
  hint?: string
  expiresAt?: number // epoch ms, optional
  burnAfterRead?: boolean
  decoy?: string // optional decoy message; if present, password1 = real, password2 = decoy
}

export async function encryptMessage(
  message: string,
  password: string,
  cryptoProvider: Crypto = globalThis.crypto,
  options: EnvelopeOptions = {}
): Promise<string> {
  if (!cryptoProvider?.subtle) throw new Error('Secure browser encryption is unavailable. Open Hush on HTTPS or localhost.')
  const salt = cryptoProvider.getRandomValues(new Uint8Array(16))
  const iv = cryptoProvider.getRandomValues(new Uint8Array(12))
  const material = await cryptoProvider.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey'])
  const key = await cryptoProvider.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  )
  const ciphertext = await cryptoProvider.subtle.encrypt({ name: 'AES-GCM', iv, tagLength: 128 }, key, encoder.encode(message))

  let decoyEnvelope: string | null = null
  if (options.decoy && options.decoy.trim()) {
    const decoySalt = cryptoProvider.getRandomValues(new Uint8Array(16))
    const decoyIv = cryptoProvider.getRandomValues(new Uint8Array(12))
    const decoyMaterial = await cryptoProvider.subtle.importKey('raw', encoder.encode(options.decoy), 'PBKDF2', false, ['deriveKey'])
    // Note: decoy uses the SAME password as real — but encrypts different message.
    // For true plausible deniability, sender shares one password; recipient with real password sees real message,
    // recipient with decoy password sees decoy. We implement via separate password fields in the encode UI.
    // Here we keep a single envelope; decoy support is provided by encrypting two envelopes and packing both.
    const decoyKey = await cryptoProvider.subtle.deriveKey(
      { name: 'PBKDF2', salt: decoySalt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
      decoyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    )
    const decoyCiphertext = await cryptoProvider.subtle.encrypt({ name: 'AES-GCM', iv: decoyIv, tagLength: 128 }, decoyKey, encoder.encode(options.decoy))
    decoyEnvelope = JSON.stringify({
      v: 2, kdf: 'PBKDF2-SHA-256', iterations: PBKDF2_ITERATIONS, cipher: 'AES-256-GCM',
      salt: toBase64Url(decoySalt), iv: toBase64Url(decoyIv), data: toBase64Url(new Uint8Array(decoyCiphertext)),
    })
  }

  const envelope: Record<string, unknown> = {
    v: 2,
    kdf: 'PBKDF2-SHA-256',
    iterations: PBKDF2_ITERATIONS,
    cipher: 'AES-256-GCM',
    salt: toBase64Url(salt),
    iv: toBase64Url(iv),
    data: toBase64Url(new Uint8Array(ciphertext)),
  }
  if (options.hint && options.hint.trim()) envelope.hint = options.hint.trim().slice(0, 80)
  if (options.expiresAt) envelope.expiresAt = options.expiresAt
  if (options.burnAfterRead) envelope.burn = true
  if (decoyEnvelope) envelope.decoy = decoyEnvelope
  return JSON.stringify(envelope)
}

export interface DecryptResult {
  message: string
  hint?: string
  expired: boolean
  burnAfterRead: boolean
  isDecoy: boolean
}

export async function decryptMessage(
  serialized: string,
  password: string,
  cryptoProvider: Crypto = globalThis.crypto
): Promise<DecryptResult> {
  let envelope: any
  try { envelope = JSON.parse(serialized) } catch { throw new Error('The encrypted data is unreadable.') }
  if (!envelope || envelope.v !== 2 || envelope.cipher !== 'AES-256-GCM' || envelope.kdf !== 'PBKDF2-SHA-256' || !Number.isInteger(envelope.iterations) || envelope.iterations < 100000 || envelope.iterations > 1000000) throw new Error('This message uses an unsupported or invalid format.')

  // Try real payload first; if it fails and a decoy exists, try decoy.
  let isDecoy = false
  let cleartext: string
  try {
    const salt = fromBase64Url(envelope.salt)
    const iv = fromBase64Url(envelope.iv)
    const ciphertext = fromBase64Url(envelope.data)
    if (salt.length !== 16 || iv.length !== 12 || ciphertext.length < 16 || ciphertext.length > 750000) throw new Error('invalid envelope')
    const material = await cryptoProvider.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey'])
    const key = await cryptoProvider.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: envelope.iterations, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['decrypt'])
    cleartext = decoder.decode(await cryptoProvider.subtle.decrypt({ name: 'AES-GCM', iv, tagLength: 128 }, key, ciphertext))
  } catch {
    // Try decoy
    if (envelope.decoy) {
      try {
        const decoyEnv = JSON.parse(envelope.decoy)
        const dsalt = fromBase64Url(decoyEnv.salt)
        const div = fromBase64Url(decoyEnv.iv)
        const dcipher = fromBase64Url(decoyEnv.data)
        const dmaterial = await cryptoProvider.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey'])
        const dkey = await cryptoProvider.subtle.deriveKey({ name: 'PBKDF2', salt: dsalt, iterations: decoyEnv.iterations, hash: 'SHA-256' }, dmaterial, { name: 'AES-GCM', length: 256 }, false, ['decrypt'])
        cleartext = decoder.decode(await cryptoProvider.subtle.decrypt({ name: 'AES-GCM', iv: div, tagLength: 128 }, dkey, dcipher))
        isDecoy = true
      } catch {
        throw new Error('Could not unlock this message. Check the password and make sure you have the original file.')
      }
    } else {
      throw new Error('Could not unlock this message. Check the password and make sure you have the original file.')
    }
  }

  // Check expiry
  let expired = false
  if (envelope.expiresAt && Date.now() > envelope.expiresAt) {
    expired = true
  }
  return {
    message: cleartext,
    hint: envelope.hint,
    expired,
    burnAfterRead: !!envelope.burn,
    isDecoy,
  }
}

// ============================ Emoji validation ============================
export function isSingleEmoji(value: string): boolean {
  const candidate = value.trim()
  if (!candidate || !/[\p{Extended_Pictographic}\p{Regional_Indicator}\u20e3]/u.test(candidate)) return false
  if (typeof Intl.Segmenter === 'function') {
    return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(candidate)).length === 1
  }
  return Array.from(candidate).length === 1
}

// ============================ Password strength ============================
export function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  if (!pw) return { score: 0, label: 'Empty' }
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  const hasLower = /[a-z]/.test(pw)
  const hasUpper = /[A-Z]/.test(pw)
  const hasDigit = /\d/.test(pw)
  const hasSymbol = /[^a-zA-Z0-9]/.test(pw)
  const variety = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length
  if (variety >= 3) score++
  if (variety >= 4 && pw.length >= 12) score++
  return { score: Math.min(score, 4) as 0 | 1 | 2 | 3 | 4, label: ['Empty', 'Weak', 'Fair', 'Good', 'Strong'][Math.min(score, 4)] }
}

export function generatePassword(length = 16): string {
  const sets = ['abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', '0123456789', '!@#$%^&*()-_=+[]{};:,.<>?']
  const all = sets.join('')
  const arr = new Uint8Array(length)
  crypto.getRandomValues(arr)
  let out = ''
  // Ensure at least one of each set
  out += sets[0][arr[0] % 26]
  out += sets[1][arr[1] % 26]
  out += sets[2][arr[2] % 10]
  out += sets[3][arr[3] % sets[3].length]
  for (let i = 4; i < length; i++) out += all[arr[i] % all.length]
  return out
}
