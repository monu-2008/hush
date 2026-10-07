// Hush popup — encrypts selected text or message field, copies emoji to clipboard.
// Uses Variation Selectors (U+FE00–U+FE0F) for Instagram/WhatsApp compatibility.

const VS_BASE = 0xfe00;
const PBKDF2_ITERATIONS = 310000;
const enc = new TextEncoder();
const dec = new TextDecoder('utf-8', { fatal: true });

function toB64Url(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function encrypt(message, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const material = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, tagLength: 128 }, key, enc.encode(message));
  return JSON.stringify({
    v: 2, kdf: 'PBKDF2-SHA-256', iterations: PBKDF2_ITERATIONS, cipher: 'AES-256-GCM',
    salt: toB64Url(salt), iv: toB64Url(iv), data: toB64Url(new Uint8Array(cipher)),
  });
}

function makeEmojiMessage(emoji, serialized) {
  const data = enc.encode(serialized);
  let hidden = '';
  for (const byte of data) {
    const hi = (byte >> 4) & 0x0f;
    const lo = byte & 0x0f;
    hidden += String.fromCodePoint(VS_BASE + hi) + String.fromCodePoint(VS_BASE + lo);
  }
  return `${emoji}${hidden}`;
}

// Try to prefill message with the active tab's selection
async function prefillFromSelection() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString() || '',
    });
    if (result) document.getElementById('msg').value = result;
  } catch {}
}

document.addEventListener('DOMContentLoaded', () => {
  prefillFromSelection();
  document.getElementById('enc').addEventListener('click', async () => {
    const msg = document.getElementById('msg').value.trim();
    const pw = document.getElementById('pw').value;
    const emoji = document.getElementById('emoji').value.trim() || '😊';
    if (!msg) { alert('Write a message first.'); return; }
    if (pw.length < 8) { alert('Password must be at least 8 characters.'); return; }
    try {
      const env = await encrypt(msg, pw);
      const emojiMsg = makeEmojiMessage(emoji, env);
      const out = document.getElementById('out');
      out.textContent = emojiMsg;
      out.style.display = 'block';
      out.dataset.emoji = emojiMsg;
      const copyBtn = document.getElementById('copy');
      copyBtn.style.display = 'block';
      copyBtn.dataset.emoji = emojiMsg;
    } catch (e) {
      alert('Encryption failed: ' + e.message);
    }
  });
  document.getElementById('copy').addEventListener('click', async (e) => {
    const text = e.target.dataset.emoji;
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      e.target.textContent = '✓ Copied — paste into chat';
      setTimeout(() => { e.target.textContent = 'Copy emoji for chat'; }, 2600);
    } catch {
      alert('Clipboard access denied.');
    }
  });
});
