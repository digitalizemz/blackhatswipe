'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, X, Bot, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { demoOffers, type Offer } from '@/lib/demo-offers'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

// Complete class strings so Tailwind JIT picks them up at build time
const accentMap: Record<string, string> = {
  blue:    'bg-blue-500',
  purple:  'bg-purple-500',
  red:     'bg-red-500',
  green:   'bg-green-500',
  pink:    'bg-pink-500',
  emerald: 'bg-emerald-500',
  orange:  'bg-orange-500',
  indigo:  'bg-indigo-500',
  amber:   'bg-amber-500',
  teal:    'bg-teal-500',
  lime:    'bg-lime-500',
  yellow:  'bg-yellow-500',
}

const MAX_MESSAGES = 20

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildSystem(offer: Offer | null): string {
  let s =
    'You are an AI assistant for direct response marketers. Help analyze winning offers, model copy angles, hooks, and VSL structures, and develop paid traffic scaling strategies. Be concise and actionable.'
  if (offer) {
    s += `\n\nCurrently analyzing:\n- Title: ${offer.title}\n- Niche: ${offer.niche}\n- Platform: ${offer.platform}\n- Format: ${offer.type}\n- Active ads: ${offer.ads.toLocaleString()}\n- Running: ${offer.days} ${offer.days === 1 ? 'day' : 'days'}\n- Status: ${offer.status}\n\nFocus your responses on what DR marketers can learn, model, and swipe from this specific offer.`
  }
  return s
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function OfferRow({
  offer,
  selected,
  onSelect,
}: {
  offer: Offer
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer border',
        selected
          ? 'bg-yellow-400/10 border-yellow-400/30 text-yellow-400'
          : 'border-transparent text-zinc-300 hover:bg-zinc-800/50'
      )}
    >
      <div
        className={cn(
          'w-1.5 h-8 rounded-full shrink-0',
          accentMap[offer.gradient] ?? 'bg-zinc-500'
        )}
      />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate leading-tight">{offer.title}</p>
        <p className="text-[10px] text-zinc-500 mt-0.5">
          {offer.niche} · {offer.platform}
        </p>
      </div>
      {selected && <span className="text-yellow-400 text-xs shrink-0">✓</span>}
    </button>
  )
}

function ThinkingDots() {
  return (
    <span className="flex items-center gap-1 py-0.5">
      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0ms]" />
      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:150ms]" />
      <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:300ms]" />
    </span>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`
  }, [input])

  const handleSend = async () => {
    const trimmedInput = input.trim()
    if (!trimmedInput || isStreaming) return

    setError(null)
    setInput('')

    const userMsg: Message = { role: 'user', content: trimmedInput }
    const history = [...messages, userMsg]
    // Keep at most MAX_MESSAGES, trimming from the oldest
    const trimmed =
      history.length > MAX_MESSAGES
        ? history.slice(history.length - MAX_MESSAGES)
        : history

    // Append user message + empty assistant placeholder
    setMessages([...trimmed, { role: 'assistant', content: '' }])
    setIsStreaming(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: trimmed,
          system: buildSystem(selectedOffer),
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      if (!res.body) throw new Error('No body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let content = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        content += decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const next = [...prev]
          next[next.length - 1] = { role: 'assistant', content }
          return next
        })
      }
    } catch {
      // Remove the empty assistant placeholder on error
      setMessages((prev) => prev.slice(0, -1))
      setError('Something went wrong. Try again.')
    } finally {
      setIsStreaming(false)
    }
  }

  const handleOfferSelect = (offer: Offer) => {
    setSelectedOffer((prev) => (prev?.id === offer.id ? null : offer))
    setIsSheetOpen(false)
  }

  // Shared offer list (used in both desktop panel and mobile sheet)
  const offerList = (
    <div className="space-y-0.5">
      {demoOffers.map((o) => (
        <OfferRow
          key={o.id}
          offer={o}
          selected={selectedOffer?.id === o.id}
          onSelect={() => handleOfferSelect(o)}
        />
      ))}
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-[#0A0A0A]">

      {/* ══ Left panel — desktop only ══════════════════════════════════════ */}
      <div className="hidden lg:flex w-[280px] shrink-0 bg-[#0A0A0A] border-r border-zinc-800/50 flex-col">
        {/* Panel header */}
        <div className="px-4 pt-6 pb-4 border-b border-zinc-800/50 shrink-0">
          <h2 className="text-white font-semibold text-sm mb-0.5">Offer Context</h2>
          <p className="text-zinc-500 text-xs">
            {selectedOffer
              ? 'Context loaded ✓'
              : 'Select an offer for focused analysis'}
          </p>
        </div>

        {/* Selected offer mini-card */}
        {selectedOffer && (
          <div className="mx-3 my-3 p-3 bg-zinc-800/40 rounded-xl border border-zinc-700/50 shrink-0">
            <div className="flex items-start gap-2">
              <div
                className={cn(
                  'w-2 h-2 rounded-full mt-1 shrink-0',
                  accentMap[selectedOffer.gradient] ?? 'bg-zinc-500'
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium leading-snug">
                  {selectedOffer.title}
                </p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {[selectedOffer.niche, selectedOffer.platform, selectedOffer.type].map(
                    (t) => (
                      <span
                        key={t}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-700/80 text-zinc-400"
                      >
                        {t}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedOffer(null)}
              className="mt-2.5 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              Clear context ×
            </button>
          </div>
        )}

        {/* Offer list */}
        <div className="flex-1 overflow-y-auto px-2 py-2">{offerList}</div>
      </div>

      {/* ══ Chat panel ═════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Chat header */}
        <div className="border-b border-zinc-800/50 px-4 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-sm leading-tight">
                AI Assistant
              </h1>
              <p className="text-zinc-500 text-[10px] leading-tight">
                {selectedOffer ? `Context: ${selectedOffer.title}` : 'No offer selected'}
              </p>
            </div>
          </div>

          {/* Mobile trigger */}
          <button
            onClick={() => setIsSheetOpen(true)}
            className="lg:hidden flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10 transition-colors cursor-pointer"
          >
            Select Offer
          </button>
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

          {/* Empty state */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <div className="w-12 h-12 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center mb-4">
                <Bot className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Ask about any offer</h3>
              <p className="text-zinc-500 text-sm max-w-xs leading-relaxed">
                Select an offer on the left for focused analysis, or ask any direct
                response marketing question.
              </p>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user'
            const isLastMsg = i === messages.length - 1
            const isStreamingThis = isLastMsg && !isUser && isStreaming

            return (
              <div
                key={i}
                className={cn('flex gap-2.5', isUser ? 'justify-end' : 'justify-start')}
              >
                {!isUser && (
                  <div className="w-6 h-6 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-yellow-400" />
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                    isUser
                      ? 'bg-yellow-400 text-black font-medium rounded-br-sm'
                      : 'bg-[#111111] border border-zinc-800 text-zinc-100 rounded-bl-sm'
                  )}
                >
                  {/* Thinking dots while waiting for first token */}
                  {isStreamingThis && msg.content === '' && <ThinkingDots />}

                  {/* Streamed / final content */}
                  {msg.content}

                  {/* Blinking cursor while streaming */}
                  {isStreamingThis && msg.content !== '' && (
                    <span className="inline-block w-0.5 h-3.5 bg-zinc-400 ml-0.5 animate-pulse align-middle" />
                  )}
                </div>
              </div>
            )
          })}

          {/* Error banner */}
          {error && (
            <div className="flex justify-center">
              <p className="text-xs text-red-400 bg-red-950/60 border border-red-800/60 px-3 py-1.5 rounded-lg">
                {error}
              </p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-zinc-800/50 px-4 py-3.5 shrink-0">
          <div className="flex gap-2 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder={
                selectedOffer
                  ? `Ask about "${selectedOffer.title}"…`
                  : 'Ask any DR marketing question…'
              }
              rows={1}
              disabled={isStreaming}
              className="flex-1 bg-[#111111] border border-zinc-800 text-white text-sm rounded-xl px-3.5 py-2.5 placeholder:text-zinc-600 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 resize-none disabled:opacity-50 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={isStreaming || !input.trim()}
              className="p-2.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all hover:brightness-110 shrink-0"
              style={{ backgroundColor: '#FACC15', color: '#000' }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-zinc-600 mt-1.5 px-1">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* ══ Mobile bottom sheet ════════════════════════════════════════════ */}
      {isSheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setIsSheetOpen(false)}
          />

          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-[#111111] border-t border-zinc-800 rounded-t-2xl max-h-[75vh] flex flex-col">
            {/* Drag handle */}
            <div className="flex justify-center pt-2.5 pb-0.5 shrink-0">
              <div className="w-8 h-1 rounded-full bg-zinc-700" />
            </div>

            {/* Sheet header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
              <h3 className="text-white font-semibold text-sm">Select Offer Context</h3>
              <button
                onClick={() => setIsSheetOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Offer list */}
            <div className="flex-1 overflow-y-auto px-2 py-3">{offerList}</div>
          </div>
        </div>
      )}
    </div>
  )
}
