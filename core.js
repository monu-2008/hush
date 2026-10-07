const CHUNK_TYPE = 'huSH';
const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const PNG_SIGNATURE = Uint8Array.of(137, 80, 78, 71, 13, 10, 26, 10);
export const PBKDF2_ITERATIONS = 310000;

function crc32(data) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function readU32(bytes, offset) { return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset, false); }
function writeU32(bytes, offset, value) { new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).setUint32(offset, value >>> 0, false); }
function concatBytes(...parts) {
  const result = new Uint8Array(parts.reduce((n, part) => n + part.length, 0));
  let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.length; }
  return result;
}
function toBase64Url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function fromBase64Url(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('The encrypted image data is damaged.');
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
function makeChunk(type, data) {
  const chunk = new Uint8Array(data.length + 12);
  writeU32(chunk, 0, data.length);
  chunk.set(encoder.encode(type), 4); chunk.set(data, 8);
  writeU32(chunk, chunk.length - 4, crc32(chunk.subarray(4, chunk.length - 4)));
  return chunk;
}
function parseChunks(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.length < 20 || !PNG_SIGNATURE.every((byte, i) => bytes[i] === byte)) throw new Error('This file is not a valid PNG image.');
  const chunks = [];
  let offset = 8; let foundEnd = false;
  while (offset + 12 <= bytes.length) {
    const length = readU32(bytes, offset);
    if (length > bytes.length - offset - 12) throw new Error('This PNG appears to be incomplete or damaged.');
    const end = offset + 12 + length;
    const type = decoder.decode(bytes.subarray(offset + 4, offset + 8));
    if (crc32(bytes.subarray(offset + 4, end - 4)) !== readU32(bytes, end - 4)) throw new Error('This PNG appears to be damaged (checksum mismatch).');
    chunks.push({ type, start: offset, end, data: bytes.subarray(offset + 8, end - 4) });
    offset = end;
    if (type === 'IEND') { foundEnd = true; break; }
  }
  if (!foundEnd) throw new Error('This PNG is missing its end marker.');
  return chunks;
}

export function addPayloadToPng(bytes, payload) {
  const chunks = parseChunks(bytes);
  const parts = [bytes.subarray(0, 8)];
  for (const chunk of chunks) {
    if (chunk.type === CHUNK_TYPE) continue; // Replace an older Hush payload when reusing a container.
    if (chunk.type === 'IEND') parts.push(makeChunk(CHUNK_TYPE, encoder.encode(payload)));
    parts.push(bytes.subarray(chunk.start, chunk.end));
  }
  return concatBytes(...parts);
}
export function findPayload(bytes) {
  const payloadChunk = parseChunks(bytes).find((chunk) => chunk.type === CHUNK_TYPE);
  if (!payloadChunk) throw new Error('No Hush message was found in this image. Ask the sender for the original PNG.');
  if (payloadChunk.data.length > 1024 * 1024) throw new Error('The embedded message data is too large to open.');
  return decoder.decode(payloadChunk.data);
}

// Variation Selectors 1–16 (U+FE00–U+FE0F) are legitimate emoji modifier
// characters. Unlike zero-width characters (ZWSP/ZWNJ/ZWJ), they are NOT stripped
// by Instagram, WhatsApp, Messenger, and most modern chat apps because they are
// required for correct emoji rendering (e.g. ❤️ = U+2764 U+FE0F).
// 16 values = 4 bits per char, so 2 VS chars encode 1 byte (high nibble + low nibble).
const VS_BASE = 0xfe00;
const VS_END = 0xfe0f;
const ENVELOPE_PREFIX = '{"v":1,';

export function makeEmojiMessage(emoji, serialized) {
  const data = encoder.encode(serialized);
  let hidden = '';
  for (const byte of data) {
    const high = (byte >> 4) & 0x0f;
    const low = byte & 0x0f;
    hidden += String.fromCodePoint(VS_BASE + high) + String.fromCodePoint(VS_BASE + low);
  }
  return `${emoji}${hidden}`;
}

export function readEmojiMessage(value) {
  // Strategy 1: Variation Selectors (new format, Instagram-friendly).
  // Collect all VS1–VS16 code points in order. A user-supplied emoji such as
  // ❤️ may itself carry a leading VS16, so we try decoding from a couple of
  // starting offsets and validate against the Hush envelope prefix.
  const vsCodes = [];
  for (const ch of value) {
    const cp = ch.codePointAt(0);
    if (cp >= VS_BASE && cp <= VS_END) vsCodes.push(cp - VS_BASE);
  }
  if (vsCodes.length >= 2) {
    for (let offset = 0; offset < 2; offset++) {
      const usable = vsCodes.slice(offset);
      if (usable.length < 2 || usable.length % 2 !== 0) continue;
      try {
        const bytes = new Uint8Array(usable.length / 2);
        for (let i = 0; i < bytes.length; i++) bytes[i] = (usable[i * 2] << 4) | usable[i * 2 + 1];
        const decoded = decoder.decode(bytes);
        if (decoded.startsWith(ENVELOPE_PREFIX)) return decoded;
      } catch { /* try next offset, then fall through to legacy */ }
    }
  }

  // Strategy 2: Legacy zero-width format (U+2063 marker + ZWSP/ZWNJ stream).
  // Kept for backward compatibility with messages encoded by older Hush builds
  // that may still arrive through apps which preserve zero-width characters.
  const marker = value.lastIndexOf('\u2063');
  if (marker >= 0) {
    const hidden = value.slice(marker + 1).replace(/[\s\p{Z}]+$/u, '');
    if (hidden && hidden.length % 8 === 0 && !/[^\u200b\u200c]/u.test(hidden)) {
      try {
        const bytes = new Uint8Array(hidden.length / 8);
        for (let i = 0; i < bytes.length; i++) {
          let byte = 0;
          for (let bit = 0; bit < 8; bit++) byte = (byte << 1) | (hidden.charCodeAt(i * 8 + bit) === 0x200c ? 1 : 0);
          bytes[i] = byte;
        }
        const decoded = decoder.decode(bytes);
        if (decoded.startsWith(ENVELOPE_PREFIX)) return decoded;
      } catch { /* fall through */ }
    }
  }

  throw new Error('No hidden Hush data was found. Paste the whole copied emoji message, including any invisible characters.');
}
export function isSingleEmoji(value) {
  const candidate = value.trim();
  if (!candidate || !/[\p{Extended_Pictographic}\p{Regional_Indicator}\u20e3]/u.test(candidate)) return false;
  if (typeof Intl.Segmenter === 'function') {
    return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(candidate)).length === 1;
  }
  return Array.from(candidate).length === 1;
}

export async function encryptMessage(message, password, cryptoProvider = globalThis.crypto) {
  if (!cryptoProvider?.subtle) throw new Error('Secure browser encryption is unavailable. Open Hush on HTTPS or localhost.');
  const salt = cryptoProvider.getRandomValues(new Uint8Array(16));
  const iv = cryptoProvider.getRandomValues(new Uint8Array(12));
  const material = await cryptoProvider.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await cryptoProvider.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  const ciphertext = await cryptoProvider.subtle.encrypt({ name: 'AES-GCM', iv, tagLength: 128 }, key, encoder.encode(message));
  return JSON.stringify({ v: 1, kdf: 'PBKDF2-SHA-256', iterations: PBKDF2_ITERATIONS, cipher: 'AES-256-GCM', salt: toBase64Url(salt), iv: toBase64Url(iv), data: toBase64Url(new Uint8Array(ciphertext)) });
}
export async function decryptMessage(serialized, password, cryptoProvider = globalThis.crypto) {
  let envelope;
  try { envelope = JSON.parse(serialized); } catch { throw new Error('The encrypted image data is unreadable.'); }
  if (!envelope || envelope.v !== 1 || envelope.cipher !== 'AES-256-GCM' || envelope.kdf !== 'PBKDF2-SHA-256' || !Number.isInteger(envelope.iterations) || envelope.iterations < 100000 || envelope.iterations > 1000000) throw new Error('This message uses an unsupported or invalid format.');
  try {
    const salt = fromBase64Url(envelope.salt); const iv = fromBase64Url(envelope.iv); const ciphertext = fromBase64Url(envelope.data);
    if (salt.length !== 16 || iv.length !== 12 || ciphertext.length < 16 || ciphertext.length > 750000) throw new Error('invalid envelope');
    const material = await cryptoProvider.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
    const key = await cryptoProvider.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: envelope.iterations, hash: 'SHA-256' }, material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const cleartext = await cryptoProvider.subtle.decrypt({ name: 'AES-GCM', iv, tagLength: 128 }, key, ciphertext);
    return decoder.decode(cleartext);
  } catch {
    throw new Error('Could not unlock this message. Check the password and make sure you have the original PNG.');
  }
}
