'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams }   from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

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
  status: string; user_email: string
  assigned_to: string | null; assigned_name: string | null
  created_at: string; updated_at: string
}
interface Message {
  id: string; sender_name: string; sender_role: string; message: string; created_at: string
}

export default function AdminTicketDetailPage() {
  const { id }    = useParams<{ id: string }>()
  const supabase  = createClient()

  const [ticket,    setTicket]    = useState<Ticket | null>(null)
  const [messages,  setMessages]  = useState<Message[]>([])
  const [loading,   setLoading]   = useState(true)
  const [notFound,  setNotFound]  = useState(false)

  const [reply,     setReply]     = useState('')
  const [sending,   setSending]   = useState(false)
  const [sendErr,   setSendErr]   = useState('')

  const [statusVal, setStatusVal] = useState('')
  const [updating,  setUpdating]  = useState(false)

  const [adminId,   setAdminId]   = useState('')
  const [adminName, setAdminName] = useState('')

  const bottomRef = useRef<HTMLDivElement>(null)

  async function load() {
    const res  = await fetch(`/api/admin/support/${id}`)
    if (res.status === 404) { setNotFound(true); setLoading(false); return }
    const body = await res.json()
    setTicket(body.ticket)
    setMessages(body.messages ?? [])
    setStatusVal(body.ticket.status)
    setLoading(false)
  }

  useEffect(() => {
    load()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setAdminId(user.id)
        setAdminName(user.user_metadata?.full_name ?? user.email ?? 'Staff')
      }
    })
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

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

  async function updateStatus(newStatus: string) {
    setUpdating(true)
    const res = await fetch(`/api/admin/support/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: newStatus }),
    })
    setUpdating(false)
    if (res.ok) {
      setStatusVal(newStatus)
      setTicket(prev => prev ? { ...prev, status: newStatus } : prev)
    }
  }

  async function assignToMe() {
    if (!adminId) return
    setUpdating(true)
    const res = await fetch(`/api/admin/support/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ assigned_to: adminId, assigned_name: adminName }),
    })
    setUpdating(false)
    if (res.ok) {
      setTicket(prev => prev
        ? { ...prev, assigned_to: adminId, assigned_name: adminName }
        : prev
      )
    }
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
        <Link href="/admin/support" className="text-yellow-400 text-sm mt-2 inline-block">← Back to Support</Link>
      </div>
    )
  }

  const isClosed = ticket.status === 'resolved' || ticket.status === 'closed'

  return (
    <div className="p-8 max-w-5xl">
      <Link href="/admin/support" className="text-sm text-zinc-500 hover:text-white mb-4 inline-flex items-center gap-1 transition-colors">
        ← All Tickets
      </Link>

      <h1 className="text-xl font-bold text-white mt-2 mb-1 truncate">{ticket.subject}</h1>
      <p className="text-sm text-zinc-500 mb-5">{ticket.user_email}</p>

      <div className="flex gap-5">
        {/* ── Left: Chat ── */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl flex-1 flex flex-col" style={{ minHeight: 400, maxHeight: 520 }}>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && (
                <p className="text-zinc-600 text-sm text-center py-8">No messages yet</p>
              )}
              {messages.map(msg => {
                const isUser = msg.sender_role === 'user'
                return (
                  <div key={msg.id} className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}>
                    <div className={`max-w-[80%] rounded-xl px-4 py-3 border text-sm ${
                      isUser
                        ? 'bg-[#111111] border-[#1C1C1C] text-white'
                        : 'bg-yellow-400/10 border-yellow-400/20 text-white'
                    }`}>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                    </div>
                    <div className={`flex items-center gap-2 mt-1 ${isUser ? '' : 'flex-row-reverse'}`}>
                      <span className="text-xs text-zinc-500">{msg.sender_name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        isUser
                          ? 'bg-zinc-800 text-zinc-500'
                          : 'bg-yellow-400/10 text-yellow-400'
                      }`}>
                        {isUser ? 'User' : 'Staff'}
                      </span>
                      <span className="text-xs text-zinc-700">{formatTs(msg.created_at)}</span>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Reply */}
          {!isClosed && (
            <div className="mt-3">
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Write a reply as staff…"
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
        </div>

        {/* ── Right: Controls ── */}
        <div className="w-60 shrink-0 space-y-4">
          {/* Status */}
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Status</p>
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${STATUS_BADGE[ticket.status]}`}>
                {STATUS_LABEL[ticket.status]}
              </span>
            </div>
            <select
              value={statusVal}
              onChange={e => updateStatus(e.target.value)}
              disabled={updating}
              className="w-full bg-[#111111] border border-[#1C1C1C] text-white text-sm rounded-lg px-3 h-9 focus:outline-none focus:border-yellow-400/50 cursor-pointer disabled:opacity-50"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Assignment */}
          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-3">Assignment</p>
            <p className="text-sm text-zinc-300 mb-3">
              {ticket.assigned_name ?? <span className="text-zinc-600">Unassigned</span>}
            </p>
            {ticket.assigned_to !== adminId && (
              <button
                onClick={assignToMe}
                disabled={updating}
                className="w-full h-9 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 text-sm font-medium rounded-lg cursor-pointer disabled:opacity-50 transition-colors border border-yellow-400/20"
              >
                {updating ? 'Saving…' : 'Assign to me'}
              </button>
            )}
            {ticket.assigned_to === adminId && (
              <p className="text-xs text-green-400">Assigned to you</p>
            )}
          </div>

          {/* Ticket info */}
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
              <p className="text-xs text-zinc-500 mb-0.5">User</p>
              <p className="text-zinc-300 text-xs break-all">{ticket.user_email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
