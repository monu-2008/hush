import test from 'node:test';
import assert from 'node:assert/strict';
import { deflateSync } from 'node:zlib';
import { addPayloadToPng, decryptMessage, encryptMessage, findPayload, isSingleEmoji, makeEmojiMessage, readEmojiMessage, PBKDF2_ITERATIONS } from './core.js';

function pngChunk(type, data) {
  const name = Buffer.from(type); const body = Buffer.concat([name, data]);
  let crc = 0xffffffff;
  for (const byte of body) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); }
  const header = Buffer.alloc(4); header.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4); checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([header, body, checksum]);
}
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(1, 0); ihdr.writeUInt32BE(1, 4); ihdr[8] = 8; ihdr[9] = 6;
const onePixelPng = Uint8Array.from(Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  pngChunk('IHDR', ihdr), pngChunk('IDAT', deflateSync(Buffer.from([0, 255, 255, 255, 255]))), pngChunk('IEND', Buffer.alloc(0)),
]));

test('encrypted PNG round trip preserves a Unicode message', async () => {
  const message = 'Round trip test — नमस्ते 🌙';
  const encrypted = await encryptMessage(message, 'mango-sunset-47');
  const png = addPayloadToPng(onePixelPng, encrypted);
  assert.equal(findPayload(png), encrypted);
  assert.equal(await decryptMessage(findPayload(png), 'mango-sunset-47'), message);
});

test('envelope uses strong browser-native parameters', async () => {
  const envelope = JSON.parse(await encryptMessage('hello', 'password-123'));
  assert.equal(envelope.cipher, 'AES-256-GCM');
  assert.equal(envelope.kdf, 'PBKDF2-SHA-256');
  assert.equal(envelope.iterations, PBKDF2_ITERATIONS);
});

test('wrong password cannot decrypt the message', async () => {
  const encrypted = await encryptMessage('secret', 'correct-horse-77');
  await assert.rejects(decryptMessage(encrypted, 'wrong-password'), /Check the password/);
});

test('emoji-text carrier looks like one emoji and can be copied back to unlock', async () => {
  const message = 'This is only for you 💜';
  const emojiText = makeEmojiMessage('😊', await encryptMessage(message, 'emoji-key-987'));
  assert.ok(emojiText.startsWith('😊'));
  assert.equal(Array.from(emojiText.slice(0, 1)).length, 1);
  assert.equal(await decryptMessage(readEmojiMessage(emojiText), 'emoji-key-987'), message);
  assert.throws(() => readEmojiMessage('😊'), /No hidden Hush data/);
});

test('emoji carrier uses Variation Selectors and survives chat-app stripping of zero-width chars', async () => {
  const message = 'Secret for Instagram 🔒';
  const envelope = await encryptMessage(message, 'ig-key-42');
  const emojiText = makeEmojiMessage('🌙', envelope);
  // New format must not contain any zero-width characters that Instagram strips.
  assert.ok(!/\u200b|\u200c|\u200d|\u2063/u.test(emojiText), 'emoji message should not use zero-width chars');
  // Round trip via the decoder.
  assert.equal(await decryptMessage(readEmojiMessage(emojiText), 'ig-key-42'), message);
});

test('emoji carrier works with VS-bearing emojis like ❤️', async () => {
  const message = 'Love letter';
  const emojiText = makeEmojiMessage('❤️', await encryptMessage(message, 'heart-key-1'));
  // The heart emoji already contributes a VS16; the decoder must still recover the payload.
  assert.equal(await decryptMessage(readEmojiMessage(emojiText), 'heart-key-1'), message);
});

test('decoder still reads legacy zero-width emoji messages from older Hush builds', async () => {
  const message = 'Old format still works';
  const envelope = await encryptMessage(message, 'legacy-key-7');
  const data = new TextEncoder().encode(envelope);
  let invisible = '';
  for (const byte of data) {
    for (let bit = 7; bit >= 0; bit--) invisible += (byte >> bit) & 1 ? '\u200c' : '\u200b';
  }
  const legacyMessage = `😊\u2063${invisible}`;
  assert.equal(await decryptMessage(readEmojiMessage(legacyMessage), 'legacy-key-7'), message);
});

test('accepts a user supplied emoji sequence as one visual emoji', () => {
  assert.equal(isSingleEmoji('😊'), true);
  assert.equal(isSingleEmoji('👨‍👩‍👧‍👦'), true);
  assert.equal(isSingleEmoji('🇮🇳'), true);
  assert.equal(isSingleEmoji('hello'), false);
  assert.equal(isSingleEmoji('😊🌙'), false);
});

test('re-encoding replaces an existing Hush payload', async () => {
  const first = addPayloadToPng(onePixelPng, 'first');
  const second = addPayloadToPng(first, 'second');
  assert.equal(findPayload(second), 'second');
  assert.equal((Buffer.from(second).toString('latin1').match(/huSH/g) || []).length, 1);
});

test('rejects non-PNG input and PNGs without a Hush payload', () => {
  assert.throws(() => findPayload(new Uint8Array([1, 2, 3])), /not a valid PNG/);
  assert.throws(() => findPayload(onePixelPng), /No Hush message/);
});
