'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const STATUS_BADGE: Record<string, string> = {
  open:        'bg-blue-500/20 text-blue-400 border-blue-500/30',
  in_progress: 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30',
  resolved:    'bg-green-500/20 text-green-400 border-green-500/30',
  closed:      'bg-zinc-700/50 text-zinc-400 border-zinc-600',
}
const STATUS_LABEL: Record<string, string> = {
  open: 'Open', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed',
}

type TabFilter = 'all' | 'open' | 'in_progress' | 'resolved' | 'closed'

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
  status: string; user_email: string; assigned_name: string | null
  updated_at: string; created_at: string
}

export default function AdminSupportPage() {
  const [tickets,  setTickets]  = useState<Ticket[]>([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState<TabFilter>('all')

  useEffect(() => {
    fetch('/api/admin/support')
      .then(r => r.json())
      .then(body => { setTickets(body.tickets ?? []); setLoading(false) })
  }, [])

  const counts = {
    all:         tickets.length,
    open:        tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved:    tickets.filter(t => t.status === 'resolved').length,
    closed:      tickets.filter(t => t.status === 'closed').length,
  }

  const displayed = tab === 'all' ? tickets : tickets.filter(t => t.status === tab)

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'all',         label: `All (${counts.all})`                   },
    { key: 'open',        label: `Open (${counts.open})`                 },
    { key: 'in_progress', label: `In Progress (${counts.in_progress})`   },
    { key: 'resolved',    label: `Resolved (${counts.resolved})`         },
    { key: 'closed',      label: `Closed (${counts.closed})`             },
  ]

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Support Tickets</h1>
          <p className="text-sm text-zinc-500">Manage user support requests</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Open',        value: counts.open,        color: 'text-blue-400'   },
          { label: 'In Progress', value: counts.in_progress, color: 'text-yellow-400' },
          { label: 'Resolved',    value: counts.resolved,    color: 'text-green-400'  },
          { label: 'Total',       value: counts.all,         color: 'text-white'      },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-1 w-fit">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition-all cursor-pointer ${
              tab === key
                ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-zinc-900 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-zinc-600 text-sm">No tickets in this category</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1A1A1A]">
                <th className="text-left text-xs text-zinc-500 font-medium uppercase tracking-wider px-5 py-3">Subject</th>
                <th className="text-left text-xs text-zinc-500 font-medium uppercase tracking-wider px-4 py-3">User</th>
                <th className="text-left text-xs text-zinc-500 font-medium uppercase tracking-wider px-4 py-3">Category</th>
                <th className="text-left text-xs text-zinc-500 font-medium uppercase tracking-wider px-4 py-3">Priority</th>
                <th className="text-left text-xs text-zinc-500 font-medium uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-xs text-zinc-500 font-medium uppercase tracking-wider px-4 py-3">Assigned</th>
                <th className="text-left text-xs text-zinc-500 font-medium uppercase tracking-wider px-4 py-3">Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {displayed.map((ticket, i) => (
                <tr
                  key={ticket.id}
                  className={`border-b border-[#111111] hover:bg-[#111111] transition-colors ${
                    i === displayed.length - 1 ? 'border-b-0' : ''
                  }`}
                >
                  <td className="px-5 py-3.5 max-w-[220px]">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-white font-medium truncate">{ticket.subject}</p>
                      {ticket.category === 'Billing Issue' && ticket.subject.toLowerCase().includes('refund') && (
                        <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-wide">
                          Refund
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 max-w-[160px]">
                    <p className="text-zinc-400 text-xs truncate">{ticket.user_email}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-md whitespace-nowrap">
                      {ticket.category}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {ticket.priority === 'urgent' ? (
                      <span className="text-xs text-red-400 font-medium">🔴 Urgent</span>
                    ) : (
                      <span className="text-xs text-zinc-600">Normal</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_BADGE[ticket.status] ?? STATUS_BADGE.open}`}>
                      {STATUS_LABEL[ticket.status] ?? ticket.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-xs text-zinc-500 truncate">{ticket.assigned_name ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-xs text-zinc-600 whitespace-nowrap">{relativeTime(ticket.updated_at)}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/admin/support/${ticket.id}`}
                      className="text-xs text-yellow-400 hover:text-yellow-300 font-medium transition-colors whitespace-nowrap"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
