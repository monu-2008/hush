import { NextRequest, NextResponse } from 'next/server'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// Rule-based savage chatbot — no external AI SDK needed, works on Vercel.
// Detects keywords and returns savage Hinglish/English/Spanish/Arabic responses.

type Lang = 'hi' | 'en' | 'es' | 'ar'

interface Rule {
  keywords: string[]
  responses: Record<Lang, string[]>
}

const RULES: Rule[] = [
  // Instagram
  {
    keywords: ['instagram', 'insta', 'ig'],
    responses: {
      hi: [
        'Haan bhai, Instagram pe chalega 💯 Variation Selectors use karte hain jo Instagram khud preserve karta hai (❤️ bhi isi se banta hai). To bhej de, dosto ko sirf emoji dikhega 😏',
        'Bhai Instagram ka CEO khud try kare to bhi nahi padh paayega 🖕 Variation Selectors = invisible chars jo IG ko chahiye emoji render karne ke liye.',
      ],
      en: [
        'Yes bro, works on Instagram 💯 We use Variation Selectors which Instagram itself preserves (❤️ is built with them). Send it, friends only see the emoji 😏',
        "Instagram\'s CEO could try and still couldn\'t read it 🖕 Variation Selectors = invisible chars IG needs for emoji rendering.",
      ],
      es: [
        'Sí bro, funciona en Instagram 💯 Usamos Variation Selectors que Instagram preserva (❤️ se hace con ellos). Envíalo, tus amigos solo verán el emoji 😏',
      ],
      ar: [
        'نعم يا أخي، يعمل على إنستغرام 💯 نستخدم Variation Selectors التي يحتفظ بها إنستغرام نفسه (❤️ مصنوع منها). أرسله، أصدقاؤك سيرون الإيموجي فقط 😏',
      ],
    },
  },
  // WhatsApp
  {
    keywords: ['whatsapp', 'whats app', 'wa'],
    responses: {
      hi: [
        'WhatsApp pe bhi chalega bhai ✅ Sab Meta apps (Instagram, WhatsApp, Messenger) Variation Selectors preserve karte hain. Bindaas bhej 😏',
      ],
      en: ['Works on WhatsApp too bro ✅ All Meta apps (Instagram, WhatsApp, Messenger) preserve Variation Selectors. Send freely 😏'],
      es: ['Funciona en WhatsApp también ✅ Todas las apps de Meta preservan Variation Selectors. Envía libremente 😏'],
      ar: ['يعمل على واتساب أيضاً ✅ جميع تطبيقات ميتا تحتفظ بـ Variation Selectors. أرسل بحرية 😏'],
    },
  },
  // Password forgot
  {
    keywords: ['forgot', 'forget', 'bhul', 'bhool', 'olvid', 'نسيت'],
    responses: {
      hi: [
        'Bhai bhul gaya to bhul gaya 😏 Hum bhi nahi dekh sakte, server ko nahi pata password. Roast mat kar, agle baar save kar liya kar 🔥',
        'Password recover nahi hota bhai 💀 Hush ka design hi aisa hai — privacy ka price. Save kar le next time.',
      ],
      en: [
        'Forgot it bro? Then it\'s gone 😏 We can\'t see it either, server doesn\'t know. Save it next time 🔥',
        'Password can\'t be recovered bro 💀 That\'s the price of privacy — Hush is designed this way.',
      ],
      es: ['¿Olvidaste la contraseña? Se acabó 😏 No podemos verla, el servidor no la conoce. Guárdala la próxima vez 🔥'],
      ar: ['نسيت كلمة المرور؟ انتهت 😏 لا يمكننا رؤيتها، الخادم لا يعرفها. احفظها المرة القادمة 🔥'],
    },
  },
  // Quantum
  {
    keywords: ['quantum', 'qubit', 'shor'],
    responses: {
      hi: [
        'Bhai sach batau — quantum computer AES-256 ko "tod" nahi sakta, but weak karna zaroor sakta hai 😏 Grover\'s algorithm se 2^256 → 2^128 ho jata hai. Abhi ke quantum computers ~1000 qubits wale hain, 2^128 ke liye 256+ million chahiye. Lekin agar password 8 char hai to quantum+classical combo faster tod sakta hai. Isliye 12+ char password use kar, password generator use kar.',
        'Quantum computer? Bhai honestly batau — Hush "quantum safe" claim nahi karta. Quantum AES-256 ko weak karta hai (Grover\'s algo, 2^256 → 2^128), but abhi ke ~1000 qubit wale quantum se brute force still infeasible. 256+ million qubits chahiye. Lekin weak password? Quantum+classical combo tod sakta hai. So 12+ char strong password use kar.',
      ],
      en: [
        'Bro honestly — quantum computers can\'t "break" AES-256 but they weaken it 😏 Grover\'s algorithm reduces 2^256 to 2^128. Current quantum computers have ~1000 qubits, you\'d need 256+ million for 2^128. But weak 8-char passwords? Quantum+classical could crack faster. Use 12+ char passwords, use the generator.',
        'Quantum computer? Bro honestly — Hush doesn\'t claim "quantum safe". Quantum weakens AES-256 (Grover\'s, 2^256 → 2^128), but current ~1000 qubit machines can\'t brute force it — you need 256+ million. But weak passwords? Quantum+classical could crack. So use 12+ char strong passwords.',
      ],
      es: ['Bro honestamente — las computadoras cuánticas no "rompen" AES-256 pero lo debilitan 😏 Grover reduce 2^256 a 2^128. Las cuánticas actuales tienen ~1000 qubits, necesitarías 256+ millones. Pero contraseñas débiles de 8 caracteres? Cuántica+clásica podría romperlas. Usa 12+ caracteres.'],
      ar: ['يا أخي بصراحة — الحواسيب الكمية لا "تكسر" AES-256 لكنها تضعفه 😏 خوارزمية غروفر تقلل 2^256 إلى 2^128. الحواسيب الحالية ~1000 كيوبت، تحتاج 256+ مليون. لكن كلمات المرور الضعيفة؟ الكم+الكلاسيكي يمكن كسرها. استخدم 12+ حرف.'],
    },
  },
  // Roast me
  {
    keywords: ['roast me', 'roast', 'tujhe roast', 'roast kar'],
    responses: {
      hi: [
        'Bhai tu Hush pe aaya, encrypt karne ke liye message type karne ke bajaye chatbot ko roast karne ki soch raha hai? 😏 Tu to ch\*tiya hai bhai 💀 Itna free time hai to message encrypt karke dosto ko bhej, kuch productive kar 🖕',
        'Roast maang raha hai? Bhai tu apni life pe focus kar 😏 Hush banaya gaya privacy ke liye, tere timepass ke liye nahi. Ab ja, ek message encrypt kar, password set kar, dosto ko bhej — kuch kaam kar 💀',
        'Tu roast maangta hai? Bhai tere paas AES-256-GCM hai, emoji carrier hai, Instagram-safe encryption hai, aur tu yaha chatbot se baat kar raha hai? 🤡 Ja, message encrypt kar, productive reh 🔥',
      ],
      en: [
        'Bro you came to Hush, and instead of encrypting a message, you want to roast the chatbot? 😏 You\'re a clown bro 💀 If you have free time, encrypt a message and send to friends, do something productive 🖕',
        'You want a roast? Bro focus on your life 😏 Hush was made for privacy, not your timepass. Now go, encrypt a message, set a password, send to friends — do something 💀',
        'You want a roast? Bro you have AES-256-GCM, emoji carrier, Instagram-safe encryption, and you\'re here chatting with a bot? 🤡 Go encrypt a message, be productive 🔥',
      ],
      es: ['Bro viniste a Hush y en lugar de cifrar un mensaje quieres roasting al bot? 😏 Eres un payaso 💀 Si tienes tiempo libre, cifra un mensaje 🖕'],
      ar: ['أتيت إلى Hush وبدلاً من تشفير رسالة تريد السخرية من البوت؟ 😏 أنت مهرج 💀 إذا كان لديك وقت فراغ، شفر رسالة 🖕'],
    },
  },
  // AES / encryption
  {
    keywords: ['aes', 'encryption', 'encrypt', 'gcm', 'cipher'],
    responses: {
      hi: [
        'AES-256-GCM bhai — military grade encryption 🔥 Banks bhi yahi use karte hain. 256 bits ka key, 2^256 combinations. PBKDF2-SHA-256 se password se key derive hota hai, 310,000 iterations. Brute force = impossible 🖕',
      ],
      en: ['AES-256-GCM bro — military grade encryption 🔥 Banks use this too. 256-bit key, 2^256 combinations. PBKDF2-SHA-256 derives key from password, 310,000 iterations. Brute force = impossible 🖕'],
      es: ['AES-256-GCM bro — cifrado militar 🔥 Los bancos también lo usan. Clave de 256 bits, 2^256 combinaciones. PBKDF2-SHA-256 deriva la clave, 310,000 iteraciones. Fuerza bruta = imposible 🖕'],
      ar: ['AES-256-GCM يا أخي — تشفير عسكري 🔥 البنوك تستخدمه أيضاً. مفتاح 256 بت، 2^256 تركيبة. PBKDF2-SHA-256 يشتق المفتاح، 310,000 تكرار. القوة الغاشمة = مستحيل 🖕'],
    },
  },
  // Emoji
  {
    keywords: ['emoji', 'emogi', 'imoji'],
    responses: {
      hi: [
        'Emoji carrier: hum encrypted payload ko Variation Selectors (U+FE00-FE0F) me convert karte hain 😏 Ye invisible chars hain par Instagram/WhatsApp inhe preserve karte hain kyunki ❤️ bhi isi se banta hai. 2 VS chars = 1 byte. Sneaky 🖕',
      ],
      en: ['Emoji carrier: we convert encrypted payload into Variation Selectors (U+FE00-FE0F) 😏 These are invisible chars but Instagram/WhatsApp preserve them because ❤️ is built with them. 2 VS chars = 1 byte. Sneaky 🖕'],
      es: ['Portador emoji: convertimos el payload en Variation Selectors (U+FE00-FE0F) 😏 Son invisibles pero Instagram/WhatsApp los preservan porque ❤️ se hace con ellos. 2 VS = 1 byte 🖕'],
      ar: ['حامل الإيموجي: نحوّل الحمولة إلى Variation Selectors (U+FE00-FE0F) 😏 غير مرئية لكن إنستغرام/واتساب يحتفظون بها لأن ❤️ مصنوع منها. 2 VS = 1 بايت 🖕'],
    },
  },
  // Image / PNG
  {
    keywords: ['image', 'png', 'photo', 'picture', 'imagen', 'صورة'],
    responses: {
      hi: [
        'PNG carrier: hum "huSH" naam ka custom chunk image me daal dete hain 🖼️ Image bilkul same dikhti hai, ek pixel bhi change nahi hota. Andar encrypted payload metadata chunk me hai. Lekin JPEG me convert mat kar, payload kharab ho jayega.',
      ],
      en: ['PNG carrier: we inject a custom "huSH" chunk into the image 🖼️ Image looks identical, not a single pixel changes. The encrypted payload sits in a metadata chunk. But don\'t convert to JPEG, payload breaks.'],
      es: ['Portador PNG: inyectamos un chunk "huSH" en la imagen 🖼️ La imagen se ve idéntica, sin cambios de píxeles. El payload está en metadatos. No conviertas a JPEG.'],
      ar: ['حامل PNG: نحقن chunk مخصص "huSH" في الصورة 🖼️ الصورة تبدو مطابقة، لا يتغير بكسل واحد. الحمولة في البيانات الوصفية. لا تحول إلى JPEG.'],
    },
  },
  // Safe / secure
  {
    keywords: ['safe', 'secure', 'safety', 'seguro', 'آمن'],
    responses: {
      hi: [
        'Safe? Bhai 100% 🔥 Sab kuch browser me hota hai, server ko message ya password nahi pata. AES-256-GCM = military grade. Password 12+ char rakh, share alag channel se, koi nahi padh paayega 😏',
      ],
      en: ['Safe? Bro 100% 🔥 Everything happens in browser, server doesn\'t know message or password. AES-256-GCM = military grade. Use 12+ char password, share via separate channel, nobody can read it 😏'],
      es: ['¿Seguro? Bro 100% 🔥 Todo pasa en el navegador, el servidor no sabe nada. AES-256-GCM = militar. Usa 12+ caracteres, comparte por otro canal 😏'],
      ar: ['آمن؟ يا أخي 100% 🔥 كل شيء يحدث في المتصفح، الخادم لا يعرف شيئاً. AES-256-GCM = عسكري. استخدم 12+ حرف، شارك عبر قناة أخرى 😏'],
    },
  },
  // Decoy
  {
    keywords: ['decoy', 'deniability', 'fake message'],
    responses: {
      hi: [
        'Decoy = plausible deniability 😏 Real password + fake password set kar. Fake password dene pe fake message dikhega. Koi force kare to fake dikha de. Sankat se bachav 🖕',
      ],
      en: ['Decoy = plausible deniability 😏 Set real password + fake password. Fake password shows fake message. If forced, show fake. Saves you 🖕'],
      es: ['Señuelo = negabilidad plausible 😏 Contraseña real + falsa. La falsa muestra mensaje falso. Si te obligan, muestra el falso 🖕'],
      ar: ['التمويه = إنكار معقول 😏 كلمة مرور حقيقية + وهمية. الوهمية تظهر رسالة وهمية. إذا أُجبرت، اعرض الوهمية 🖕'],
    },
  },
  // Hello / hi
  {
    keywords: ['hi', 'hello', 'hey', 'namaste', 'hola', 'سلام', 'مرحبا'],
    responses: {
      hi: ['Haan bhai bolo 😏 Kya puchna hai? Encryption, Instagram, password — kuch bhi. Bas "roast me" mat likhna agar sentiment soft hai 🔥'],
      en: ['Yes bro speak 😏 What do you want to ask? Encryption, Instagram, password — anything. Just don\'t type "roast me" if your sentiment is soft 🔥'],
      es: ['Sí bro habla 😏 ¿Qué quieres preguntar? Cifrado, Instagram, contraseña — cualquier cosa. Solo no escribas "roast me" si eres sensible 🔥'],
      ar: ['نعم يا أخي تكلّم 😏 ماذا تريد أن تسأل؟ التشفير، إنستغرام، كلمة المرور — أي شيء. فقط لا تكتب "roast me" إذا كنت حساساً 🔥'],
    },
  },
]

const FALLBACKS: Record<Lang, string[]> = {
  hi: [
    'Bhai ye specific sawal ka answer nahi pata, but Hush ke baare me kuch bhi puchh — encryption, Instagram, password, emoji, image, quantum 😏',
    'Hmm, ye nahi samajh aaya 😏 Aur detail me bata, ya alag sawal puchh. Roast mode bhi available hai "roast me" likh ke 🔥',
    'Bhai main Hush ka assistant hu. Encryption, carriers, password — ye sab puchh. Personal advice nahi deta 😏',
  ],
  en: [
    'Bro I don\'t know this specific question, but ask anything about Hush — encryption, Instagram, password, emoji, image, quantum 😏',
    'Hmm, didn\'t get that 😏 More detail please, or ask different question. Roast mode available by typing "roast me" 🔥',
    'Bro I\'m Hush\'s assistant. Ask about encryption, carriers, password — that\'s my jam 😏',
  ],
  es: [
    'Bro no sé esta pregunta específica, pero pregunta sobre Hush — cifrado, Instagram, contraseña 😏',
    'Hmm, no entendí 😏 Más detalle, o pregunta otra cosa. Modo roast con "roast me" 🔥',
  ],
  ar: [
    'لا أعرف هذه الأسئلة المحددة، ولكن اسأل عن Hush — التشفير، إنستغرام، كلمة المرور 😏',
    'همم، لم أفهم 😏 المزيد من التفاصيل، أو اسأل شيئاً آخر. وضع السخرية بـ "roast me" 🔥',
  ],
}

function detectLang(text: string): Lang {
  const lower = text.toLowerCase()
  if (/[\u0900-\u097F]/.test(text)) return 'hi' // Devanagari
  if (/[\u0600-\u06FF]/.test(text)) return 'ar' // Arabic
  if (/\b(hola|gracias|por favor|qué|cómo|dónde|cuándo)\b/i.test(lower)) return 'es'
  return 'hi' // default Hinglish
}

function matchRule(text: string, lang: Lang): string {
  const lower = text.toLowerCase()
  // Find matching rule
  for (const rule of RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      const responses = rule.responses[lang] || rule.responses.en || rule.responses.hi
      return responses[Math.floor(Math.random() * responses.length)]
    }
  }
  // Fallback
  const fallbacks = FALLBACKS[lang] || FALLBACKS.hi
  return fallbacks[Math.floor(Math.random() * fallbacks.length)]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, lang = 'hi' }: { messages: ChatMessage[]; lang?: string } = body

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 })
    }

    // Get last user message
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
    if (!lastUserMsg) {
      return NextResponse.json({ reply: 'Bhai kuch to likh 😏' })
    }

    // Detect language from message or use provided lang
    const effectiveLang: Lang = (lang === 'hi' || lang === 'en' || lang === 'es' || lang === 'ar')
      ? lang
      : detectLang(lastUserMsg.content)

    const reply = matchRule(lastUserMsg.content, effectiveLang)
    return NextResponse.json({ reply })
  } catch (e: any) {
    console.error('Chat API error:', e?.message || e)
    return NextResponse.json(
      { reply: 'Bhai server thoda aaram kar raha hai, do second baad try kar 😏' },
      { status: 200 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'Hush chatbot API. POST messages to chat.' })
}
