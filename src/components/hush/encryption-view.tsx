'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Lock, Cpu, Image as ImageIcon, Smile, Binary, Flame, Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Chatbot } from './chatbot'

interface EncryptionViewProps {
  lang: string
}

type Lang = 'hi' | 'en'

const HI = {
  hero: '🔐 Encryption ka khel',
  heroSub: 'Bhai samajh le — privacy ka price, password ka price',
  s1: 'AES-256-GCM kya hai bhai?',
  s1Body: 'Soch le tumhare paas ek locker hai. Uska key 256 bits ka hai. 256 bits matlab 2²⁵⁶ combinations. Bhai itne combinations hain ki agar tum 1000 supercomputers lekar brute force karo, to universe ki life khatam ho jayegi 🔥 password nahi tutega. Banks bhi yahi use karte hain. Tumhara Instagram password se zyada strong.',
  s2: 'Emoji me kaise chhupta hai?',
  s2Body: 'Tumhara encrypted payload lambi string hai. Hum har byte ko 2 "Variation Selector" (U+FE00–U+FE0F) characters me convert karte hain. Ye invisible hote hain par Instagram, WhatsApp inhe preserve karte hain kyunki ❤️ bhi isi ko use karta hai. To bhai message bhejo, dosto ko sirf emoji dikhega. Andar poora encrypted payload chhupa hua hai.',
  s2Code: '// Emoji carrier — payload ko invisible Variation Selectors me chhupta hai',
  s3: 'Image (PNG) me kaise?',
  s3Body: 'PNG me "huSH" naam ka custom chunk daal dete hain. Image bilkul same dikhti hai — pixel ek bhi change nahi hota. Andar encrypted payload metadata chunk me hai. Recipient image upload karega, password daalega, message khul jayega.',
  s3Code: '// PNG chunk carrier — payload image metadata me chhupta hai',
  s4: 'Pixel LSB (asli steganography)',
  s4Body: 'LSB = Least Significant Bit. Har pixel ke RGB channel ka sabse chhota bit change karte hain. Human eye se difference nahi dikhta. Bhai true spy shit 🕵️. Lekin dhyan rakh — JPEG conversion, screenshots se payload kharab ho sakta hai. PNG file hi bhejo.',
  s4Code: '// Pixel LSB — har byte ko pixel ke LSB me chhupta hai',
  s5: 'Quantum computer ka sach 🖕',
  s5Body: 'Bhai honestly batau — quantum computer AES-256 ko "tod" nahi sakta, but weak karna zaroor sakta hai. Grover\'s algorithm se 2²⁵⁶ combinations 2¹²⁸ ho jate hain. 2¹²⁸ bhi itna bada hai ki abhi ke quantum computers (~1000 qubits) se brute force impossible hai — 256+ million qubits chahiye. Lekin agar tumhara password 8 char ka hai, to quantum+classical combo usse faster tod sakta hai. Isliye 12+ char password use kar, password generator use kar, aur shaant raho. Hush "quantum safe" claim nahi karta — hum sirf itna bolte hain ki "abhi ke technology se practically infeasible".',
  codeTitle: 'Asli Code 👇',
  chatTitle: '🤖 Sawal puchh — main roast karunga',
  chatSub: 'Bhai kuch bhi puchho. Encryption, password, Instagram — sab kuch. Bas "roast me" mat likhna agar sentiment soft hai 😏',
  engBtn: 'English',
  engToggle: 'Aur bhai — English version bhi chahta hai?',
}

const EN = {
  hero: '🔐 The Encryption Game',
  heroSub: 'Bro, understand — privacy has a price, password has a price',
  s1: 'What is AES-256-GCM?',
  s1Body: 'Imagine a locker. The key is 256 bits long. That\'s 2²⁵⁶ combinations. So many that even with 1000 supercomputers brute-forcing, the universe would end before the password breaks. Banks use this. Stronger than your Instagram password.',
  s2: 'How does it hide in emoji?',
  s2Body: 'Your encrypted payload is a long string. We convert each byte into 2 "Variation Selector" characters (U+FE00–U+FE0F). They\'re invisible but Instagram, WhatsApp preserve them because ❤️ also uses them. Send the message, friends only see the emoji. The full encrypted payload is hidden inside.',
  s2Code: '// Emoji carrier — payload hides in invisible Variation Selectors',
  s3: 'How does it hide in images?',
  s3Body: 'We inject a custom "huSH" chunk into the PNG. The image looks identical — not a single pixel changes. The encrypted payload sits in a metadata chunk inside. Recipient uploads the image, enters the password, message unlocks.',
  s3Code: '// PNG chunk carrier — payload hides in image metadata',
  s4: 'Pixel LSB (true steganography)',
  s4Body: 'LSB = Least Significant Bit. We modify the smallest bit of each pixel\'s RGB channels. Human eye can\'t tell the difference. True spy stuff 🕵️. But beware — JPEG conversion, screenshots can break the payload. Send PNG only.',
  s4Code: '// Pixel LSB — each byte hides in pixel LSBs',
  s5: 'The quantum truth 🖕',
  s5Body: 'Bro honestly — quantum computers can\'t "break" AES-256, but they can weaken it. Grover\'s algorithm reduces 2²⁵⁶ combinations to 2¹²⁸. 2¹²⁸ is still so large that current quantum computers (~1000 qubits) can\'t brute force it — you\'d need 256+ million qubits. But if your password is 8 chars, a quantum+classical combo could crack it faster. So use 12+ char passwords, use the password generator, and chill. Hush doesn\'t claim "quantum safe" — we just say "practically infeasible with current tech".',
  codeTitle: 'Real Code 👇',
  chatTitle: '🤖 Ask me anything — I\'ll roast',
  chatSub: 'Bro ask anything. Encryption, passwords, Instagram — everything. Just don\'t type "roast me" if your sentiment is soft 😏',
  engBtn: 'Hinglish',
  engToggle: 'Want the Hinglish version?',
}

const CODE_SNIPPETS = {
  emoji: `// Emoji carrier — payload hide in invisible Variation Selectors
const VS_BASE = 0xfe00  // U+FE00 to U+FE0F

export function makeEmojiMessage(emoji, serialized) {
  const data = encoder.encode(serialized)
  let hidden = ''
  for (const byte of data) {
    const high = (byte >> 4) & 0x0f  // high nibble
    const low = byte & 0x0f          // low nibble
    // Har nibble (4 bits) ek VS character me convert
    hidden += String.fromCodePoint(VS_BASE + high)
            + String.fromCodePoint(VS_BASE + low)
  }
  // 2 VS chars = 1 byte. Invisible. Instagram-safe. 🖕
  return emoji + hidden
}`,
  png: `// PNG chunk carrier — payload image metadata me chhupta hai
const CHUNK_TYPE = 'huSH'  // custom chunk naam

export function addPayloadToPng(pngBytes, payload) {
  const chunks = parseChunks(pngBytes)
  const parts = [pngBytes.subarray(0, 8)]  // PNG signature
  for (const chunk of chunks) {
    if (chunk.type === CHUNK_TYPE) continue  // purana payload hata
    if (chunk.type === 'IEND') {
      // IEND se pehle humara chunk daal do
      parts.push(makeChunk(CHUNK_TYPE, encoder.encode(payload)))
    }
    parts.push(pngBytes.subarray(chunk.start, chunk.end))
  }
  return concatBytes(...parts)  // image same dikhti hai, andar payload
}`,
  lsb: `// Pixel LSB — har byte ko pixel ke LSB me chhupta hai
export function encodeLsb(imageData, payload) {
  const data = encoder.encode(payload)
  // Pehle 4 bytes = payload length (big-endian)
  const lengthBytes = new Uint8Array(4)
  new DataView(lengthBytes.buffer).setUint32(0, data.length, false)
  const full = concatBytes(lengthBytes, data)

  let bitIndex = 0
  const out = new Uint8ClampedArray(imageData.data)
  // RGB channels (skip alpha) — 3 bits per pixel
  for (let i = 0; i < out.length && bitIndex < full.length * 8; i += 4) {
    for (let c = 0; c < 3; c++) {
      if (bitIndex >= full.length * 8) break
      const byteIdx = Math.floor(bitIndex / 8)
      const bitInByte = 7 - (bitIndex % 8)
      const bit = (full[byteIdx] >> bitInByte) & 1
      // LSB change — human eye se invisible 👁️
      out[i + c] = (out[i + c] & 0xfe) | bit
      bitIndex++
    }
  }
  return new ImageData(out, imageData.width, imageData.height)
}`,
}

function CodeBlock({ code, title }: { code: string; title: string }) {
  return (
    <div className="rounded-xl overflow-hidden border bg-zinc-950 text-zinc-100">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <div className="h-3 w-3 rounded-full bg-green-500" />
          </div>
          <span className="text-xs text-zinc-400 ml-2 font-mono">{title}</span>
        </div>
        <span className="text-xs text-zinc-500 font-mono">TypeScript</span>
      </div>
      <pre className="p-4 text-xs overflow-x-auto fancy-scroll font-mono leading-relaxed"><code>{code}</code></pre>
    </div>
  )
}

function Section({ icon: Icon, title, children, delay = 0 }: { icon: any; title: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ delay, type: 'spring', stiffness: 100 }}
      className="glass rounded-2xl p-6 sm:p-8"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
      </div>
      <div className="prose prose-sm dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed text-muted-foreground">
        {children}
      </div>
    </motion.section>
  )
}

export function EncryptionView({ lang }: EncryptionViewProps) {
  const [pageLang, setPageLang] = useState<Lang>(lang === 'hi' ? 'hi' : 'en')
  const t = pageLang === 'hi' ? HI : EN

  return (
    <div className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageLang(pageLang === 'hi' ? 'en' : 'hi')}
            className="gap-1.5 rounded-full"
          >
            <Languages className="h-3.5 w-3.5" /> {t.engBtn}
          </Button>
        </div>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight gradient-text">{t.hero}</h1>
        <p className="text-muted-foreground mt-4 text-base sm:text-lg max-w-2xl mx-auto">{t.heroSub}</p>
      </motion.div>

      {/* Section 1 — AES */}
      <Section icon={Lock} title={t.s1}>
        <p>{t.s1Body}</p>
      </Section>

      {/* Section 2 — Emoji + code */}
      <Section icon={Smile} title={t.s2} delay={0.05}>
        <p>{t.s2Body}</p>
        <div className="mt-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Binary className="h-3 w-3" /> {t.codeTitle}
          </div>
          <CodeBlock code={CODE_SNIPPETS.emoji} title={t.s2Code} />
        </div>
      </Section>

      {/* Section 3 — PNG */}
      <Section icon={ImageIcon} title={t.s3} delay={0.1}>
        <p>{t.s3Body}</p>
        <div className="mt-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Binary className="h-3 w-3" /> {t.codeTitle}
          </div>
          <CodeBlock code={CODE_SNIPPETS.png} title={t.s3Code} />
        </div>
      </Section>

      {/* Section 4 — LSB */}
      <Section icon={Cpu} title={t.s4} delay={0.15}>
        <p>{t.s4Body}</p>
        <div className="mt-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Binary className="h-3 w-3" /> {t.codeTitle}
          </div>
          <CodeBlock code={CODE_SNIPPETS.lsb} title={t.s4Code} />
        </div>
      </Section>

      {/* Section 5 — Quantum honest */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 100 }}
        className="glass rounded-2xl p-6 sm:p-8 border-amber-500/30"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
            <Flame className="h-5 w-5" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">{t.s5}</h2>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">{t.s5Body}</p>
      </motion.section>

      {/* Chatbot */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ delay: 0.25 }}
        className="glass rounded-2xl p-6 sm:p-8"
      >
        <h2 className="text-xl sm:text-2xl font-bold mb-1">{t.chatTitle}</h2>
        <p className="text-sm text-muted-foreground mb-4">{t.chatSub}</p>
        <Chatbot lang={pageLang} />
      </motion.section>
    </div>
  )
}
