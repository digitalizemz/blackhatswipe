'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const STATUS_BADGE: Record<string, string> = {
  open:        'bg-blue-500/20 text-blue-400 border-blue-500/30',
  in_progress: 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30',
  resolved:    'bg-green-500/20 text-green-400 border-green-500/30',
  closed:      'bg-zinc-700/50 text-zinc-400 border-zinc-600',
}
const STATUS_LABEL: Record<string, string> = {
  open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed',
}

function formatTs(iso: string) {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface Ticket {
  id: string; subject: string; category: string; priority: string
  status: string; assigned_name: string | null; created_at: string; updated_at: string
}
interface Message {
  id: string; sender_name: string; sender_role: string; message: string; created_at: string
}
interface Feedback {
  id: string; rating: number; comment: string | null
}

// ── Star Rating ───────────────────────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="text-2xl cursor-pointer transition-transform hover:scale-110"
        >
          {n <= (hover || value) ? '⭐' : '☆'}
        </button>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()

  const [ticket,     setTicket]     = useState<Ticket | null>(null)
  const [messages,   setMessages]   = useState<Message[]>([])
  const [feedback,   setFeedback]   = useState<Feedback | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [notFound,   setNotFound]   = useState(false)

  const [reply,      setReply]      = useState('')
  const [sending,    setSending]    = useState(false)
  const [sendErr,    setSendErr]    = useState('')

  const [fbRating,   setFbRating]   = useState(0)
  const [fbComment,  setFbComment]  = useState('')
  const [fbSending,  setFbSending]  = useState(false)
  const [fbDone,     setFbDone]     = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)

  async function load() {
    const res  = await fetch(`/api/support/tickets/${id}`)
    if (res.status === 404) { setNotFound(true); setLoading(false); return }
    const body = await res.json()
    setTicket(body.ticket)
    setMessages(body.messages ?? [])
    setFeedback(body.feedback ?? null)
    setLoading(false)
  }

  useEffect(() => { load() }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function sendReply() {
    if (!reply.trim()) return
    setSending(true); setSendErr('')
    const res  = await fetch('/api/support/messages', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ticket_id: id, message: reply }),
    })
    const body = await res.json()
    setSending(false)
    if (!res.ok) { setSendErr(body.error ?? 'Failed to send'); return }
    setMessages(prev => [...prev, body.message])
    setReply('')
  }

  async function submitFeedback() {
    if (!fbRating) return
    setFbSending(true)
    const res = await fetch('/api/support/feedback', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ticket_id: id, rating: fbRating, comment: fbComment }),
    })
    setFbSending(false)
    if (res.ok) setFbDone(true)
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-6 bg-zinc-800 rounded w-48 mb-4 animate-pulse" />
        <div className="h-64 bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl animate-pulse" />
      </div>
    )
  }

  if (notFound || !ticket) {
    return (
      <div className="p-8">
        <p className="text-zinc-500">Ticket not found.</p>
        <Link href="/dashboard/support" className="text-yellow-400 text-sm mt-2 inline-block">← Back to Support</Link>
      </div>
    )
  }

  const isClosed  = ticket.status === 'resolved' || ticket.status === 'closed'
  const isResolved = ticket.status === 'resolved'

  return (
    <div className="p-8 max-w-5xl">
      {/* Back */}
      <Link href="/dashboard/support" className="text-sm text-zinc-500 hover:text-white mb-4 inline-flex items-center gap-1 transition-colors">
        ← All Tickets
      </Link>

      <h1 className="text-xl font-bold text-white mt-2 mb-5 truncate">{ticket.subject}</h1>

      <div className="flex gap-5">
        {/* ── Left: Chat ── */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Messages */}
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl flex-1 flex flex-col" style={{ minHeight: 400, maxHeight: 520 }}>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(msg => {
                const isUser = msg.sender_role === 'user'
                return (
                  <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[80%] rounded-xl px-4 py-3 border text-sm ${
                      isUser
                        ? 'bg-yellow-400/10 border-yellow-400/20 text-white'
                        : 'bg-[#111111] border-[#1C1C1C] text-white'
                    }`}>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                    </div>
                    <div className={`flex items-center gap-2 mt-1 ${isUser ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs text-zinc-500">{msg.sender_name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isUser
                          ? 'bg-zinc-800 text-zinc-500'
                          : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {isUser ? 'You' : 'Staff'}
                      </span>
                      <span className="text-xs text-zinc-700">{formatTs(msg.created_at)}</span>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Reply input */}
          {!isClosed && (
            <div className="mt-3">
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Write a reply…"
                rows={3}
                className="w-full bg-[#0D0D0D] border border-[#1A1A1A] text-white text-sm rounded-xl px-4 py-3 resize-none focus:outline-none focus:border-yellow-400/50 placeholder:text-zinc-600"
                onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendReply() }}
              />
              {sendErr && <p className="text-xs text-red-400 mt-1">{sendErr}</p>}
              <button
                onClick={sendReply}
                disabled={sending || !reply.trim()}
                className="mt-2 px-5 h-10 bg-yellow-400 hover:bg-yellow-500 text-black text-sm font-semibold rounded-lg cursor-pointer disabled:opacity-50 transition-all"
              >
                {sending ? 'Sending…' : 'Send Reply'}
              </button>
            </div>
          )}

          {/* Feedback */}
          {isResolved && (
            <div className="mt-4 bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
              {feedback || fbDone ? (
                <p className="text-sm text-green-400">Thank you for your feedback! ⭐</p>
              ) : (
                <>
                  <h3 className="text-sm font-semibold text-white mb-3">How was your experience?</h3>
                  <StarRating value={fbRating} onChange={setFbRating} />
                  <textarea
                    value={fbComment}
                    onChange={e => setFbComment(e.target.value)}
                    placeholder="Optional comment…"
                    rows={2}
                    className="w-full mt-3 bg-[#111111] border border-[#1C1C1C] text-white text-sm rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-yellow-400/50 placeholder:text-zinc-600"
                  />
                  <button
                    onClick={submitFeedback}
                    disabled={fbSending || !fbRating}
                    className="mt-3 px-5 h-9 bg-yellow-400 hover:bg-yellow-500 text-black text-sm font-semibold rounded-lg cursor-pointer disabled:opacity-50 transition-all"
                  >
                    {fbSending ? 'Submitting…' : 'Submit Feedback'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Right: Info ── */}
        <div className="w-56 shrink-0 space-y-4">
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Status</p>
            <span className={`text-sm font-semibold px-3 py-1.5 rounded-full border ${STATUS_BADGE[ticket.status]}`}>
              {STATUS_LABEL[ticket.status]}
            </span>
          </div>

          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-4 space-y-3 text-sm">
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Category</p>
              <p className="text-zinc-300">{ticket.category}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Priority</p>
              <p className={ticket.priority === 'urgent' ? 'text-red-400' : 'text-zinc-300'}>
                {ticket.priority === 'urgent' ? '🔴 Urgent' : '⚪ Normal'}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Opened</p>
              <p className="text-zinc-300">{formatDate(ticket.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Assigned to</p>
              <p className="text-zinc-300">{ticket.assigned_name ?? 'Awaiting assignment'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
