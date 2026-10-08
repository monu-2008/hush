'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatbotProps {
  lang: string
}

const SUGGESTIONS: Record<string, string[]> = {
  hi: [
    'Bhai ye Instagram pe chalega?',
    'Password bhul gaya to?',
    'Quantum computer se tod sakte?',
    'roast me',
  ],
  en: [
    'Will this work on Instagram?',
    'Forgot my password?',
    'Can quantum computers crack this?',
    'roast me',
  ],
  es: [
    '¿Funcionará en Instagram?',
    '¿Olvidé mi contraseña?',
    '¿Pueden las computadoras cuánticas romper esto?',
    'roast me',
  ],
  ar: [
    'هل سيعمل على إنستغرام؟',
    'نسيت كلمة المرور؟',
    'هل يمكن للحوسبة الكمية كسر هذا؟',
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
    <div className="rounded-2xl border bg-background/40 backdrop-blur overflow-hidden">
      {/* Messages */}
      <div
        ref={scrollRef}
        className="h-80 overflow-y-auto fancy-scroll p-4 space-y-3 bg-gradient-to-b from-muted/10 to-transparent"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="text-4xl mb-3">🤖</div>
            <div className="text-sm font-medium mb-1">Sawal puchh bhai</div>
            <div className="text-xs text-muted-foreground mb-4">Roast karna free hai 😏</div>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full px-3 py-1.5 text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
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
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words ${
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted/60 rounded-bl-md'
                  }`}
                >
                  {m.role === 'assistant' && <span className="mr-1">🤖</span>}
                  {m.content}
                </div>
              </motion.div>
            ))}
            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-muted/60 rounded-2xl rounded-bl-md px-4 py-2.5 text-sm flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span className="text-xs text-muted-foreground">Bhai soch raha hu...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Input */}
      <div className="border-t p-3 bg-background/60 backdrop-blur">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Sawal likho bhai..."
            rows={1}
            className="resize-none min-h-[44px] max-h-32 fancy-scroll text-sm"
          />
          {messages.length > 0 && (
            <Button onClick={clear} variant="ghost" size="icon" className="rounded-full h-9 w-9 shrink-0" aria-label="Clear chat">
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Button onClick={() => send()} disabled={loading || !input.trim()} size="icon" className="rounded-full h-9 w-9 shrink-0" aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> AI savage mode
          </span>
          <span>Enter = bhej · Shift+Enter = nayi line</span>
        </div>
      </div>
    </div>
  )
}
