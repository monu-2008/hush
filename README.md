# Hush

Hush is a static, client-side hidden-message tool. It encrypts a note with AES-256-GCM using a password-derived key (PBKDF2-SHA-256, 310,000 iterations). A generated emoji can carry the encrypted data as invisible Unicode characters after the visible emoji, or as a private ancillary PNG chunk in a small transparent PNG. It never uploads the image, message, or password.

## Run locally

Web Crypto requires a secure browser context. `localhost` is treated as secure:

1. Open a terminal in this folder.
2. Run `npm start` or `python -m http.server 8000`.
3. Visit `http://localhost:8000`.

Opening `index.html` directly as a `file://` URL may disable cryptography in the browser.

## Deploy

Deploy the contents of this folder to any static web host, such as Cloudflare Pages, GitHub Pages, Netlify, or Vercel. Configure the site to use HTTPS. No backend, database, build step, or environment variables are needed.

## Use

1. On **Encode**, enter a note and a strong password (minimum 8 characters).
2. Type or paste any single emoji (including a multi-codepoint emoji such as a flag or family) and choose **Copy emoji for chat** to copy it followed by invisible encrypted text. Emoji-text notes are limited to 4 KB to keep the copied text a practical size.
3. The recipient copies the complete emoji message from chat, pastes it into **Decode**, and enters the password. They can also upload the PNG alternative.
4. For an ordinary image carrier, choose a PNG, JPG, WebP, or GIF. Uploaded images are converted to PNG; the first frame is used for animated GIFs. Send the output PNG as a file/document.
5. Share the password separately.

## Important behavior

- The emoji-text carrier displays as the selected emoji. The hidden data uses zero-width Unicode characters, not metadata inside the Unicode emoji itself. Some chat apps may strip these characters, so try sending a test first or use the PNG as a file/document.
- The generated PNG is a transparent, emoji-size image. Its pixel art looks like an emoji, but chat apps treat it as an image/sticker rather than the built-in Unicode emoji character.
- The supplied-image carrier keeps the visible pixels unchanged when converted to PNG. This is metadata/container embedding, not pixel steganography. A person inspecting PNG chunks can discover that encrypted data exists, but cannot read it without the password.
- Social networks and messaging apps often resize images or strip metadata. Send the original PNG as a file/document; screenshots, recompression, and format conversion will usually remove the message.
- Passwords are not transmitted or recoverable. If the password is lost, the message cannot be decrypted.
- Hush is a static site. It does not store or transmit notes, passwords, or images, and it has no third-party runtime requests.

## Files

- `index.html` — app interface
- `styles.css` — responsive styling
- `app.js` — encryption, PNG container, and interaction logic
- `core.js` — reusable encryption and PNG container functions
- `core.test.js` — automated round-trip and validation tests (`node --test` or `npm test`)
