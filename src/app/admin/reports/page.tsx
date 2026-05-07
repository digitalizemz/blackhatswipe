'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type FilterTab = 'open' | 'resolved' | 'all'

interface Report {
  id: string
  offer_id: string
  problem_type: string
  description: string | null
  status: string
  created_at: string
  offers: {
    title: string
    niches: { name: string } | null
  } | null
}

const TYPE_MAP: Record<string, { label: string; cls: string }> = {
  broken_link:   { label: '🔗 Broken link',    cls: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  missing_file:  { label: '📁 Missing file',   cls: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  wrong_info:    { label: '❌ Wrong info',      cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
  inappropriate: { label: '🔞 Inappropriate',  cls: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  other:         { label: '💬 Other',           cls: 'bg-zinc-700/50 text-zinc-400 border-zinc-600' },
}

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'open',     label: 'Open' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'all',      label: 'All' },
]

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const thCls = 'text-xs uppercase tracking-wider text-zinc-500 font-semibold px-5 py-3 text-left'

export default function AdminReportsPage() {
  const supabase = createClient()
  const [reports,   setReports]   = useState<Report[]>([])
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState<FilterTab>('open')
  const [resolving, setResolving] = useState<string | null>(null)
  const [deleting,  setDeleting]  = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = supabase
      .from('offer_reports')
      .select('*, offers(title, niches(name))')
      .order('created_at', { ascending: false })

    if (filter !== 'all') q = q.eq('status', filter)

    q.then(({ data }: { data: unknown }) => {
      setReports((data ?? []) as Report[])
      setLoading(false)
    })
  }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleResolve(id: string) {
    setResolving(id)
    const res = await fetch(`/api/admin/reports/${id}`, { method: 'PATCH' })
    if (res.ok) {
      setReports(prev =>
        prev.map(r => r.id === id ? { ...r, status: 'resolved' } : r)
      )
    }
    setResolving(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this report? This cannot be undone.')) return
    setDeleting(id)
    const res = await fetch(`/api/admin/reports/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setReports(prev => prev.filter(r => r.id !== id))
    }
    setDeleting(null)
  }

  return (
    <div className="p-8 bg-black min-h-screen">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">⚠️ Reports</h1>
          <p className="text-sm text-zinc-500 mt-1">User-submitted problems with offers</p>
        </div>
        <div className="flex gap-1">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 text-sm font-medium cursor-pointer transition-colors border-b-2 ${
                filter === tab.key
                  ? 'text-yellow-400 border-yellow-400'
                  : 'text-zinc-400 hover:text-white border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#111111] border-b border-[#1A1A1A]">
              <th className={thCls} style={{ minWidth: 200 }}>Offer</th>
              <th className={thCls} style={{ width: 170 }}>Type</th>
              <th className={thCls}>Description</th>
              <th className={thCls} style={{ width: 110 }}>Reported</th>
              <th className={thCls} style={{ width: 100 }}>Status</th>
              <th className={`${thCls} text-right`} style={{ width: 230 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[#1A1A1A]">
                  {[1, 2, 3, 4, 5, 6].map(j => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-3 bg-zinc-800 rounded animate-pulse w-20" />
                    </td>
                  ))}
                </tr>
              ))
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-zinc-600 text-sm">
                  No reports yet 🎉
                </td>
              </tr>
            ) : (
              reports.map(report => {
                const type = TYPE_MAP[report.problem_type] ?? TYPE_MAP.other
                return (
                  <tr
                    key={report.id}
                    className="border-b border-[#1A1A1A] last:border-0 hover:bg-[#111111] transition-colors"
                  >
                    {/* Offer */}
                    <td className="px-5 py-4">
                      <p className="text-sm text-white font-medium truncate max-w-[180px]">
                        {report.offers?.title ?? '—'}
                      </p>
                      {report.offers?.niches?.name && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 mt-1 inline-block">
                          {report.offers.niches.name}
                        </span>
                      )}
                    </td>

                    {/* Type */}
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full border whitespace-nowrap ${type.cls}`}>
                        {type.label}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="px-5 py-4 max-w-[260px]">
                      {report.description ? (
                        <p
                          className="text-sm text-zinc-400 truncate"
                          title={report.description}
                        >
                          {report.description.length > 60
                            ? report.description.slice(0, 60) + '…'
                            : report.description}
                        </p>
                      ) : (
                        <span className="text-zinc-600 text-sm">—</span>
                      )}
                    </td>

                    {/* Reported */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-sm text-zinc-500">{relativeTime(report.created_at)}</span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full border capitalize ${
                        report.status === 'resolved'
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}>
                        {report.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/offers/${report.offer_id}/edit`}
                          target="_blank"
                          className="text-xs border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                        >
                          View Offer →
                        </Link>
                        {report.status !== 'resolved' && (
                          <button
                            onClick={() => handleResolve(report.id)}
                            disabled={resolving === report.id}
                            className="text-xs border border-green-800 text-green-400 hover:bg-green-900/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
                          >
                            {resolving === report.id ? '…' : 'Resolve ✓'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(report.id)}
                          disabled={deleting === report.id}
                          className="text-xs text-red-500 hover:text-red-400 hover:bg-red-500/10 px-2 py-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {deleting === report.id ? '…' : '🗑'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
