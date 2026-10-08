'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, Trash2, Loader2, Bot, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatbotProps {
  lang: string
}

const SUGGESTIONS: Record<string, string[]> = {
  hi: [
    'Instagram pe chalega?',
    'Password bhul gaya?',
    'Quantum se tod sakte?',
    'roast me',
  ],
  en: [
    'Works on Instagram?',
    'Forgot password?',
    'Can quantum break it?',
    'roast me',
  ],
  es: [
    '¿Funciona en Instagram?',
    '¿Olvidé mi contraseña?',
    '¿Cuántica lo rompe?',
    'roast me',
  ],
  ar: [
    'يعمل على إنستغرام؟',
    'نسيت كلمة المرور؟',
    'هل الكم يكسره؟',
    'roast me',
  ],
}

export function Chatbot({ lang }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const chatLang = (lang === 'hi' || lang === 'en' || lang === 'es' || lang === 'ar') ? lang : 'hi'
  const suggestions = SUGGESTIONS[chatLang] || SUGGESTIONS.hi

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const send = useCallback(async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || loading) return

    const userMsg: Message = { role: 'user', content }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          lang: chatLang,
        }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply || '...' }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Bhai network dikkat de raha hai 😏' }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages, chatLang])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const clear = () => setMessages([])

  return (
    <div className="rounded-2xl border border-border/60 overflow-hidden glass">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-primary/5 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white">
              <Bot className="h-4 w-4" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
          </div>
          <div>
            <div className="text-sm font-semibold flex items-center gap-1.5">
              Hush Bot
              <Sparkles className="h-3 w-3 text-primary" />
            </div>
            <div className="text-[10px] text-muted-foreground">Savage mode · online</div>
          </div>
        </div>
        {messages.length > 0 && (
          <Button onClick={clear} variant="ghost" size="icon" className="h-7 w-7 rounded-full" aria-label="Clear chat">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="h-[360px] overflow-y-auto fancy-scroll px-4 py-4 space-y-3"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 mb-3">
              <Bot className="h-7 w-7 text-primary" />
            </div>
            <div className="text-sm font-medium mb-1">Sawal puchh bhai</div>
            <div className="text-xs text-muted-foreground mb-4">Roast free hai 😏</div>
            <div className="flex flex-wrap gap-1.5 justify-center max-w-sm">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full px-3 py-1.5 text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20 font-medium"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm break-words whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-muted/50 rounded-tl-sm'
                  }`}
                  style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                >
                  {m.content}
                </div>
                {m.role === 'user' && (
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-muted text-muted-foreground shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </motion.div>
            ))}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 justify-start">
                <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-white shrink-0">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-3.5 py-2.5 flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border/60 p-3 bg-background/40">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Sawal likho bhai..."
            rows={1}
            className="resize-none min-h-[42px] max-h-28 fancy-scroll text-sm bg-background/60 border-border/60 rounded-full px-4 py-2.5"
          />
          <Button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            size="icon"
            className="rounded-full h-10 w-10 shrink-0 bg-gradient-to-br from-violet-500 to-pink-500 hover:opacity-90"
            aria-label="Send"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <div className="text-[10px] text-muted-foreground text-center mt-2">
          Enter = bhej · Shift+Enter = nayi line
        </div>
      </div>
    </div>
  )
}
