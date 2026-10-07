import { addPayloadToPng, decryptMessage, encryptMessage, findPayload, isSingleEmoji, makeEmojiMessage, readEmojiMessage } from './core.js';

(() => {
  'use strict';

  const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
  const MAX_DECODE_BYTES = 25 * 1024 * 1024;
  const $ = (id) => document.getElementById(id);
  const state = { source: 'emoji', emoji: '😊', carrier: null, decodeFile: null, decodeMode: 'emoji', emojiMessage: '', outputBlob: null, outputName: 'hush-message.png' };

  function setTheme(theme) {
    const dark = theme === 'dark';
    document.body.dataset.theme = dark ? 'dark' : 'light';
    $('theme-icon').textContent = dark ? '☀' : '☾';
    $('theme-text').textContent = dark ? 'Light mode' : 'Dark mode';
    $('theme-toggle').setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    $('theme-toggle').setAttribute('aria-pressed', String(dark));
    try { localStorage.setItem('hush-theme', dark ? 'dark' : 'light'); } catch { /* Theme still works if storage is unavailable. */ }
  }
  try { setTheme(localStorage.getItem('hush-theme') === 'dark' ? 'dark' : 'light'); } catch { setTheme('light'); }
  $('theme-toggle').addEventListener('click', () => setTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark'));

  function setStatus(id, message, success = false) {
    const el = $(id); el.textContent = message; el.classList.toggle('success', success);
  }
  function safeBaseName(name) { return (name || 'image').replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'image'; }
  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
    anchor.href = url; anchor.download = name; document.body.append(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  function imageCanvas(blob) {
    return createImageBitmap(blob).then((bitmap) => {
      if (bitmap.width < 1 || bitmap.height < 1 || bitmap.width > 12000 || bitmap.height > 12000 || bitmap.width * bitmap.height > 40000000) {
        bitmap.close(); throw new Error('This image is too large to safely process. Choose an image under 40 megapixels.');
      }
      const scale = Math.min(1, 4096 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas'); canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) { bitmap.close(); throw new Error('Your browser could not open this image.'); }
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height); bitmap.close(); return canvas;
    }).catch((error) => { if (error instanceof TypeError) throw new Error('This image format is not supported by your browser.'); throw error; });
  }
  function canvasBlob(canvas) { return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not create the PNG image.')), 'image/png')); }
  async function createEmojiCarrier(emoji) {
    const canvas = document.createElement('canvas'); canvas.width = 160; canvas.height = 160;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '112px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; ctx.fillText(emoji, 80, 82);
    return canvasBlob(canvas);
  }

  function selectSource(source) {
    state.source = source;
    document.querySelectorAll('.source-option').forEach((button) => { const selected = button.dataset.source === source; button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', String(selected)); });
    $('emoji-picker').classList.toggle('hidden', source !== 'emoji'); $('image-picker').classList.toggle('hidden', source !== 'image');
    $('preview-art').classList.toggle('hidden', source !== 'emoji'); $('preview-file').classList.toggle('hidden', source !== 'image');
    $('preview-caption').textContent = source === 'emoji' ? 'Looks like a regular emoji.' : 'Your image, ready to wrap.';
    $('emoji-mode-note').classList.toggle('hidden', source !== 'emoji');
    $('emoji-copy-button').classList.toggle('hidden', source !== 'emoji');
    $('copy-warning').classList.toggle('hidden', source !== 'emoji');
    $('encode-button').querySelector('span').textContent = source === 'emoji' ? 'Encrypt & make emoji' : 'Encrypt & create image';
    $('output-card').classList.add('hidden'); state.outputBlob = null; state.emojiMessage = '';
  }
  function updatePreviewEmoji(emoji) {
    state.emoji = emoji; $('preview-art').textContent = emoji;
    $('output-card').classList.add('hidden'); state.emojiMessage = ''; state.outputBlob = null;
  }
  function setCarrier(file) {
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) { setStatus('encode-status', 'Choose a PNG, JPG, WebP or GIF image.'); return; }
    if (file.size > MAX_IMAGE_BYTES) { setStatus('encode-status', 'That image is over 20 MB. Choose a smaller image.'); return; }
    state.carrier = file; state.outputBlob = null; state.emojiMessage = ''; $('carrier-name').textContent = file.name; $('preview-filename').textContent = file.name;
    setStatus('encode-status', 'Image selected. It will be converted to PNG for the encrypted container.', true); $('output-card').classList.add('hidden');
  }
  function setDecodeFile(file) {
    if (!file) return;
    if (file.type !== 'image/png' && !file.name.toLowerCase().endsWith('.png')) { setStatus('decode-status', 'Choose the original PNG container.'); return; }
    if (file.size > MAX_DECODE_BYTES) { setStatus('decode-status', 'That file is over 25 MB.'); return; }
    state.decodeFile = file; $('decode-file-name').textContent = file.name; $('decode-button').disabled = state.decodeMode !== 'image'; $('message-result').classList.add('hidden'); setStatus('decode-status', 'Image ready to check.', true);
  }

  $('message').addEventListener('input', () => { $('char-count').textContent = `${$('message').value.length.toLocaleString()} / 10,000`; });
  document.querySelectorAll('.source-option').forEach((button) => button.addEventListener('click', () => selectSource(button.dataset.source)));
  $('custom-emoji').addEventListener('input', () => {
    const candidate = $('custom-emoji').value.trim();
    if (isSingleEmoji(candidate)) { updatePreviewEmoji(candidate); setStatus('encode-status', ''); }
    else { $('output-card').classList.add('hidden'); state.emojiMessage = ''; state.outputBlob = null; }
  });
  document.querySelectorAll('.show-password').forEach((button) => button.addEventListener('click', () => { const input = $(button.dataset.target); input.type = input.type === 'password' ? 'text' : 'password'; button.textContent = input.type === 'password' ? 'Show' : 'Hide'; button.setAttribute('aria-label', input.type === 'password' ? 'Show password' : 'Hide password'); }));
  $('carrier-drop').addEventListener('click', () => $('carrier-file').click());
  $('carrier-file').addEventListener('change', (event) => setCarrier(event.target.files[0]));
  $('carrier-drop').addEventListener('dragover', (event) => { event.preventDefault(); $('carrier-drop').classList.add('dragover'); });
  $('carrier-drop').addEventListener('dragleave', () => $('carrier-drop').classList.remove('dragover'));
  $('carrier-drop').addEventListener('drop', (event) => { event.preventDefault(); $('carrier-drop').classList.remove('dragover'); setCarrier(event.dataTransfer.files[0]); });

  $('encode-button').addEventListener('click', async () => {
    const message = $('message').value; const password = $('encode-password').value;
    $('output-card').classList.add('hidden'); $('encode-button').disabled = true;
    try {
      if (!message.trim()) throw new Error('Write a message before creating your image.');
      const messageBytes = new TextEncoder().encode(message).length;
      if (messageBytes > 700000) throw new Error('That message is too large. Keep it under 700 KB.');
      if (state.source === 'emoji' && messageBytes > 4000) throw new Error('For an emoji you can paste into chat, keep the note under 4 KB. Choose your own image to carry a longer message.');
      if (password.length < 8) throw new Error('Choose a password with at least 8 characters.');
      if (state.source === 'emoji') {
        const emoji = $('custom-emoji').value.trim();
        if (!isSingleEmoji(emoji)) throw new Error('Enter one emoji or a single emoji sequence, such as a family or flag.');
        state.emoji = emoji;
      }
      setStatus('encode-status', 'Encrypting your message on this device…');
      const envelope = await encryptMessage(message, password);
      state.emojiMessage = state.source === 'emoji' ? makeEmojiMessage(state.emoji, envelope) : '';
      const sourceBlob = state.source === 'emoji' ? await createEmojiCarrier(state.emoji) : state.carrier;
      if (!sourceBlob) throw new Error('Choose an image to use as the container.');
      const canvas = await imageCanvas(sourceBlob); const pngBlob = await canvasBlob(canvas);
      const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
      const withPayload = addPayloadToPng(pngBytes, envelope);
      state.outputBlob = new Blob([withPayload], { type: 'image/png' });
      state.outputName = state.source === 'emoji' ? 'hush-emoji.png' : `${safeBaseName(state.carrier.name)}-hush.png`;
      $('output-card').classList.remove('hidden'); $('output-card').querySelector('.output-top strong').textContent = state.source === 'emoji' ? 'Your secret emoji is ready' : 'Your image is ready'; $('preview-caption').textContent = state.source === 'emoji' ? 'Your secret emoji is ready.' : 'Your encrypted image is ready.';
      setStatus('encode-status', state.source === 'emoji' ? 'Done. Copy the emoji into your chat (Instagram, WhatsApp, Messenger), then share the password separately.' : 'Done. Send the PNG as a file/document to preserve its data.', true);
    } catch (error) {
      setStatus('encode-status', error.message || 'Something went wrong while creating the image.');
    } finally { $('encode-button').disabled = false; }
  });
  $('download-button').addEventListener('click', () => { if (state.outputBlob) downloadBlob(state.outputBlob, state.outputName); });
  $('emoji-copy-button').addEventListener('click', async () => {
    if (!state.emojiMessage) return;
    try {
      await navigator.clipboard.writeText(state.emojiMessage);
      $('emoji-copy-button').textContent = '✓ Copied — paste into your chat';
      setStatus('encode-status', 'Copied. Paste the complete emoji message into Instagram, WhatsApp or any chat, and share the password separately.', true);
      setTimeout(() => { $('emoji-copy-button').textContent = '▢ Copy emoji for chat'; }, 2600);
    } catch { setStatus('encode-status', 'Clipboard access is unavailable. Try HTTPS or download the PNG instead.'); }
  });
  $('copy-button').addEventListener('click', async () => {
    if (!state.outputBlob) return;
    try {
      if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') throw new Error('Image copying is not supported here. Download the PNG instead.');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': state.outputBlob })]);
      $('copy-button').textContent = '✓'; $('copy-button').title = 'Image copied'; setTimeout(() => { $('copy-button').textContent = '▢'; $('copy-button').title = 'Copy image'; }, 1800);
    } catch (error) { setStatus('encode-status', error.message || 'Could not copy the image. Download it instead.'); }
  });
  $('reset-encode').addEventListener('click', () => { $('message').value = ''; $('encode-password').value = ''; $('char-count').textContent = '0 / 10,000'; $('output-card').classList.add('hidden'); $('preview-caption').textContent = state.source === 'emoji' ? 'Looks like a regular emoji.' : 'Your image, ready to wrap.'; $('emoji-copy-button').textContent = '▢ Copy emoji for chat'; setStatus('encode-status', ''); state.outputBlob = null; state.emojiMessage = ''; });

  function setDecodeMode(mode) {
    state.decodeMode = mode;
    const emojiMode = mode === 'emoji';
    $('emoji-paste-wrap').classList.toggle('hidden', !emojiMode); $('decode-drop').classList.toggle('hidden', emojiMode);
    $('decode-emoji-option').classList.toggle('active', emojiMode); $('decode-image-option').classList.toggle('active', !emojiMode);
    $('decode-emoji-option').setAttribute('aria-pressed', String(emojiMode)); $('decode-image-option').setAttribute('aria-pressed', String(!emojiMode));
    $('decode-button').disabled = emojiMode ? !$('decode-emoji-text').value.trim() : !state.decodeFile;
    $('message-result').classList.add('hidden'); setStatus('decode-status', '');
  }
  $('decode-emoji-option').addEventListener('click', () => setDecodeMode('emoji'));
  $('decode-image-option').addEventListener('click', () => setDecodeMode('image'));
  $('decode-emoji-text').addEventListener('input', () => {
    if (state.decodeMode === 'emoji') $('decode-button').disabled = !$('decode-emoji-text').value.trim();
    $('message-result').classList.add('hidden');
  });
  $('decode-drop').addEventListener('click', () => $('decode-file').click());
  $('decode-file').addEventListener('change', (event) => setDecodeFile(event.target.files[0]));
  for (const eventName of ['dragover', 'dragenter']) $('decode-drop').addEventListener(eventName, (event) => { event.preventDefault(); $('decode-drop').classList.add('dragover'); });
  for (const eventName of ['dragleave', 'drop']) $('decode-drop').addEventListener(eventName, (event) => { event.preventDefault(); $('decode-drop').classList.remove('dragover'); if (eventName === 'drop') setDecodeFile(event.dataTransfer.files[0]); });
  $('decode-button').addEventListener('click', async () => {
    const password = $('decode-password').value; $('message-result').classList.add('hidden'); $('decode-button').disabled = true;
    try {
      if (!password) throw new Error('Enter the password the sender shared with you.');
      let envelope;
      if (state.decodeMode === 'emoji') {
        if (!$('decode-emoji-text').value.trim()) throw new Error('Paste the full emoji message first.');
        setStatus('decode-status', 'Reading the emoji and unlocking the message…');
        envelope = readEmojiMessage($('decode-emoji-text').value);
      } else {
        if (!state.decodeFile) throw new Error('Choose the original PNG image first.');
        setStatus('decode-status', 'Checking the image and unlocking the message…');
        const bytes = new Uint8Array(await state.decodeFile.arrayBuffer()); envelope = findPayload(bytes);
      }
      const message = await decryptMessage(envelope, password);
      $('decoded-message').textContent = message; $('message-result').classList.remove('hidden'); setStatus('decode-status', 'Message unlocked on this device.', true);
    } catch (error) { setStatus('decode-status', error.message || 'Could not open this message.'); }
    finally { $('decode-button').disabled = state.decodeMode === 'emoji' ? !$('decode-emoji-text').value.trim() : !state.decodeFile; }
  });
  $('copy-message').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText($('decoded-message').textContent); $('copy-message').textContent = '✓ Copied'; setTimeout(() => { $('copy-message').textContent = '▢ Copy message'; }, 1600); }
    catch { setStatus('decode-status', 'Could not copy automatically. Select and copy the message instead.'); }
  });

  $('encode-tab').addEventListener('click', () => {
    $('encode-tab').classList.add('active'); $('decode-tab').classList.remove('active'); $('encode-tab').setAttribute('aria-selected', 'true'); $('decode-tab').setAttribute('aria-selected', 'false'); $('encode-panel').classList.add('active'); $('encode-panel').hidden = false; $('decode-panel').classList.remove('active'); $('decode-panel').hidden = true;
  });
  $('decode-tab').addEventListener('click', () => {
    $('decode-tab').classList.add('active'); $('encode-tab').classList.remove('active'); $('decode-tab').setAttribute('aria-selected', 'true'); $('encode-tab').setAttribute('aria-selected', 'false'); $('decode-panel').classList.add('active'); $('decode-panel').hidden = false; $('encode-panel').classList.remove('active'); $('encode-panel').hidden = true;
  });
})();
