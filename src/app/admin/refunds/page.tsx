'use client'

import { useEffect, useState, useCallback } from 'react'

interface RefundRequest {
  id:          string
  user_id:     string
  user_email:  string | null
  reason:      string
  description: string | null
  status:      string
  created_at:  string
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const STATUS_CLS: Record<string, string> = {
  pending:  'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20',
  approved: 'bg-green-400/10 text-green-400 border border-green-400/20',
  rejected: 'bg-red-400/10 text-red-400 border border-red-400/20',
}

export default function AdminRefundsPage() {
  const [requests, setRequests] = useState<RefundRequest[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/admin/get-refund-requests')
      const body = await res.json()
      if (!res.ok) { setError(body.error ?? 'Failed to load'); return }
      setRequests(body.requests ?? [])
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function updateStatus(id: string, status: 'approved' | 'rejected') {
    setUpdating(id)
    try {
      const res  = await fetch('/api/admin/update-refund-status', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id, status }),
      })
      const body = await res.json()
      if (!res.ok) { alert(body.error ?? 'Failed to update'); return }
      setRequests(prev =>
        prev.map(r => r.id === id ? { ...r, status } : r)
      )
    } finally {
      setUpdating(null)
    }
  }

  const pending  = requests.filter(r => r.status === 'pending').length
  const approved = requests.filter(r => r.status === 'approved').length
  const rejected = requests.filter(r => r.status === 'rejected').length

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Refund Requests</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Pending</p>
          <p className="text-3xl font-bold text-yellow-400">{pending}</p>
        </div>
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Approved</p>
          <p className="text-3xl font-bold text-green-400">{approved}</p>
        </div>
        <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-5">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Rejected</p>
          <p className="text-3xl font-bold text-red-400">{rejected}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-900/20 border border-red-500/20 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[#050505]">
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">User</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Reason</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Description</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Date</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-left">Status</th>
              <th className="text-xs uppercase text-zinc-500 tracking-wider px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[#1A1A1A]">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-zinc-800 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-zinc-600 text-sm">
                  No refund requests yet
                </td>
              </tr>
            ) : (
              requests.map(req => (
                <tr key={req.id} className="hover:bg-[#111111] border-b border-[#1A1A1A] last:border-0 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm text-zinc-200">{req.user_email ?? req.user_id.slice(0, 8)}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-300 max-w-[160px]">
                    {req.reason}
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500 max-w-[220px]">
                    <span className="line-clamp-2">{req.description || '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500 whitespace-nowrap">
                    {formatDate(req.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${STATUS_CLS[req.status] ?? STATUS_CLS.pending}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {req.status === 'pending' && (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => updateStatus(req.id, 'approved')}
                          disabled={updating === req.id}
                          className="text-xs px-2.5 h-7 rounded-lg border border-green-400/30 text-green-400 hover:bg-green-400/10 cursor-pointer transition-all disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => updateStatus(req.id, 'rejected')}
                          disabled={updating === req.id}
                          className="text-xs px-2.5 h-7 rounded-lg border border-red-400/20 text-red-400 hover:bg-red-400/10 cursor-pointer transition-all disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {req.status !== 'pending' && (
                      <span className="text-xs text-zinc-600">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
