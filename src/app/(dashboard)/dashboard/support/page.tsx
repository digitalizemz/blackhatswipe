'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const CATEGORIES = ['General Question', 'Billing Issue', 'Technical Problem', 'Content Request', 'Other']

const STATUS_BADGE: Record<string, string> = {
  open:        'bg-blue-500/20 text-blue-400 border-blue-500/30',
  in_progress: 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30',
  resolved:    'bg-green-500/20 text-green-400 border-green-500/30',
  closed:      'bg-zinc-700/50 text-zinc-400 border-zinc-600',
}
const STATUS_LABEL: Record<string, string> = {
  open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed',
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

interface Ticket {
  id: string; subject: string; category: string; priority: string
  status: string; assigned_name: string | null; updated_at: string; created_at: string
}

const REFUND_REASONS = [
  'Not what I expected',
  'Technical issues',
  'Duplicate charge',
  'Did not use the service',
  'Other',
]

// ── New Ticket Modal ──────────────────────────────────────────────────────────

interface NewTicketModalProps {
  onClose:   () => void
  onCreated: (ticket: Ticket) => void
}

function NewTicketModal({ onClose, onCreated }: NewTicketModalProps) {
  const [subject,      setSubject]      = useState('')
  const [category,     setCategory]     = useState(CATEGORIES[0])
  const [priority,     setPriority]     = useState<'normal' | 'urgent'>('normal')
  const [isRefund,     setIsRefund]     = useState(false)
  const [refundReason, setRefundReason] = useState(REFUND_REASONS[0])
  const [description,  setDescription]  = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const [error,        setError]        = useState('')
  const [senderName,   setSenderName]   = useState('')

  // Clear refund flag when leaving Billing Issue category
  useEffect(() => {
    if (category !== 'Billing Issue') setIsRefund(false)
  }, [category])

  const supabase = createClient()
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.full_name) setSenderName(user.user_metadata.full_name)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function submit() {
    if (!subject.trim())     { setError('Subject is required'); return }
    if (!description.trim()) { setError('Description is required'); return }
    setSubmitting(true); setError('')
    try {
      const effectiveSubject  = isRefund ? `[REFUND] ${subject.trim()}` : subject.trim()
      const effectivePriority = isRefund ? 'urgent' : priority
      const fullDescription   = isRefund
        ? `Refund reason: ${refundReason}\n\n${description}`
        : description
      const res  = await fetch('/api/support/tickets', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ subject: effectiveSubject, category, priority: effectivePriority, description: fullDescription, sender_name: senderName }),
      })
      const body = await res.json()
      if (!res.ok) { setError(body.error ?? 'Failed to create ticket'); return }
      onCreated(body.ticket)
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'w-full bg-[#111111] border border-[#1C1C1C] text-white rounded-lg px-4 text-sm focus:outline-none focus:border-yellow-400/50 transition-colors placeholder:text-zinc-600'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-2xl p-6 w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-white">Open New Ticket</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-xl leading-none cursor-pointer">×</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-zinc-300 mb-1.5 block">Subject *</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} className={`${inputCls} h-11`} placeholder="Brief description of your issue" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-zinc-300 mb-1.5 block">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className={`${inputCls} h-11 cursor-pointer`}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-zinc-300 mb-1.5 block">Priority</label>
              <div className="flex h-11 rounded-lg overflow-hidden border border-[#1C1C1C]">
                {(['normal', 'urgent'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => !isRefund && setPriority(p)}
                    className={`flex-1 text-sm font-medium transition-all capitalize ${
                      (isRefund ? p === 'urgent' : priority === p)
                        ? p === 'urgent'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-yellow-400/10 text-yellow-400'
                        : 'bg-[#111111] text-zinc-500 hover:text-zinc-300'
                    } ${isRefund ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Refund checkbox — only visible when Billing Issue is selected */}
          {category === 'Billing Issue' && (
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isRefund}
                onChange={e => setIsRefund(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-600 bg-[#111111] accent-yellow-400 cursor-pointer"
              />
              <span className="text-sm text-zinc-300">This is a refund request</span>
            </label>
          )}

          {/* Refund reason + note — only when refund checkbox is checked */}
          {isRefund && (
            <>
              <div>
                <label className="text-sm text-zinc-300 mb-1.5 block">Refund Reason</label>
                <select value={refundReason} onChange={e => setRefundReason(e.target.value)} className={`${inputCls} h-11 cursor-pointer`}>
                  {REFUND_REASONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-lg px-4 py-3 text-xs text-zinc-400 leading-relaxed">
                Refund requests are reviewed within 3–5 business days. We recommend first contacting support — most issues can be resolved quickly.
              </div>
            </>
          )}

          <div>
            <label className="text-sm text-zinc-300 mb-1.5 block">Description *</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={isRefund ? 'Describe why you are requesting a refund…' : 'Describe your issue in detail…'}
              rows={4}
              className={`${inputCls} py-3 resize-none`}
              style={{ minHeight: 100 }}
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

        <div className="flex gap-2 mt-5">
          <button
            onClick={submit}
            disabled={submitting}
            className="flex-1 h-11 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-lg text-sm cursor-pointer disabled:opacity-50 transition-all"
          >
            {submitting ? 'Opening…' : isRefund ? 'Submit Refund Request' : 'Open Ticket'}
          </button>
          <button onClick={onClose} className="flex-1 h-11 border border-zinc-700 text-zinc-400 hover:text-white rounded-lg text-sm cursor-pointer transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const [tickets,    setTickets]    = useState<Ticket[]>([])
  const [loading,    setLoading]    = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [showModal,  setShowModal]  = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const successTimer = useRef<ReturnType<typeof setTimeout>>()

  async function loadTickets() {
    setFetchError(null)
    try {
      const res = await fetch('/api/support/tickets')
      if (!res.ok) throw new Error('Failed to load tickets')
      const body = await res.json()
      setTickets(body.tickets ?? [])
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadTickets() }, [])

  function handleCreated(ticket: Ticket) {
    setShowModal(false)
    setTickets(prev => [ticket, ...prev])
    clearTimeout(successTimer.current)
    setSuccessMsg(`Ticket opened. We'll respond shortly.`)
    successTimer.current = setTimeout(() => setSuccessMsg(''), 4000)
  }

  if (fetchError) return (
    <div className="p-8 text-center">
      <p className="text-red-500 mb-4">{fetchError}</p>
      <button onClick={loadTickets} className="text-zinc-400 hover:text-white underline text-sm cursor-pointer">Try again</button>
    </div>
  )

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">🎫 Support</h1>
          <p className="text-sm text-zinc-500">Open a ticket and we&apos;ll get back to you</p>
        </div>
        <div className="flex items-center gap-3">
          {/* WhatsApp */}
          <a
            href="https://wa.me/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 text-sm font-medium transition-colors cursor-pointer"
          >
            💬 Live Support via WhatsApp
          </a>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-xl text-sm cursor-pointer transition-all"
          >
            + Open New Ticket
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 px-4 py-2.5 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-400">
          {successMsg}
        </div>
      )}

      {/* Ticket list */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-zinc-800 rounded w-48 mb-2" />
              <div className="h-3 bg-zinc-800 rounded w-32" />
            </div>
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-10 text-center">
          <p className="text-zinc-600 text-sm">No tickets yet. Open one above if you need help.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map(ticket => (
            <div key={ticket.id} className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-4 hover:border-zinc-700 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white mb-1.5 truncate">{ticket.subject}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-zinc-600 bg-zinc-800/50 px-2 py-0.5 rounded-md">{ticket.category}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_BADGE[ticket.status] ?? STATUS_BADGE.open}`}>
                      {STATUS_LABEL[ticket.status] ?? ticket.status}
                    </span>
                    {ticket.priority === 'urgent' && (
                      <span className="text-xs px-2 py-0.5 rounded-full border bg-red-500/10 text-red-400 border-red-500/20">
                        🔴 Urgent
                      </span>
                    )}
                    {ticket.assigned_name && (
                      <span className="text-xs text-zinc-500">Being handled by {ticket.assigned_name}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-xs text-zinc-600">{relativeTime(ticket.updated_at)}</span>
                  <Link
                    href={`/dashboard/support/${ticket.id}`}
                    className="text-xs text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
                  >
                    View Ticket →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <NewTicketModal
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
